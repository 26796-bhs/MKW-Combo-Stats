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
    console.log(characterdata, vehicledata)
    return [
        await get_percentage(0, characterdata[0][2], vehicledata[0][2]) || 0,
        await get_percentage(0, characterdata[0][3], vehicledata[0][3]) || 0,
        await get_percentage(0, characterdata[0][4], vehicledata[0][4]) || 0,

        await get_percentage(0, characterdata[0][5], vehicledata[0][5]) || 0,
        await get_percentage(0, characterdata[0][6], vehicledata[0][6]) || 0,
        await get_percentage(0, characterdata[0][7], vehicledata[0][7]) || 0,

        await get_percentage(0, characterdata[0][8], vehicledata[0][8]) || 0,
        await get_percentage(0, characterdata[0][9], vehicledata[0][9]) || 0,
        await get_percentage(0, characterdata[0][10], vehicledata[0][10]) || 0,
    ];
};