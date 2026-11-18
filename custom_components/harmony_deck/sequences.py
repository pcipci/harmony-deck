"""Runs actions step by step, one run per hub at a time, independent of any open card.

Status per hub (read by the "Sequence" sensor and through it by the card)::

    {"state": "idle" | "running" | "done" | "stopped" | "error",
     "action": id, "name": name, "step": 1-based number of the current (or failed / last) step, "total": n,
     "first": 1-based number of the first step of this run, "error": message or None,
     "started": iso, "step_started": iso, "finished": iso or None, "draft": bool,
     "skipped": 1-based numbers of the steps an "if" skipped in this run}
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

from homeassistant.core import Context, HomeAssistant, callback
from homeassistant.util import dt as dt_util

from .actionsmodel import MAX_RUNTIME
from .steps import STEP_TYPES, Flow, RunContext, StepError

_LOGGER = logging.getLogger(__name__)


class BusyError(Exception):
    """Another action runs on this hub."""


class SequenceRunner:
    """Carries out actions; tells listeners about every change of a hub's status."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._tasks: dict[str, asyncio.Task] = {}
        self._status: dict[str, dict[str, Any]] = {}
        self._listeners: list[Callable[[str], None]] = []

    # ---- status ---------------------------------------------------------------------------
    def status(self, hub: str) -> dict[str, Any]:
        return dict(self._status.get(hub) or {"state": "idle"})

    def running(self, hub: str) -> bool:
        task = self._tasks.get(hub)
        return bool(task and not task.done())

    @callback
    def async_add_listener(self, listener: Callable[[str], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    @callback
    def _set(self, hub: str, **changes: Any) -> None:
        self._status[hub] = {**self._status.get(hub, {}), **changes}
        for listener in list(self._listeners):
            listener(hub)

    # ---- start / stop ---------------------------------------------------------------------
    async def async_start(
        self,
        hub: str,
        action: dict[str, Any],
        *,
        devices: dict[str, list[str]] | None = None,
        from_step: int = 0,
        only_step: int | None = None,
        context: Context | None = None,
        draft: bool = False,
    ) -> None:
        """Check all steps, then run them in the background. Raises BusyError or StepError (nothing sent then)."""
        if self.running(hub):
            raise BusyError(hub)
        steps = action["steps"]
        if only_step is not None:
            if not 0 <= only_step < len(steps):
                raise StepError("no such step")
            first, last = only_step, only_step + 1
        else:
            if not 0 <= from_step < len(steps):
                raise StepError("no such step")
            first, last = from_step, len(steps)
        ctx = RunContext(self.hass, hub, devices, context)
        for n in range(first, last):
            try:
                STEP_TYPES[steps[n]["type"]].check(ctx, steps[n])
            except StepError as err:
                raise StepError(f"step {n + 1}: {err}") from err
        now = dt_util.utcnow().isoformat()
        self._set(hub, state="running", action=action.get("id"), name=action.get("name"), step=first + 1, first=first + 1,
                  total=len(steps), error=None, started=now, step_started=now, finished=None, draft=draft, skipped=[])
        task = self.hass.async_create_background_task(self._run(ctx, steps, first, last), f"harmony_deck action {hub}")
        self._tasks[hub] = task

    @callback
    def async_stop(self, hub: str) -> bool:
        """Stop the run of a hub between two steps (a pause ends at once). False if nothing runs."""
        task = self._tasks.get(hub)
        if not task or task.done():
            return False
        task.cancel()
        return True

    @callback
    def async_stop_all(self) -> None:
        for hub in list(self._tasks):
            self.async_stop(hub)

    async def _run(self, ctx: RunContext, steps: list[dict[str, Any]], first: int, last: int) -> None:
        hub = ctx.hub
        n = first
        skipped: list[int] = []
        try:
            async with asyncio.timeout(MAX_RUNTIME):
                while n < last:
                    self._set(hub, step=n + 1, step_started=dt_util.utcnow().isoformat())
                    flow = await STEP_TYPES[steps[n]["type"]].run(ctx, steps[n])
                    if isinstance(flow, Flow) and flow.end:
                        skipped += range(n + 2, last + 1)
                        self._set(hub, skipped=list(skipped))
                        break
                    jump = flow.skip if isinstance(flow, Flow) else 0
                    if jump:
                        skipped += range(n + 2, min(n + 2 + jump, last + 1))
                        self._set(hub, skipped=list(skipped))
                    n += 1 + jump
        except asyncio.CancelledError:
            self._set(hub, state="stopped", step=n + 1, finished=dt_util.utcnow().isoformat())
            return
        except TimeoutError:
            self._set(hub, state="error", step=n + 1, error="too long", finished=dt_util.utcnow().isoformat())
            return
        except StepError as err:
            self._set(hub, state="error", step=n + 1, error=str(err), finished=dt_util.utcnow().isoformat())
            return
        except Exception as err:  # noqa: BLE001 - never leave a run "running"
            _LOGGER.exception("Action on %s failed in step %s", hub, n + 1)
            self._set(hub, state="error", step=n + 1, error=str(err) or type(err).__name__, finished=dt_util.utcnow().isoformat())
            return
        finally:
            if self._tasks.get(hub) is asyncio.current_task():
                self._tasks.pop(hub, None)
        self._set(hub, state="done", step=last, finished=dt_util.utcnow().isoformat())
