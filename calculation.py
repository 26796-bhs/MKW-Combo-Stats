"""Perform calculation"""
# Server-side combo stat calculation
# (moved from static/modules/calculation.js).

# Max combined values used to normalise bars to 0–1.
MAXIMUM_VALUE = [
    17,  # Speed
    19,  # Acceleration
    19,  # Mini-turbo
    16,  # Weight
    15,  # Handling
]


def calculate_stats(character, vehicle):
    """
    Calculate normalised combo stats from character and vehicle rows.

    Character columns include SpeedOnRoad, SpeedOffRoad, SpeedOnWater,
    Acceleration, Weight, HandlingOnRoad, HandlingOffRoad,
    HandlingOnWater, MiniTurbo, and ImageUrl.

    Vehicle columns include the same values plus VehicleType and ImageUrl.

    Returns:
        [spdSr, spdRr, spdWt, hndSr, hndRr, hndWt, acc, turbo, weight]
    """
    if not character or not vehicle:
        return [0.0] * 9

    speed_sr = (
        character["SpeedOnRoad"] + vehicle["SpeedOnRoad"]
    ) / MAXIMUM_VALUE[0]
    speed_rr = (
        character["SpeedOffRoad"] + vehicle["SpeedOffRoad"]
    ) / MAXIMUM_VALUE[0]
    speed_wt = (
        character["SpeedOnWater"] + vehicle["SpeedOnWater"]
    ) / MAXIMUM_VALUE[0]

    handling_sr = (
        character["HandlingOnRoad"] + vehicle["HandlingOnRoad"]
    ) / MAXIMUM_VALUE[4]
    handling_rr = (
        character["HandlingOffRoad"] + vehicle["HandlingOffRoad"]
    ) / MAXIMUM_VALUE[4]
    handling_wt = (
        character["HandlingOnWater"] + vehicle["HandlingOnWater"]
    ) / MAXIMUM_VALUE[4]

    acc = (
        character["Acceleration"] + vehicle["Acceleration"]
    ) / MAXIMUM_VALUE[1]
    turbo = (
        character["MiniTurbo"] + vehicle["MiniTurbo"]
    ) / MAXIMUM_VALUE[2]
    weight = (
        character["Weight"] + vehicle["Weight"]
    ) / MAXIMUM_VALUE[3]

    return [
        speed_sr,
        speed_rr,
        speed_wt,
        handling_sr,
        handling_rr,
        handling_wt,
        acc,
        turbo,
        weight,
    ]
