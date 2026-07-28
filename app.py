from flask import Flask, g, render_template, request, abort, jsonify
import sqlite3

DATABASE = "database.db"

app = Flask(__name__)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


@app.route('/')
def home(): # Home page
    characters=query_db("SELECT * FROM Characters")
    vehicles=query_db("SELECT * FROM Vehicles")
    preload_urls = list({
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    return render_template("home.html", characters=characters, vehicles=vehicles, preload_urls=preload_urls)

@app.route('/Selection')
def selection(): # Selection page
    maps=query_db("SELECT * FROM Maps")
    characters=query_db("SELECT * FROM Characters")
    vehicles=query_db("SELECT * FROM Vehicles")
    preload_urls = list({
        *(m[9] for m in maps if m[9]),
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    return render_template("selection.html", maps=maps, preload_urls=preload_urls)

@app.route('/Compare')
def compare(): # Compare page
    characters=query_db("SELECT * FROM Characters")
    vehicles=query_db("SELECT * FROM Vehicles")
    preload_urls = list({
        *(c[11] for c in characters if c[11]),
        *(v[12] for v in vehicles if v[12]),
    })
    return render_template("compare.html", characters=characters, vehicles=vehicles, preload_urls=preload_urls)

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html')



@app.route('/characters/<id>')
def char(id): # Fetch characters
    if id == "all":
        rows = query_db("SELECT * FROM Characters")
        return jsonify([list(r) for r in rows])
    else:
        rows = query_db("SELECT * FROM Characters WHERE HiddenID = ?", [id])
        return jsonify([list(r) for r in rows])

@app.route('/vehicles/<path:id>')
def vehic(id): #Fetch vheicles
    if id == "all":
        rows = query_db("SELECT * FROM Vehicles")
        return jsonify([list(r) for r in rows])
    else:
        rows = query_db("SELECT * FROM Vehicles WHERE HiddenID = ?", [id])
        return jsonify([list(r) for r in rows])

@app.route('/maps')
def maps():
    return query_db("SELECT * FROM Maps")
    
@app.route('/maps/<int:id>')
def maps_with_id(id):
    return query_db("SELECT * FROM Maps WHERE HiddenID = ?", [id])

@app.post('/api/selection/')
def apiselection():
    data = request.get_json()
    map_id = data.get('map')
    priority = data.get('priority')
    if priority == "Speed":
        result = query_db("SELECT BestCharacterSpeed, BestVehicleSpeed FROM Maps WHERE HiddenID = ?", [map_id], one=True)
    elif priority == "Turbo":
        result = query_db("SELECT BestCharacterTurbo, BestVehicleTurbo FROM Maps WHERE HiddenID = ?", [map_id], one=True)
    else:
        abort(400)
    if not result:
        abort(404)
    return {"character": result[0], "vehicle": result[1]}
    

@app.route('/db/')
def db(): # Database
    return "Yeah no. You are not getting the whole database by /db/ :sob:"

if __name__ == "__main__":
    app.run(debug=True)