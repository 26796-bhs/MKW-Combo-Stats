"""Server-side combo stat calculation (moved from static/modules/calculation.js)."""

# Max combined values used to normalise bars to 0–1.
MAXIMUM_VALUE = [
    17,  # Speed
    19,  # Acceleration
    19,  # Mini-turbo
    16,  # Weight
    15,  # Handling
]


def calculate_stats(char, veh):
    """
    Calculate normalised combo stats from character and vehicle rows.

    Character columns:
        [0] HiddenID, [1] Name, [2] MiniTurbo, [3] SpeedOnRoad, [4] SpeedOffRoad,
        [5] SpeedOnWater, [6] Acceleration, [7] Weight, [8] HandlingOnRoad,
        [9] HandlingOffRoad, [10] HandlingOnWater, [11] ImageUrl

    Vehicle columns:
        [0] HiddenID, [1] Name, [2] VehicleType, [3] MiniTurbo, [4] SpeedOnRoad,
        [5] SpeedOffRoad, [6] SpeedOnWater, [7] Acceleration, [8] Weight,
        [9] HandlingOnRoad, [10] HandlingOffRoad, [11] HandlingOnWater, [12] ImageUrl

    Returns:
        [spdSr, spdRr, spdWt, hndSr, hndRr, hndWt, acc, turbo, weight]
    """
    if not char or not veh:
        return [0.0] * 9

    speed_sr = (char[3] + veh[4]) / MAXIMUM_VALUE[0]
    speed_rr = (char[4] + veh[5]) / MAXIMUM_VALUE[0]
    speed_wt = (char[5] + veh[6]) / MAXIMUM_VALUE[0]

    handling_sr = (char[8] + veh[9]) / MAXIMUM_VALUE[4]
    handling_rr = (char[9] + veh[10]) / MAXIMUM_VALUE[4]
    handling_wt = (char[10] + veh[11]) / MAXIMUM_VALUE[4]

    acc = (char[6] + veh[7]) / MAXIMUM_VALUE[1]
    turbo = (char[2] + veh[3]) / MAXIMUM_VALUE[2]
    weight = (char[7] + veh[8]) / MAXIMUM_VALUE[3]

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
