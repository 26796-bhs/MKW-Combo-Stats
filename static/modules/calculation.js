const maximum_value = [
    17, //Speed
    19, //acceleration
    19, //mini-turbo
    16, //weight
    15 //handling
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

    // Based on stats-worker.js:
    // index 0: MTB, 1: SpdSr, 2: SpdRr, 3: SpdWt, 4: Acc, 5: Wgt, 6: HndSr, 7: HndRr, 8: HndWt
    // In your current app, characterdata and vehicledata seem to have offsets.
    // I will maintain the indices you were using but apply the weighting.
    
    const spd = (char[3] + veh[3]) * PERCENT_GR + (char[4] + veh[4]) * PERCENT_RR + (char[5] + veh[5]) * PERCENT_WT;
    const hnd = (char[8] + veh[8]) * PERCENT_GR + (char[9] + veh[9]) * PERCENT_RR + (char[10] + veh[10]) * PERCENT_WT;

    return [
        (char[2] + veh[2]) / maximum_value[2], // MTB
        spd / maximum_value[0],                 // Speed (Weighted)
        (char[6] + veh[6]) / maximum_value[1], // Acc
        (char[7] + veh[7]) / maximum_value[3], // Weight
        hnd / maximum_value[4]                 // Handling (Weighted)
    ];
}