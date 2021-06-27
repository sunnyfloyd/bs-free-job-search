from flask import Flask, send_from_directory, request, url_for, redirect
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
@app.route('/jobs')
def jobs():
    r = request.args
    if r:
        filtering_criteria = {
            'required_stack': list(r['required_stack'].split(',')),
            'optional_stack': list(r['optional_stack'].split(',')),
            'min_salary': int(r['min_salary']),
            'max_salary': int(r['max_salary']),
            'location': list(r['location'].split(',')),
            'experience': r['experience']
        }
        filtering_criteria = {(k):(v if v != [''] else [])
                                for k, v in filtering_criteria.items()}
        return display_offers(df, **filtering_criteria)
    return redirect(url_for('base'))

if __name__ == "__main__":
    app.run(debug=True)
