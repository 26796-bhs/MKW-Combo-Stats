//Stats calculation now runs on the Flask server (calculation.py).
// Kept so if anything still references this module will not cause errors.

export async function calculate_stats() {
    throw new Error("calculate_stats moved to the server — use GET /combo/<char>/<veh>");
}