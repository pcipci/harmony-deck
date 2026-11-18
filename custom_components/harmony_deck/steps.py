"""Step types of an action: how each one is checked and carried out.

Every type has the same small interface (check before a run, run). The runner in sequences.py only calls
these; a new type is one class here plus one cleaner in actionsmodel.py.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

from homeassistant.core import Context, HomeAssistant

from . import direct, irvolume
from .conditions import holds
from .const import DOMAIN
from .values import DEFAULT_VOLUME_CAP, calls, out_of_range, unsupported

_SERVICE_TIMEOUT = 30  # seconds, one service call
_PRESS = ("button", "input_button")
_RUN = ("scene", "script", "automation")


class StepError(Exception):
    """A step cannot run; the message is shown in the card (English, short)."""


@dataclass
class RunContext:
    """What a step needs to know about the run it belongs to."""

    hass: HomeAssistant
    hub: str                                        # remote entity id of the Harmony hub
    devices: dict[str, list[str]] | None = None     # commands per device as the hub knows them (None = unknown)
    context: Context | None = None                  # who started it (shows in the logbook)
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class Flow:
    """What the runner does after a step: go on (default), skip the next `skip` steps, or end the action."""

    skip: int = 0
    end: bool = False


class StepType:
    """Base of all step types. run() may return a Flow to change the order; None means "next step"."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        """Raise StepError if the step cannot run (called for all steps before the first one is sent)."""

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> Flow | None:
        raise NotImplementedError


class KeyStep(StepType):
    """Send a command of a Harmony device through the hub."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        if ctx.devices is None:
            return
        cmds = ctx.devices.get(step["device"])
        if cmds is None:
            raise StepError(f"unknown device: {step['device']}")
        if step["command"] not in cmds:
            raise StepError(f"unknown key: {step['device']} / {step['command']}")

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        state = ctx.hass.states.get(ctx.hub)
        if state is None or state.state == "unavailable":
            raise StepError("hub not available")
        data = {"entity_id": ctx.hub, "device": step["device"], "command": step["command"]}
        if step.get("repeat", 1) > 1:
            data["num_repeats"] = step["repeat"]
        await _call(ctx, "remote", "send_command", data)


class PauseStep(StepType):
    """Wait a few seconds (the runner cancels it on stop)."""

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        await asyncio.sleep(step["secs"])


_POLL = 0.5  # seconds between two looks while waiting


def _holds(ctx: RunContext, cond: dict[str, Any]) -> bool:
    state = ctx.hass.states.get(cond["entity"])
    return holds(cond, None if state is None else state.state, None if state is None else dict(state.attributes))


def _check_cond(ctx: RunContext, cond: dict[str, Any]) -> None:
    if ctx.hass.states.get(cond["entity"]) is None:
        raise StepError(f"unknown entity: {cond['entity']}")


class WaitStep(StepType):
    """Wait until a condition holds (at most `timeout` seconds). Stop ends the wait at once."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        _check_cond(ctx, step["cond"])

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> Flow | None:
        loop = asyncio.get_running_loop()
        end = loop.time() + step["timeout"]
        while not _holds(ctx, step["cond"]):
            if loop.time() >= end:
                if step["onTimeout"] == "continue":
                    return None
                raise StepError(f"waited {step['timeout']:g} s, condition not met")
            await asyncio.sleep(min(_POLL, max(end - loop.time(), 0.01)))
        return None


class IfStep(StepType):
    """Look at a condition once: holds -> next step; else skip some steps, end the action, or fail."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        _check_cond(ctx, step["cond"])

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> Flow | None:
        if _holds(ctx, step["cond"]):
            return None
        if step["else"] == "end":
            return Flow(end=True)
        if step["else"] == "fail":
            raise StepError(step.get("message") or "condition not met")
        return Flow(skip=step.get("skip", 1))


def _settings(ctx: RunContext) -> dict[str, Any]:
    return (ctx.hass.data.get(DOMAIN) or {}).get("settings") or {}


def volume_cap(ctx: RunContext) -> int:
    try:
        return int(_settings(ctx).get("volumeCap") or DEFAULT_VOLUME_CAP)
    except (TypeError, ValueError):
        return DEFAULT_VOLUME_CAP


