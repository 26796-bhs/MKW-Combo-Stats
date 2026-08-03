from flask import Flask, g, render_template, request, abort, jsonify, Response
import sqlite3
import urllib.error
import urllib.request
from urllib.parse import urlparse

from calculation import calculate_stats

DATABASE = "database.db"
ALLOWED_IMAGE_HOSTS = {
    "mario.wiki.gallery",
    "static.wikia.nocookie.net",
}

# Named column lists — avoid SELECT * so queries stay explicit.
CHARACTER_COLUMNS = (
    "HiddenID, Name, MiniTurbo, SpeedOnRoad, SpeedOffRoad, SpeedOnWater, "
    "Acceleration, Weight, HandlingOnRoad, HandlingOffRoad, HandlingOnWater, ImageUrl"
)
VEHICLE_COLUMNS = (
    "HiddenID, Name, VehicleType, MiniTurbo, SpeedOnRoad, SpeedOffRoad, SpeedOnWater, "
    "Acceleration, Weight, HandlingOnRoad, HandlingOffRoad, HandlingOnWater, ImageUrl"
)
MAP_COLUMNS = (
    "HiddenID, Name, Road, OffRoad, Water, BestCharacterSpeed, BestVehicleSpeed, "
    "BestCharacterTurbo, BestVehicleTurbo, ImageUrl"
)

app = Flask(__name__)


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.execute("PRAGMA foreign_keys = ON")
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def execute_db(query, args=()):
    """Run an INSERT/UPDATE/DELETE and commit."""
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    cur.close()


def ensure_combo_votes_table():
    """Create ComboVotes if missing (write-side support for upvotes)."""
    execute_db(
        """
        CREATE TABLE IF NOT EXISTS ComboVotes (
            CharacterID INTEGER NOT NULL REFERENCES Characters(HiddenID),
            VehicleID INTEGER NOT NULL REFERENCES Vehicles(HiddenID),
            Upvotes INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (CharacterID, VehicleID)
        )
        """
    )


with app.app_context():
    ensure_combo_votes_table()


def get_upvote_count(character_id, vehicle_id):
    row = query_db(
        "SELECT Upvotes FROM ComboVotes WHERE CharacterID = ? AND VehicleID = ?",
        [character_id, vehicle_id],
        one=True,
    )
    return row[0] if row else 0


