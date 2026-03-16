"""DTID scoring engine -- grades player performance after scenario ends."""

from __future__ import annotations

import math

from app.models import (
    BaseTemplate,
    DroneStartConfig,
    PlacementConfig,
    PlayerAction,
    ScenarioConfig,
    ScoreBreakdown,
)


def calculate_score(
    scenario: ScenarioConfig,
    actions: list[PlayerAction],
    detection_time: float,
    confirm_time: float | None,
    identify_time: float | None,
    engage_time: float | None,
    classification_given: str | None,
    affiliation_given: str | None,
    effector_used: str | None,
    drone_reached_base: bool,
    confidence_at_identify: float,
    placement_config: PlacementConfig | None = None,
    base_template: BaseTemplate | None = None,
) -> ScoreBreakdown:
    details: dict[str, str] = {}

    # --- Detection Response (20%) ---
    if confirm_time is not None and detection_time is not None:
        response_delay = confirm_time - detection_time
        if response_delay <= 5.0:
            detection_response_score = 100.0
            details["detection_response"] = f"Confirmed track within {response_delay:.1f}s of detection"
        elif response_delay <= 10.0:
            detection_response_score = 80.0
            details["detection_response"] = f"Confirmed track in {response_delay:.1f}s (slightly slow)"
        elif response_delay <= 20.0:
            detection_response_score = 50.0
            details["detection_response"] = f"Confirmed track in {response_delay:.1f}s (slow)"
        else:
            detection_response_score = 20.0
            details["detection_response"] = f"Confirmed track in {response_delay:.1f}s (very slow)"
    else:
        detection_response_score = 0.0
        details["detection_response"] = "Track was never confirmed"

    if drone_reached_base:
        detection_response_score = max(0, detection_response_score - 30)
        details["detection_response"] += " -- DRONE REACHED BASE"

    # --- Tracking (15%) ---
    if identify_time is not None and confirm_time is not None:
        tracking_duration = identify_time - confirm_time
        if confidence_at_identify >= 0.7 and tracking_duration >= 3.0:
            tracking_score = 100.0
            details["tracking"] = "Good sensor correlation before identification"
        elif confidence_at_identify >= 0.5:
            tracking_score = 70.0
            details["tracking"] = "Adequate sensor data before identification"
        elif tracking_duration < 2.0:
            tracking_score = 30.0
            details["tracking"] = "Rushed identification without adequate sensor correlation"
        else:
            tracking_score = 50.0
            details["tracking"] = "Limited sensor confidence at time of identification"
    elif confirm_time is not None:
        tracking_score = 20.0
        details["tracking"] = "Track confirmed but never identified"
    else:
        tracking_score = 0.0
        details["tracking"] = "No tracking performed"

    # --- Identification (25%) ---
    correct_class = scenario.correct_classification.value
    correct_affil = scenario.correct_affiliation.value

    if classification_given is not None and affiliation_given is not None:
        class_correct = classification_given == correct_class
        affil_correct = affiliation_given == correct_affil

        if class_correct and affil_correct:
            identification_score = 100.0
            details["identification"] = f"Correctly identified as {classification_given}"
        elif class_correct:
            identification_score = 60.0
            details["identification"] = f"Correct classification but wrong affiliation ({affiliation_given})"
        elif affil_correct:
            identification_score = 40.0
            details["identification"] = f"Correct affiliation but wrong classification ({classification_given})"
        else:
            identification_score = 0.0
            details["identification"] = f"Misidentified as {classification_given}/{affiliation_given}"
    elif classification_given is not None:
        identification_score = 30.0
        details["identification"] = "Classified but affiliation not set"
    else:
        identification_score = 0.0
        details["identification"] = "Threat was not identified"

    # --- Defeat Method (25%) ---
    if effector_used is not None:
        if effector_used in scenario.optimal_effectors:
            defeat_score = 100.0
            effector_label = effector_used.replace("_", " ").title()
            details["defeat"] = f"{effector_label} was optimal response"
        elif effector_used in scenario.acceptable_effectors:
            defeat_score = 70.0
            effector_label = effector_used.replace("_", " ").title()
            details["defeat"] = f"{effector_label} was acceptable but not optimal"
        else:
            defeat_score = 30.0
            effector_label = effector_used.replace("_", " ").title()
            details["defeat"] = f"{effector_label} was a poor choice"
    else:
        if drone_reached_base:
            defeat_score = 0.0
            details["defeat"] = "No engagement -- base compromised"
        else:
            defeat_score = 10.0
            details["defeat"] = "No engagement attempted"

    # --- ROE Compliance (15%) ---
    engage_actions = [a for a in actions if a.action == "engage"]
    roe_violations_found = []
    for a in engage_actions:
        if a.effector and a.effector in scenario.roe_violations:
            roe_violations_found.append(a.effector)

    if not roe_violations_found:
        roe_score = 100.0
        details["roe"] = "All actions within ROE"
    else:
        roe_score = 0.0
        violated = ", ".join(roe_violations_found)
        details["roe"] = f"ROE violation: {violated}"

    # --- Total ---
    total = (
        detection_response_score * 0.20
        + tracking_score * 0.15
        + identification_score * 0.25
        + defeat_score * 0.25
        + roe_score * 0.15
    )

    grade = _total_to_grade(total)

    # --- Placement scoring (Phase 2) ---
    placement_score_val = None
    placement_details_val = None
    if placement_config is not None and base_template is not None:
        placement_score_val, placement_details_val = calculate_placement_score(
            placement_config, base_template
        )

    return ScoreBreakdown(
        detection_response_score=round(detection_response_score, 1),
        tracking_score=round(tracking_score, 1),
        identification_score=round(identification_score, 1),
        defeat_score=round(defeat_score, 1),
        roe_score=round(roe_score, 1),
        total_score=round(total, 1),
        grade=grade,
        details=details,
        placement_score=placement_score_val,
        placement_details=placement_details_val,
    )