class HaStep(StepType):
    """Switch or start a Home Assistant entity, optionally with values (brightness, volume, source ...)."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        state = ctx.hass.states.get(step["entity"])
        if state is None:
            raise StepError(f"unknown entity: {step['entity']}")
        values = step.get("values") or {}
        if (key := unsupported(step["entity"], values, dict(state.attributes))) is not None:
            raise StepError(f"{step['entity']} cannot set {key}")
        if "volume" in values and values["volume"] > volume_cap(ctx):
            raise StepError(f"volume above the limit ({volume_cap(ctx)} %)")

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        values = step.get("values")
        if not values:
            domain, service = ha_service(step["entity"], step["op"])
            await _call(ctx, domain, service, {"entity_id": step["entity"]})
            return
        for domain, service, data in (calls(step["entity"], step["op"], values)):
            # Checked right before each call: a player that was just switched on reports its sources only now.
            state = ctx.hass.states.get(step["entity"])
            if len(data) > 1 and state is not None:
                problem = out_of_range(step["entity"], values, dict(state.attributes), volume_cap(ctx))
                if problem:
                    raise StepError(problem)
            await _call(ctx, domain, service, data)


class DevStep(StepType):
    """Talk to the direct device of a Harmony device (on, off, volume, mute, source) without the hub."""

    def _entity(self, ctx: RunContext, step: dict[str, Any]) -> str:
        linked = direct.device_of(ctx.hass, ctx.hub, step["device"])
        if linked is None:
            raise StepError(f"{step['device']} has no direct device")
        return linked["entity"]

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        entity = self._entity(ctx, step)
        if ctx.hass.states.get(entity) is None:
            raise StepError(f"unknown entity: {entity}")
        if step["op"] == "volume" and step["value"] > volume_cap(ctx):
            raise StepError(f"volume above the limit ({volume_cap(ctx)} %)")

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        # Capabilities are checked only now: a TV that is off may report less than when it is on.
        try:
            await direct.run(ctx.hass, self._entity(ctx, step), step["op"], step.get("value"), ctx.context)
        except TimeoutError as err:
            raise StepError(f"{step['device']}: no answer") from err
        except ValueError as err:
            raise StepError(str(err)) from err
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - the message goes to the card
            raise StepError(f"{step['device']}: {err}") from err


class IrVolumeStep(StepType):
    """Set the volume of an infrared device: down to 0, then up to the level (see irvolume.py)."""

    def _cfg(self, ctx: RunContext, step: dict[str, Any]) -> dict[str, float]:
        return irvolume.device_config(_settings(ctx).get("irVolume"), ctx.hub, step["device"])

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        cfg = self._cfg(ctx, step)
        if step["level"] > cfg["max"]:
            raise StepError(f"level above the highest volume ({cfg['max']:g})")
        if ctx.devices is None:
            return
        cmds = ctx.devices.get(step["device"])
        if cmds is None:
            raise StepError(f"unknown device: {step['device']}")
        if None in irvolume.commands(cmds):
            raise StepError(f"{step['device']} has no volume keys")

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        cfg = self._cfg(ctx, step)
        linked = direct.device_of(ctx.hass, ctx.hub, step["device"])
        if linked and linked["volumeDirect"] and "volume_set" in direct.caps(ctx.hass, linked["entity"]):
            # The device takes a level directly: no counting down and up.
            percent = min(step["level"], cfg["max"]) / cfg["max"] * 100
            try:
                await direct.run(ctx.hass, linked["entity"], "volume", percent, ctx.context)
            except (TimeoutError, ValueError) as err:
                raise StepError(f"{step['device']}: {err or 'no answer'}") from err
            return
        state = ctx.hass.states.get(ctx.hub)
        if state is None or state.state == "unavailable":
            raise StepError("hub not available")
        up, down = irvolume.commands((ctx.devices or {}).get(step["device"]) or [])
        up, down = up or "VolumeUp", down or "VolumeDown"
        presses_down, presses_up = irvolume.plan(cfg, step["level"])
        for command, presses in ((down, presses_down), (up, presses_up)):
            for n in irvolume.chunks(presses):
                data = {"entity_id": ctx.hub, "device": step["device"], "command": command, "num_repeats": n, "delay_secs": cfg["delay"]}
                await _call(ctx, "remote", "send_command", data, timeout=n * cfg["delay"] + 15)


def ha_service(entity: str, op: str) -> tuple[str, str]:
    """Service for an entity and an operation (toggle, on, off, run)."""
    domain = entity.split(".", 1)[0]
    if domain in _PRESS:
        return domain, "press"
    if op == "off":
        return "homeassistant", "turn_off"
    if op == "on":
        return "homeassistant", "turn_on"
    if op == "run" or domain in _RUN:
        if domain == "automation":
            return "automation", "trigger"
        return (domain if domain in ("scene", "script") else "homeassistant"), "turn_on"
    return "homeassistant", "toggle"


async def _call(ctx: RunContext, domain: str, service: str, data: dict[str, Any], timeout: float = _SERVICE_TIMEOUT) -> None:
    try:
        async with asyncio.timeout(timeout):
            await ctx.hass.services.async_call(domain, service, data, blocking=True, context=ctx.context)
    except TimeoutError as err:
        raise StepError(f"{domain}.{service}: no answer") from err
    except StepError:
        raise
    except asyncio.CancelledError:
        raise
    except Exception as err:  # noqa: BLE001 - the message goes to the card
        raise StepError(f"{domain}.{service}: {err}") from err


STEP_TYPES: dict[str, StepType] = {"key": KeyStep(), "pause": PauseStep(), "ha": HaStep(), "irvol": IrVolumeStep(), "wait": WaitStep(), "if": IfStep(), "dev": DevStep()}
