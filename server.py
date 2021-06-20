from flask import Flask, send_from_directory, request
from sqlalchemy.engine import create_engine
import pandas as pd
from fetch_jobs import display_offers

app = Flask(__name__)
engine = create_engine('sqlite:///./job_offers.db')
df = pd.read_sql('job_offer_cleaned', engine)

# Path for main page
@app.route("/")
def base():
    return send_from_directory('client/public', 'index.html')

# Path for all the static files
@app.route("/<path:path>")
def home(path):
    return send_from_directory('client/public', path)

# Job fetching REST API
@app.route('/jobs', methods=['GET', 'POST'])
def jobs():
    return display_offers(df, **request.json)

if __name__ == "__main__":
    app.run(debug=True)