def calculate_placement_score(
    placement: PlacementConfig,
    base: BaseTemplate,
) -> tuple[float, dict[str, str]]:
    """Score the player's sensor/effector placement quality."""
    details: dict[str, str] = {}
    from app.bases import load_base
    from app.bases import load_equipment_catalog

    catalog = load_equipment_catalog()
    sensor_catalog = {s.catalog_id: s for s in catalog.sensors}
    effector_catalog = {e.catalog_id: e for e in catalog.effectors}

    # 1. Coverage completeness (40%) — sample approach corridors
    total_corridors = len(base.approach_corridors)
    covered_corridors = 0
    for corridor in base.approach_corridors:
        bearing_rad = math.radians(corridor.bearing_deg)
        # Sample point at 3km along this bearing from base center
        sample_x = 3.0 * math.sin(bearing_rad)
        sample_y = 3.0 * math.cos(bearing_rad)

        for placed in placement.sensors:
            cat = sensor_catalog.get(placed.catalog_id)
            if cat is None:
                continue
            dist = math.sqrt((sample_x - placed.x) ** 2 + (sample_y - placed.y) ** 2)
            if dist <= cat.range_km:
                covered_corridors += 1
                break

    coverage_pct = covered_corridors / max(1, total_corridors)
    coverage_score = coverage_pct * 100
    details["coverage"] = f"{covered_corridors}/{total_corridors} approach corridors covered"

    # 2. Sensor overlap quality (25%) — count corridors with 2+ sensors
    overlap_corridors = 0
    for corridor in base.approach_corridors:
        bearing_rad = math.radians(corridor.bearing_deg)
        sample_x = 2.0 * math.sin(bearing_rad)
        sample_y = 2.0 * math.cos(bearing_rad)

        sensor_count = 0
        for placed in placement.sensors:
            cat = sensor_catalog.get(placed.catalog_id)
            if cat is None:
                continue
            dist = math.sqrt((sample_x - placed.x) ** 2 + (sample_y - placed.y) ** 2)
            if dist <= cat.range_km:
                sensor_count += 1
        if sensor_count >= 2:
            overlap_corridors += 1

    overlap_pct = overlap_corridors / max(1, total_corridors)
    overlap_score = overlap_pct * 100
    details["overlap"] = f"{overlap_corridors}/{total_corridors} corridors with multi-sensor coverage"

    # 3. Effector positioning (25%) — can effectors reach threats at 1.5km on each corridor?
    corridors_with_effector = 0
    for corridor in base.approach_corridors:
        bearing_rad = math.radians(corridor.bearing_deg)
        sample_x = 1.5 * math.sin(bearing_rad)
        sample_y = 1.5 * math.cos(bearing_rad)

        for placed in placement.effectors:
            cat = effector_catalog.get(placed.catalog_id)
            if cat is None:
                continue
            dist = math.sqrt((sample_x - placed.x) ** 2 + (sample_y - placed.y) ** 2)
            if dist <= cat.range_km:
                corridors_with_effector += 1
                break

    eff_pct = corridors_with_effector / max(1, total_corridors)
    effector_score = eff_pct * 100
    details["effector_reach"] = f"{corridors_with_effector}/{total_corridors} corridors within effector range"

    # 4. LOS management (10%) — check if LOS sensors avoid being behind buildings
    los_sensors = [p for p in placement.sensors if sensor_catalog.get(p.catalog_id, None) and sensor_catalog[p.catalog_id].requires_los]
    if los_sensors:
        unblocked = 0
        checks = 0
        for placed in los_sensors:
            for corridor in base.approach_corridors:
                checks += 1
                bearing_rad = math.radians(corridor.bearing_deg)
                sample_x = 1.5 * math.sin(bearing_rad)
                sample_y = 1.5 * math.cos(bearing_rad)
                blocked = False
                for terrain in base.terrain:
                    if not terrain.blocks_los:
                        continue
                    poly = terrain.polygon
                    n = len(poly)
                    for i in range(n):
                        px1, py1 = poly[i]
                        px2, py2 = poly[(i + 1) % n]
                        from app.detection import _segments_intersect
                        if _segments_intersect(placed.x, placed.y, sample_x, sample_y, px1, py1, px2, py2):
                            blocked = True
                            break
                    if blocked:
                        break
                if not blocked:
                    unblocked += 1

        los_pct = unblocked / max(1, checks)
        los_score = los_pct * 100
        details["los"] = f"{round(los_pct * 100)}% of LOS sensor sightlines unblocked"
    else:
        los_score = 100.0
        details["los"] = "No LOS-dependent sensors placed"

    # Weighted total
    total = (
        coverage_score * 0.40
        + overlap_score * 0.25
        + effector_score * 0.25
        + los_score * 0.10
    )

    return round(total, 1), details


