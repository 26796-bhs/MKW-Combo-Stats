from flask import Flask, g, render_template
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
    return render_template()


@app.route('/characters')
def char(): # Fetch characters
    return query_db("SELECT * FROM Characters")

@app.route('/vehicles')
def vehic(): #Fetch vheicles
    return query_db("SELECT * FROM Vehicles")

@app.route('/maps')
def maps():
    return query_db("SELECT * FROM Maps")

@app.route('/db/')
def db(): # Database
    return "db"

if __name__ == "__main__":
    app.run(debug=True)