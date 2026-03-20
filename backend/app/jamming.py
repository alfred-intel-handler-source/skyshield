"""EW (Electronic Warfare) jamming logic — jam behaviour selection and
jammed-drone movement updates."""

from __future__ import annotations

import math
import random

from app.config import KTS_TO_KMS
from app.models import DroneState, DroneType


# Per-type jam resistance probability (chance that jam has NO effect)
JAM_RESIST: dict[DroneType, float] = {
    DroneType.COMMERCIAL_QUAD: 0.0,   # Fully jammable — GPS + RF dependent
    DroneType.MICRO: 0.10,            # Mostly jammable — small GPS receiver
    DroneType.FIXED_WING: 0.40,       # Partial — may have basic autopilot
    DroneType.IMPROVISED: 0.50,       # Unknown RF dependency — coin flip
    DroneType.SHAHED: 1.0,            # Jam-immune — autonomous INS nav, no RF link
}
# Default for any type not listed (e.g. bird, swarm)
_DEFAULT_JAM_RESIST = 0.50


def pick_jam_behavior(drone_type: DroneType) -> str | None:
    """Pick a jammed behavior for the drone.

    Returns ``None`` if the jam fails based on per-type resistance.
    SHAHED always returns None (autonomous INS navigation, no RF link).
    """
    resist = JAM_RESIST.get(drone_type, _DEFAULT_JAM_RESIST)
    if random.random() < resist:
        return None  # Jam fails
    return random.choice(["loss_of_control", "rth", "forced_landing", "gps_spoof"])


def update_jammed_drone(
    drone: DroneState,
    tick_rate: float,
    elapsed: float,
) -> tuple[DroneState, list[dict]]:
    """Advance a jammed drone by one tick.

    Returns the updated ``DroneState`` and a (possibly empty) list of event
    dicts to broadcast.
    """
    events: list[dict] = []

    # Decrement jam timer
    drone = drone.model_copy(update={
        "jammed_time_remaining": drone.jammed_time_remaining - tick_rate,
    })

    jb = drone.jammed_behavior

    if jb == "loss_of_control":
        speed_kms = drone.speed * KTS_TO_KMS * 0.5  # half-speed drift
        heading_rad = math.radians(drone.heading)
        new_x = drone.x + math.sin(heading_rad) * speed_kms * tick_rate
        new_y = drone.y + math.cos(heading_rad) * speed_kms * tick_rate
        new_alt = max(0, drone.altitude - 15 * tick_rate)
        trail = list(drone.trail)
        trail.append([round(new_x, 3), round(new_y, 3)])
        if len(trail) > 20:
            trail = trail[-20:]
        drone = drone.model_copy(update={
            "x": new_x, "y": new_y, "altitude": new_alt,
            "speed": drone.speed * 0.95, "trail": trail,
        })
        if new_alt <= 0 or drone.jammed_time_remaining <= 0:
            drone = drone.model_copy(update={
                "neutralized": True, "jammed_time_remaining": 0, "altitude": 0,
            })
            events.append({
                "type": "event",
                "timestamp": round(elapsed, 1),
                "message": f"TRACK: {drone.id.upper()} — CRASHED (loss of control)",
            })

    elif jb == "rth":
        away_angle = math.atan2(drone.y, drone.x)
        speed_kms = drone.speed * KTS_TO_KMS
        new_x = drone.x + math.cos(away_angle) * speed_kms * tick_rate
        new_y = drone.y + math.sin(away_angle) * speed_kms * tick_rate
        heading_deg = math.degrees(away_angle) % 360
        trail = list(drone.trail)
        trail.append([round(new_x, 3), round(new_y, 3)])
        if len(trail) > 20:
            trail = trail[-20:]
        drone = drone.model_copy(update={
            "x": new_x, "y": new_y, "heading": heading_deg, "trail": trail,
        })
        if math.sqrt(new_x ** 2 + new_y ** 2) > 10.0:
            drone = drone.model_copy(update={
                "neutralized": True, "jammed_time_remaining": 0,
            })
            events.append({
                "type": "event",
                "timestamp": round(elapsed, 1),
                "message": f"TRACK: {drone.id.upper()} — RTH (left area)",
            })

    elif jb == "forced_landing":
        new_alt = max(0, drone.altitude - 50 * tick_rate)
        drone = drone.model_copy(update={
            "altitude": new_alt,
            "speed": max(0, drone.speed - 5 * tick_rate),
        })
        if new_alt <= 0:
            drone = drone.model_copy(update={
                "neutralized": True, "jammed_time_remaining": 0,
                "altitude": 0, "speed": 0,
            })
            events.append({
                "type": "event",
                "timestamp": round(elapsed, 1),
                "message": f"TRACK: {drone.id.upper()} — FORCED LANDING (grounded)",
            })

    elif jb == "gps_spoof":
        spoof_heading = (
            drone.heading + random.uniform(90, 180) * random.choice([-1, 1])
        ) % 360
        heading_rad = math.radians(spoof_heading)
        speed_kms = drone.speed * KTS_TO_KMS
        new_x = drone.x + math.sin(heading_rad) * speed_kms * tick_rate
        new_y = drone.y + math.cos(heading_rad) * speed_kms * tick_rate
        trail = list(drone.trail)
        trail.append([round(new_x, 3), round(new_y, 3)])
        if len(trail) > 20:
            trail = trail[-20:]
        drone = drone.model_copy(update={
            "x": new_x, "y": new_y, "heading": spoof_heading, "trail": trail,
        })
        if math.sqrt(new_x ** 2 + new_y ** 2) > 10.0:
            drone = drone.model_copy(update={
                "neutralized": True, "jammed_time_remaining": 0,
            })
            events.append({
                "type": "event",
                "timestamp": round(elapsed, 1),
                "message": f"TRACK: {drone.id.upper()} — GPS SPOOFED (left area)",
            })

    return drone, events
