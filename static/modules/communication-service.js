import { calculate_stats } from "./calculation.js";

const origin = window.location.origin;
export async function get_combo(id_one, id_two) {
    if (!id_one || !id_two) return [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const characterdata = await fetch(`${origin}/characters/${id_one}`).then(res => res.json());
    const vehicledata = await fetch(`${origin}/vehicles/${id_two}`).then(res => res.json());
    return await calculate_stats(characterdata, vehicledata) || [0, 0, 0, 0, 0, 0, 0, 0, 0];
};