def calculate_multi_track_score(
    scenario: ScenarioConfig,
    drone_configs: dict[str, DroneStartConfig],
    actions: list[PlayerAction],
    detection_times: dict[str, float],
    confirm_times: dict[str, float],
    identify_times: dict[str, float],
    engage_times: dict[str, float],
    classifications_given: dict[str, str],
    affiliations_given: dict[str, str],
    effectors_used: dict[str, str],
    confidences_at_identify: dict[str, float],
    drone_reached_base: bool,
    placement_config: PlacementConfig | None = None,
    base_template: BaseTemplate | None = None,
) -> ScoreBreakdown:
    """Score each drone independently, then average across all drones equally."""
    per_drone_scores: list[dict[str, float]] = []
    all_details: dict[str, str] = {}

    for drone_id, cfg in drone_configs.items():
        # Resolve per-drone scoring params (fall back to scenario defaults)
        correct_class = cfg.correct_classification or scenario.correct_classification.value
        correct_affil = cfg.correct_affiliation or scenario.correct_affiliation.value
        optimal = cfg.optimal_effectors if cfg.optimal_effectors is not None else scenario.optimal_effectors
        acceptable = cfg.acceptable_effectors if cfg.acceptable_effectors is not None else scenario.acceptable_effectors
        roe_viol = cfg.roe_violations if cfg.roe_violations is not None else scenario.roe_violations
        should_engage = cfg.should_engage

        # Filter actions for this drone
        drone_actions = [a for a in actions if a.target_id == drone_id]

        # --- Detection Response (20%) ---
        det_time = detection_times.get(drone_id)
        conf_time = confirm_times.get(drone_id)
        if conf_time is not None and det_time is not None:
            delay = conf_time - det_time
            if delay <= 5.0:
                det_score = 100.0
            elif delay <= 10.0:
                det_score = 80.0
            elif delay <= 20.0:
                det_score = 50.0
            else:
                det_score = 20.0
        else:
            det_score = 0.0

        # --- Tracking (15%) ---
        id_time = identify_times.get(drone_id)
        if id_time is not None and conf_time is not None:
            tracking_dur = id_time - conf_time
            conf_val = confidences_at_identify.get(drone_id, 0.0)
            if conf_val >= 0.7 and tracking_dur >= 3.0:
                track_score = 100.0
            elif conf_val >= 0.5:
                track_score = 70.0
            elif tracking_dur < 2.0:
                track_score = 30.0
            else:
                track_score = 50.0
        elif conf_time is not None:
            track_score = 20.0
        else:
            track_score = 0.0

        # --- Identification (25%) ---
        class_given = classifications_given.get(drone_id)
        affil_given = affiliations_given.get(drone_id)
        if class_given is not None and affil_given is not None:
            class_ok = class_given == correct_class
            affil_ok = affil_given == correct_affil
            if class_ok and affil_ok:
                id_score = 100.0
            elif class_ok:
                id_score = 60.0
            elif affil_ok:
                id_score = 40.0
            else:
                id_score = 0.0
        elif class_given is not None:
            id_score = 30.0
        else:
            id_score = 0.0

        # --- Defeat Method (25%) ---
        eff_used = effectors_used.get(drone_id)
        if not should_engage:
            # Bird/false positive: NOT engaging is correct
            if eff_used is None:
                defeat_score = 100.0
                all_details[f"{drone_id}_defeat"] = "Correctly did not engage (false positive)"
            else:
                defeat_score = 0.0
                all_details[f"{drone_id}_defeat"] = "Engaged a non-threat — incorrect"
        elif eff_used is not None:
            if eff_used in optimal:
                defeat_score = 100.0
            elif eff_used in acceptable:
                defeat_score = 70.0
            else:
                defeat_score = 30.0
        else:
            defeat_score = 0.0 if drone_reached_base else 10.0

        # --- ROE Compliance (15%) ---
        engage_acts = [a for a in drone_actions if a.action == "engage"]
        roe_found = []
        for a in engage_acts:
            if a.effector and a.effector in roe_viol:
                roe_found.append(a.effector)
        # Engaging a bird/false positive is also an ROE penalty
        if not should_engage and eff_used is not None:
            roe_score = 0.0
            all_details[f"{drone_id}_roe"] = "ROE violation: engaged non-threat"
        elif roe_found:
            roe_score = 0.0
        else:
            roe_score = 100.0

        per_drone_scores.append({
            "detection": det_score,
            "tracking": track_score,
            "identification": id_score,
            "defeat": defeat_score,
            "roe": roe_score,
        })

    # Average across all drones equally
    n = len(per_drone_scores) or 1
    avg_det = sum(s["detection"] for s in per_drone_scores) / n
    avg_track = sum(s["tracking"] for s in per_drone_scores) / n
    avg_id = sum(s["identification"] for s in per_drone_scores) / n
    avg_defeat = sum(s["defeat"] for s in per_drone_scores) / n
    avg_roe = sum(s["roe"] for s in per_drone_scores) / n

    total = (
        avg_det * 0.20
        + avg_track * 0.15
        + avg_id * 0.25
        + avg_defeat * 0.25
        + avg_roe * 0.15
    )

    grade = _total_to_grade(total)

    details = {
        "detection_response": f"Average across {n} tracks: {avg_det:.0f}",
        "tracking": f"Average across {n} tracks: {avg_track:.0f}",
        "identification": f"Average across {n} tracks: {avg_id:.0f}",
        "defeat": f"Average across {n} tracks: {avg_defeat:.0f}",
        "roe": f"Average across {n} tracks: {avg_roe:.0f}",
    }
    details.update(all_details)

    # Placement scoring
    placement_score_val = None
    placement_details_val = None
    if placement_config is not None and base_template is not None:
        placement_score_val, placement_details_val = calculate_placement_score(
            placement_config, base_template
        )

    return ScoreBreakdown(
        detection_response_score=round(avg_det, 1),
        tracking_score=round(avg_track, 1),
        identification_score=round(avg_id, 1),
        defeat_score=round(avg_defeat, 1),
        roe_score=round(avg_roe, 1),
        total_score=round(total, 1),
        grade=grade,
        details=details,
        placement_score=placement_score_val,
        placement_details=placement_details_val,
    )


def _total_to_grade(total: float) -> str:
    if total >= 95:
        return "S"
    if total >= 85:
        return "A"
    if total >= 70:
        return "B"
    if total >= 50:
        return "C"
    return "F"