@app.route("/")
def home():
    characters = query_db(f"SELECT {CHARACTER_COLUMNS} FROM Characters")
    vehicles = query_db(f"SELECT {VEHICLE_COLUMNS} FROM Vehicles")
    preload_urls = list({
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    initial_upvotes = 0
    if characters and vehicles:
        initial_upvotes = get_upvote_count(characters[0][0], vehicles[0][0])
    return render_template(
        "home.html",
        characters=characters,
        vehicles=vehicles,
        preload_urls=preload_urls,
        initial_upvotes=initial_upvotes,
    )


@app.route("/Selection")
def selection():
    maps = query_db(f"SELECT {MAP_COLUMNS} FROM Maps")
    characters = query_db(f"SELECT {CHARACTER_COLUMNS} FROM Characters")
    vehicles = query_db(f"SELECT {VEHICLE_COLUMNS} FROM Vehicles")
    # Only map images block the loading screen; character/vehicle images load quietly after.
    preload_urls = list({*(m[9] for m in maps if m[9])})
    background_preload_urls = list({
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    return render_template(
        "selection.html",
        maps=maps,
        preload_urls=preload_urls,
        background_preload_urls=background_preload_urls,
    )


@app.route("/Compare")
def compare():
    characters = query_db(f"SELECT {CHARACTER_COLUMNS} FROM Characters")
    vehicles = query_db(f"SELECT {VEHICLE_COLUMNS} FROM Vehicles")
    preload_urls = list({
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    return render_template(
        "compare.html",
        characters=characters,
        vehicles=vehicles,
        preload_urls=preload_urls,
    )


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(error):
    return render_template("500.html"), 500


@app.errorhandler(505)
def http_version_not_supported(error):
    return render_template("505.html"), 505


@app.errorhandler(418)
def im_a_teapot(error):
    return render_template("418.html"), 418


@app.route("/teapot")
@app.route("/418")
def teapot():
    """Easter egg — HTTP 418 I'm a teapot."""
    abort(418)


@app.route("/505")
def force_505():
    """Demo route so the 505 page can be opened in a browser."""
    abort(505)


@app.route("/About")
def about():
    return render_template("about.html")


@app.route("/Credits")
def credits():
    return render_template("credits.html")


@app.get("/proxy-image")
def proxy_image():
    url = request.args.get("url", "")
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ("http", "https") or host not in ALLOWED_IMAGE_HOSTS:
        abort(400)

    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "MKW-Combo-Stats/1.0",
            "Referer": "",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/png")
    except (urllib.error.URLError, TimeoutError):
        abort(502)

    return Response(
        data,
        content_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.route("/characters")
@app.route("/characters/<id>")
def char(id=None):
    if id is None or id == "all":
        rows = query_db(f"SELECT {CHARACTER_COLUMNS} FROM Characters")
        return jsonify([list(r) for r in rows])
    rows = query_db(
        f"SELECT {CHARACTER_COLUMNS} FROM Characters WHERE HiddenID = ?",
        [id],
    )
    return jsonify([list(r) for r in rows])


@app.route("/vehicles/")
@app.route("/vehicles/<path:id>")
def vehic(id=None):
    if id is None or id == "all":
        rows = query_db(f"SELECT {VEHICLE_COLUMNS} FROM Vehicles")
        return jsonify([list(r) for r in rows])
    rows = query_db(
        f"SELECT {VEHICLE_COLUMNS} FROM Vehicles WHERE HiddenID = ?",
        [id],
    )
    return jsonify([list(r) for r in rows])


@app.route("/combo/<int:character_id>/<int:vehicle_id>")
def combo_stats(character_id, vehicle_id):
    """Calculate combo stats on the server (replaces client-side calculation.js)."""
    char = query_db(
        f"SELECT {CHARACTER_COLUMNS} FROM Characters WHERE HiddenID = ?",
        [character_id],
        one=True,
    )
    veh = query_db(
        f"SELECT {VEHICLE_COLUMNS} FROM Vehicles WHERE HiddenID = ?",
        [vehicle_id],
        one=True,
    )
    if not char or not veh:
        abort(404)
    return jsonify(calculate_stats(char, veh))


@app.route("/maps")
def maps():
    return query_db(f"SELECT {MAP_COLUMNS} FROM Maps")


@app.route("/maps/<int:id>")
def maps_with_id(id):
    return query_db(f"SELECT {MAP_COLUMNS} FROM Maps WHERE HiddenID = ?", [id])


@app.post("/api/selection/")
def apiselection():
    # Accept form fields (preferred) or JSON body for older clients.
    map_id = request.form.get("map") or (request.get_json(silent=True) or {}).get("map")
    priority = request.form.get("priority") or (request.get_json(silent=True) or {}).get("priority")
    if priority == "Speed":
        result = query_db(
            "SELECT BestCharacterSpeed, BestVehicleSpeed FROM Maps WHERE HiddenID = ?",
            [map_id],
            one=True,
        )
    elif priority == "Turbo":
        result = query_db(
            "SELECT BestCharacterTurbo, BestVehicleTurbo FROM Maps WHERE HiddenID = ?",
            [map_id],
            one=True,
        )
    else:
        abort(400)
    if not result:
        abort(404)
    return {"character": result[0], "vehicle": result[1]}


@app.get("/upvotes/<int:character_id>/<int:vehicle_id>")
def upvotes_get(character_id, vehicle_id):
    return {"upvotes": get_upvote_count(character_id, vehicle_id)}


@app.post("/upvote")
def upvote():
    """
    Create or update a ComboVotes row (database write).
    Expects form fields: character, vehicle.
    """
    try:
        character_id = int(request.form.get("character", ""))
        vehicle_id = int(request.form.get("vehicle", ""))
    except (TypeError, ValueError):
        abort(400)

    char = query_db(
        "SELECT HiddenID FROM Characters WHERE HiddenID = ?",
        [character_id],
        one=True,
    )
    veh = query_db(
        "SELECT HiddenID FROM Vehicles WHERE HiddenID = ?",
        [vehicle_id],
        one=True,
    )
    if not char or not veh:
        abort(404)

    existing = query_db(
        "SELECT Upvotes FROM ComboVotes WHERE CharacterID = ? AND VehicleID = ?",
        [character_id, vehicle_id],
        one=True,
    )
    if existing:
        execute_db(
            """
            UPDATE ComboVotes
            SET Upvotes = Upvotes + 1
            WHERE CharacterID = ? AND VehicleID = ?
            """,
            [character_id, vehicle_id],
        )
    else:
        execute_db(
            """
            INSERT INTO ComboVotes (CharacterID, VehicleID, Upvotes)
            VALUES (?, ?, 1)
            """,
            [character_id, vehicle_id],
        )

    return {"upvotes": get_upvote_count(character_id, vehicle_id)}


@app.route("/db/")
def db():
    return "Man, you ain't gettin' no database by adding /db/ 💀"


if __name__ == "__main__":
    app.run(debug=True)
