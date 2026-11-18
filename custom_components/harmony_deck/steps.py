"""Step types of an action: how each one is checked and carried out.

Every type has the same small interface (check before a run, run). The runner in sequences.py only calls
these; a new type is one class here plus one cleaner in actionsmodel.py.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any

from homeassistant.core import Context, HomeAssistant

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


class StepType:
    """Base of all step types."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        """Raise StepError if the step cannot run (called for all steps before the first one is sent)."""

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
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


class HaStep(StepType):
    """Switch or start a Home Assistant entity."""

    def check(self, ctx: RunContext, step: dict[str, Any]) -> None:
        if ctx.hass.states.get(step["entity"]) is None:
            raise StepError(f"unknown entity: {step['entity']}")

    async def run(self, ctx: RunContext, step: dict[str, Any]) -> None:
        domain, service = ha_service(step["entity"], step["op"])
        await _call(ctx, domain, service, {"entity_id": step["entity"]})


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


async def _call(ctx: RunContext, domain: str, service: str, data: dict[str, Any]) -> None:
    try:
        async with asyncio.timeout(_SERVICE_TIMEOUT):
            await ctx.hass.services.async_call(domain, service, data, blocking=True, context=ctx.context)
    except TimeoutError as err:
        raise StepError(f"{domain}.{service}: no answer") from err
    except StepError:
        raise
    except asyncio.CancelledError:
        raise
    except Exception as err:  # noqa: BLE001 - the message goes to the card
        raise StepError(f"{domain}.{service}: {err}") from err


STEP_TYPES: dict[str, StepType] = {"key": KeyStep(), "pause": PauseStep(), "ha": HaStep()}
