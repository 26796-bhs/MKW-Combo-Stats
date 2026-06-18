from flask import Flask, g, render_template, request, abort
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
    return render_template("home.html", characters=characters, vehicles=vehicles)

@app.route('/Selection')
def selection(): # Selection page
    maps=query_db("SELECT * FROM Maps")
    return render_template("selection.html", maps=maps)


@app.route('/characters/<id>')
def char(id): # Fetch characters
    if id == "all":
        return query_db("SELECT * FROM Characters")
    else:
        return query_db("SELECT * FROM Characters WHERE HiddenID = ?", [id])

@app.route('/vehicles/<int:id>')
def vehic(id): #Fetch vheicles
    if id == None:
        return query_db("SELECT * FROM Vehicles")
    else:
        return query_db("SELECT * FROM Vehicles WHERE HiddenID = ?", [id])

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