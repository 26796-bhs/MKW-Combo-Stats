const maximum_value = [
    17, //Speed (max of char+veh spdSr)
    19, //Acceleration (max of char+veh acc)
    19, //Mini-turbo (max of char+veh mtb)
    16, //Weight (max of char+veh wgt)
    15  //Handling (max of char+veh hndSr)
];

async function get_percentage(statstype, stats_one, stats_two) {
    return (stats_one + stats_two) / maximum_value[statstype];
};

export async function calculate_stats(characterdata, vehicledata) {
    console.log(characterdata, vehicledata);
    
    // The target website uses a weighted average for Speed and Handling based on terrain:
    // Speed = (Speed_Smooth * 0.65) + (Speed_Rough * 0.25) + (Speed_Water * 0.10)
    // Handling = (Handling_Smooth * 0.65) + (Handling_Rough * 0.25) + (Handling_Water * 0.10)
    
    const PERCENT_GR = 0.65; // Smooth road
    const PERCENT_RR = 0.25; // Rough road
    const PERCENT_WT = 0.10; // Water

    const char = characterdata[0];
    const veh = vehicledata[0];

    // SQLite SELECT * returns columns in definition order.
    // Characters: [0]=HiddenID, [1]=Name, [2]=MiniTurbo, [3]=SpeedOnRoad, [4]=SpeedOffRoad,
    //             [5]=SpeedOnWater, [6]=Acceleration, [7]=Weight, [8]=HandlingOnRoad,
    //             [9]=HandlingOffRoad, [10]=HandlingOnWater, [11]=ImageUrl
    // Vehicles:   [0]=HiddenID, [1]=Name, [2]=VehicleType, [3]=MiniTurbo, [4]=SpeedOnRoad,
    //             [5]=SpeedOffRoad, [6]=SpeedOnWater, [7]=Acceleration, [8]=Weight,
    //             [9]=HandlingOnRoad, [10]=HandlingOffRoad, [11]=HandlingOnWater, [12]=ImageUrl

    // The UI expects nine percentages in this order:
    //   [spdSr, spdRr, spdWt, hndSr, hndRr, hndWt, acc, turbo, weight]

    // Individual speed percentages (on‑road, off‑road, water) – char indices 3,4,5 / veh indices 4,5,6
    const speedSr = (char[3] + veh[4]) / maximum_value[0];
    const speedRr = (char[4] + veh[5]) / maximum_value[0];
    const speedWt = (char[5] + veh[6]) / maximum_value[0];

    // Individual handling percentages (on‑road, off‑road, water) – char indices 8,9,10 / veh indices 9,10,11
    const handlingSr = (char[8] + veh[9]) / maximum_value[4];
    const handlingRr = (char[9] + veh[10]) / maximum_value[4];
    const handlingWt = (char[10] + veh[11]) / maximum_value[4];

    // Acceleration (char[6] / veh[7]), Turbo/MiniTurbo (char[2] / veh[3]), Weight (char[7] / veh[8])
    const acc = (char[6] + veh[7]) / maximum_value[1];
    const turbo = (char[2] + veh[3]) / maximum_value[2];
    const weight = (char[7] + veh[8]) / maximum_value[3];

    return [
        speedSr,
        speedRr,
        speedWt,
        handlingSr,
        handlingRr,
        handlingWt,
        acc,
        turbo,
        weight,
    ];
}