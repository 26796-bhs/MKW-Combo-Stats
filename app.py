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
    """
    Per-device votes: one row = one upvote from one device.
    INSERT on upvote, DELETE on downvote, COUNT(*) for totals.
    """
    info = query_db("PRAGMA table_info(ComboVotes)")
    cols = {row[1] for row in info} if info else set()

    if "DeviceKey" in cols:
        return

    # Migrate away from the old aggregate Upvotes column schema.
    if info:
        execute_db("ALTER TABLE ComboVotes RENAME TO ComboVotes_legacy")

    execute_db(
        """
        CREATE TABLE IF NOT EXISTS ComboVotes (
            CharacterID INTEGER NOT NULL REFERENCES Characters(HiddenID),
            VehicleID INTEGER NOT NULL REFERENCES Vehicles(HiddenID),
            DeviceKey TEXT NOT NULL,
            CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (CharacterID, VehicleID, DeviceKey)
        )
        """
    )

    if info:
        execute_db("DROP TABLE IF EXISTS ComboVotes_legacy")


def ensure_cups_seeded():
    """Populate Cups if empty (matches map groupings in sql_setup)."""
    row = query_db("SELECT COUNT(*) FROM Cups", one=True)
    if row and row[0] > 0:
        return

    cups = [
        (0, "Mushroom Cup", 0, 1, 2, 3),
        (1, "Flower Cup", 4, 5, 6, 7),
        (2, "Star Cup", 8, 9, 10, 11),
        (3, "Shell Cup", 12, 13, 14, 15),
        (4, "Banana Cup", 16, 17, 18, 19),
        (5, "Leaf Cup", 20, 21, 22, 23),
        (6, "Lightning Cup", 24, 25, 26, 27),
        # Special Cup only has three maps in this database.
        (7, "Special Cup", 28, 29, 31, None),
    ]
    for cup in cups:
        execute_db(
            """
            INSERT OR IGNORE INTO Cups (HiddenID, Name, Course1, Course2, Course3, Course4)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            cup,
        )


def get_maps_grouped_by_cup():
    """
    JOIN Cups ↔ Maps so Selection can categorise courses by cup.
    Returns [{id, name, maps: [[HiddenID, Name, ..., ImageUrl], ...]}, ...]
    """
    rows = query_db(
        """
        SELECT
            Cups.HiddenID,
            Cups.Name,
            course.CourseOrder,
            Maps.HiddenID,
            Maps.Name,
            Maps.Road,
            Maps.OffRoad,
            Maps.Water,
            Maps.BestCharacterSpeed,
            Maps.BestVehicleSpeed,
            Maps.BestCharacterTurbo,
            Maps.BestVehicleTurbo,
            Maps.ImageUrl
        FROM Cups
        JOIN (
            SELECT HiddenID AS CupID, Course1 AS MapID, 1 AS CourseOrder FROM Cups
            UNION ALL
            SELECT HiddenID, Course2, 2 FROM Cups
            UNION ALL
            SELECT HiddenID, Course3, 3 FROM Cups
            UNION ALL
            SELECT HiddenID, Course4, 4 FROM Cups
        ) AS course ON course.CupID = Cups.HiddenID
        JOIN Maps ON Maps.HiddenID = course.MapID
        WHERE course.MapID IS NOT NULL
        ORDER BY Cups.HiddenID ASC, course.CourseOrder ASC
        """
    )

    groups = []
    by_id = {}
    for row in rows:
        cup_id, cup_name = row[0], row[1]
        map_row = row[3:]  # same shape as MAP_COLUMNS select
        if cup_id not in by_id:
            group = {"id": cup_id, "name": cup_name, "maps": []}
            by_id[cup_id] = group
            groups.append(group)
        by_id[cup_id]["maps"].append(map_row)
    return groups


def get_upvote_count(character_id, vehicle_id):
    row = query_db(
        """
        SELECT COUNT(*) FROM ComboVotes
        WHERE CharacterID = ? AND VehicleID = ?
        """,
        [character_id, vehicle_id],
        one=True,
    )
    return row[0] if row else 0


def user_has_voted(character_id, vehicle_id, device_key):
    if not device_key:
        return False
    row = query_db(
        """
        SELECT 1 FROM ComboVotes
        WHERE CharacterID = ? AND VehicleID = ? AND DeviceKey = ?
        """,
        [character_id, vehicle_id, device_key],
        one=True,
    )
    return bool(row)


def normalise_device_key(raw):
    key = (raw or "").strip()
    if not key or len(key) > 128:
        return None
    # Allow hex hashes / uuid-like keys only.
    allowed = set("0123456789abcdefABCDEF-")
    if any(ch not in allowed for ch in key):
        return None
    return key.lower()


with app.app_context():
    ensure_combo_votes_table()
    ensure_cups_seeded()


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
    cup_groups = get_maps_grouped_by_cup()
    # Flat list for image preload (maps appear once even if JOINed).
    maps = []
    seen = set()
    for group in cup_groups:
        for m in group["maps"]:
            if m[0] not in seen:
                seen.add(m[0])
                maps.append(m)

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
        cup_groups=cup_groups,
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
    device_key = normalise_device_key(request.args.get("device", ""))
    return {
        "upvotes": get_upvote_count(character_id, vehicle_id),
        "voted": user_has_voted(character_id, vehicle_id, device_key) if device_key else False,
    }


@app.post("/upvote")
def upvote():
    """INSERT a per-device vote (Create). Rejects duplicate votes from the same device."""
    try:
        character_id = int(request.form.get("character", ""))
        vehicle_id = int(request.form.get("vehicle", ""))
    except (TypeError, ValueError):
        abort(400)

    device_key = normalise_device_key(request.form.get("device", ""))
    if not device_key:
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

    if user_has_voted(character_id, vehicle_id, device_key):
        return {
            "upvotes": get_upvote_count(character_id, vehicle_id),
            "voted": True,
        }

    execute_db(
        """
        INSERT INTO ComboVotes (CharacterID, VehicleID, DeviceKey)
        VALUES (?, ?, ?)
        """,
        [character_id, vehicle_id, device_key],
    )
    return {
        "upvotes": get_upvote_count(character_id, vehicle_id),
        "voted": True,
    }


@app.post("/downvote")
def downvote():
    """DELETE this device's vote for the combo (Delete)."""
    try:
        character_id = int(request.form.get("character", ""))
        vehicle_id = int(request.form.get("vehicle", ""))
    except (TypeError, ValueError):
        abort(400)

    device_key = normalise_device_key(request.form.get("device", ""))
    if not device_key:
        abort(400)

    execute_db(
        """
        DELETE FROM ComboVotes
        WHERE CharacterID = ? AND VehicleID = ? AND DeviceKey = ?
        """,
        [character_id, vehicle_id, device_key],
    )
    return {
        "upvotes": get_upvote_count(character_id, vehicle_id),
        "voted": False,
    }


@app.route("/db/")
def db():
    return "Man, you ain't gettin' no database by adding /db/ 💀"


if __name__ == "__main__":
    app.run(debug=True)
