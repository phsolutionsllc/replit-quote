import psycopg2
import logging
import os
import pandas as pd
import json
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import uuid
import datetime
import time
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("/home/ubuntu/scribe/quote/app.log"), logging.StreamHandler()]
)

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# ==========================
# Load Underwriting Rules JSON
# ==========================
UW_RULES_JSON_PATH = "/static/js/newrules.json"
LOCATIONS_DIR = Path("/home/ubuntu/scribe/quote/locations")
LOCATIONS_DIR.mkdir(exist_ok=True)

try:
    with open(UW_RULES_JSON_PATH, 'r') as json_file:
        uwrules_data = json.load(json_file)  # new coverage-first structure
    logging.info("Underwriting rules JSON (coverage-first) loaded successfully")
except Exception as e:
    logging.error(f"Error loading underwriting rules JSON: {e}")
    uwrules_data = {}

# ==========================
# Build unique_conditions from new coverage-first JSON
# ==========================
unique_conditions = {}

# Example new structure:
# {
#   "Term": {
#       "Condition A": {...},
#       "Condition B": {...}
#   },
#   "FEX": {
#       "Condition A": {...},
#       "Condition C": {...}
#   }
# }
# We'll collect all condition names from both "Term" and "FEX", so we can do searching.
for coverageKey in uwrules_data.keys():  # "Term", "FEX"
    coverageBlock = uwrules_data[coverageKey]  # dict of { conditionName -> subIndDict }
    for conditionName, subDict in coverageBlock.items():
        if conditionName not in unique_conditions:
            unique_conditions[conditionName] = {
                "coverages": set(),
                "type": "",
                "follow_up_questions": []
            }
        unique_conditions[conditionName]["coverages"].add(coverageKey.lower())

uw_conditions = list(unique_conditions.keys())
logging.info(f"Total unique conditions loaded from coverage-first JSON: {len(uw_conditions)}")

def get_db_connection(db_name):
    conn = psycopg2.connect(
        dbname=db_name,
        user='henry',
        password='henry',
        host='127.0.0.1',
        port='5432'
    )
    return conn

@app.before_request
def log_request_info():
    logging.info('Headers: %s', request.headers)
    logging.info('Body: %s', request.get_data())

# ==========================
# Carrier Preferences Routes
# ==========================
@app.route('/api/carrier-preferences/<location_id>', methods=['GET'])
def get_carrier_preferences(location_id):
    try:
        pref_file = LOCATIONS_DIR / f"{location_id}.json"
        if pref_file.exists():
            with open(pref_file, 'r') as f:
                preferences = json.load(f)
            return jsonify(preferences)
        return jsonify({
            "fexPreferences": {},
            "termPreferences": {}
        })
    except Exception as e:
        logging.error(f"Error loading carrier preferences: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/carrier-preferences/<location_id>', methods=['POST'])
def save_carrier_preferences(location_id):
    try:
        data = request.get_json()
        pref_file = LOCATIONS_DIR / f"{location_id}.json"
        with open(pref_file, 'w') as f:
            json.dump(data, f)
        return jsonify({"status": "success"})
    except Exception as e:
        logging.error(f"Error saving carrier preferences: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================
# Condition-Related API Endpoints
# ==========================
@app.route('/api/conditions', methods=['GET'])
def get_conditions_json():
    """Return all unique conditions from the new coverage-first JSON."""
    try:
        logging.info("Retrieving conditions from coverage-first JSON")
        return jsonify({'conditions': uw_conditions}), 200
    except Exception as e:
        logging.error(f"Error retrieving conditions: {e}")
        return jsonify({'error': 'Failed to retrieve conditions.'}), 500

# NEW ENDPOINT: Get Quotes as JSON (for iOS)
@app.route('/api/get_quotes', methods=['POST'])
def get_quotes_api():
    try:
        data = request.get_json()
        face_amount = data.get('face_amount')
        sex = data.get('sex')
        age = data.get('age')
        tobacco = data.get('tobacco')
        selected_database = data.get('selected_database', 'term')
        term_length = data.get('term_length')
        underwriting_class = data.get('underwriting_class')

        if selected_database == 'term':
            db_name = 'term_quotes_db'
            query = """
                SELECT id, face_amount, sex, term_length, state, age, tobacco,
                       company, plan_name, tier_name, monthly_rate, annual_rate,
                       warnings, logo_url, eapp
                FROM term_quotes
                WHERE face_amount = %s
                  AND sex = %s
                  AND age = %s
                  AND tobacco = %s
                  AND term_length = %s
                ORDER BY monthly_rate ASC
            """
            params = [face_amount, sex, age, tobacco, term_length]
        else:
            db_name = 'quotesdb'
            query = """
                SELECT id, face_amount, sex, state, age, tobacco, underwriting_class,
                       company, plan_name, tier_name, monthly_rate, annual_rate,
                       warnings, logo_url, eapp
                FROM fex_quotes
                WHERE face_amount = %s
                  AND sex = %s
                  AND age = %s
                  AND tobacco = %s
                  AND underwriting_class = %s
                ORDER BY monthly_rate ASC
            """
            params = [face_amount, sex, age, tobacco, underwriting_class]

        conn = get_db_connection(db_name)
        cur = conn.cursor()
        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        results = []
        if selected_database == 'term':
            for row in rows:
                result = {
                    "id": row[0],
                    "face_amount": row[1],
                    "sex": row[2],
                    "term_length": row[3],
                    "state": row[4],
                    "age": row[5],
                    "tobacco": row[6],
                    "company": row[7],
                    "plan_name": row[8],
                    "tier_name": row[9],
                    "monthly_rate": row[10],
                    "annual_rate": row[11],
                    "warnings": row[12],
                    "logo_url": row[13],
                    "eapp": row[14]
                }
                results.append(result)
        else:
            for row in rows:
                result = {
                    "id": row[0],
                    "face_amount": row[1],
                    "sex": row[2],
                    "state": row[3],
                    "age": row[4],
                    "tobacco": row[5],
                    "underwriting_class": row[6],
                    "company": row[7],
                    "plan_name": row[8],
                    "tier_name": row[9],
                    "monthly_rate": row[10],
                    "annual_rate": row[11],
                    "warnings": row[12],
                    "logo_url": row[13],
                    "eapp": row[14]
                }
                results.append(result)
        return jsonify(results)
    except Exception as e:
        logging.error(f"Error processing quotes: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search_conditions_json():
    """Search for conditions from uw_conditions list."""
    try:
        query = request.args.get('query', '').strip().lower()
        logging.info(f"Search query received: '{query}'")

        if not query:
            return jsonify({'error': 'No query provided.'}), 400

        matches = [cond for cond in uw_conditions if query in cond.lower()]

        logging.info(f"Search results: Found {len(matches)} matches for query '{query}'")
        return jsonify({'results': matches if matches else []}), 200
    except Exception as e:
        logging.error(f"Error during search: {e}")
        return jsonify({'error': 'Search error occurred.'}), 500

@app.route('/api/condition-questions', methods=['POST'])
def get_condition_questions_json():
    """
    Example: Return some follow-up questions for a condition
    from the (now coverage-first) data structure.
    """
    log_prefix = "[CONDITION_QUESTIONS]"
    request_id = str(uuid.uuid4())
    logging.info(f"{log_prefix} {request_id} Request received")

    try:
        data = request.get_json()
        logging.info(f"{log_prefix} {request_id} Request data: {data}")

        condition = data.get('condition')
        if not condition:
            logging.error(f"{log_prefix} {request_id} No condition provided in request")
            return jsonify({'error': 'No condition provided'}), 400

        condition_entry = unique_conditions.get(condition)
        if not condition_entry:
            logging.error(f"{log_prefix} {request_id} Condition not found: {condition}")
            return jsonify({'error': 'Condition not found'}), 404

        logging.info(f"{log_prefix} {request_id} Found condition entry with coverage(s)={condition_entry['coverages']}")

        questions = []
        # Always add "Date of last treatment" as an example
        questions.append({
            "id": "treatment_date",
            "text": "Date of last treatment:",
            "type": "date"
        })
        # Add any stored follow_up_questions
        for q in condition_entry["follow_up_questions"]:
            questions.append(q)

        logging.info(f"{log_prefix} {request_id} Total questions: {len(questions)}")
        response = {"questions": questions}
        return jsonify(response), 200

    except Exception as e:
        logging.error(f"{log_prefix} {request_id} Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

# ==========================
# Health/Medical Search Functions (CSV-Based)
# ==========================
CSV_PATH = os.path.join(app.root_path, 'templates', 'uwrules.csv')

try:
    df_csv = pd.read_csv(CSV_PATH)
    df_csv.columns = df_csv.columns.str.strip()
    conditions_list_csv = df_csv['Condition'].dropna().unique().tolist()
    conditions_lower_csv = [condition.lower() for condition in conditions_list_csv]
    logging.info("Health conditions CSV loaded successfully")
except Exception as e:
    logging.error(f"Error loading health conditions CSV: {e}")
    df_csv = pd.DataFrame()

@app.route('/api/conditions_csv', methods=['GET'])
def get_conditions_csv():
    """Return conditions from the CSV."""
    try:
        conditions = df_csv['Condition'].unique().tolist()
        logging.info(f"Retrieved {len(conditions)} conditions from CSV")
        return jsonify({'conditions': conditions}), 200
    except Exception as e:
        logging.error(f"Error retrieving conditions from CSV: {e}")
        return jsonify({'error': 'Failed to retrieve conditions.'}), 500

@app.route('/api/search_csv', methods=['GET'])
def search_conditions_csv():
    """Search conditions in the CSV."""
    try:
        query = request.args.get('query', '').strip().lower()
        logging.info(f"Search query received: '{query}'")

        if not query:
            return jsonify({'error': 'No query provided.'}), 400

        matches = [condition for condition, condition_l in zip(conditions_list_csv, conditions_lower_csv)
                   if query in condition_l]

        logging.info(f"Search results: Found {len(matches)} matches for query '{query}'")
        return jsonify({'results': matches if matches else []}), 200
    except Exception as e:
        logging.error(f"Error during CSV search: {e}")
        return jsonify({'error': 'Search error occurred.'}), 500

@app.route('/api/eligibility_csv', methods=['POST'])
def check_eligibility_csv():
    """Check eligibility from the CSV data."""
    try:
        data = request.get_json()
        condition = data.get('condition')
        treatment_date = data.get('treatment_date')

        logging.info(f"Checking eligibility for: {condition}, date: {treatment_date}")

        condition_data = df_csv[
            (df_csv['Condition'] == condition) &
            (df_csv['Treatment_Date'] == treatment_date)
        ]

        if condition_data.empty:
            return jsonify({'error': 'No matching conditions found'}), 404

        carrier_columns = [col for col in df_csv.columns if col.startswith('Carrier_')]
        results = {}

        for carrier in carrier_columns:
            carrier_name = carrier.replace('Carrier_', '')
            status = condition_data[carrier].iloc[0]
            results[carrier_name] = status

        return jsonify(results), 200
    except Exception as e:
        logging.error(f"Error checking eligibility CSV: {e}")
        return jsonify({'error': str(e)}), 500

# ==========================
# Example Evaluate-Rule (Unused but included)
# ==========================
@app.route('/api/evaluate-rule', methods=['POST'])
def evaluate_rule_json():
    """
    Example evaluation route for a condition using coverage logic.
    """
    try:
        req_data = request.get_json()
        condition = req_data.get('condition', '').strip().lower()
        responses = req_data.get('responses', {})

        if not condition:
            return jsonify({'error': 'Condition not provided'}), 400

        condition_entry = unique_conditions.get(condition)
        if not condition_entry:
            return jsonify({'error': 'Condition not found'}), 404

        treatment_date_input = responses.get('treatment_date')
        if not treatment_date_input:
            return jsonify({'error': 'Treatment date not provided in responses'}), 400

        try:
            treatment_date = datetime.datetime.strptime(treatment_date_input, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({'error': 'Invalid treatment date format. Use YYYY-MM-DD.'}), 400

        today = datetime.datetime.today().date()
        delta_years = (today - treatment_date).days / 365

        coverage = condition_entry["coverages"]  # e.g., {'term','fex'}

        result = "Approved"  # default example
        # Example placeholder rule
        if "covid" in condition:
            if "fex" in coverage and delta_years < 3:
                result = "Decline - less than 3 yrs"

        logging.info(f"Rule evaluation result: {result}")
        return jsonify({"result": result}), 200

    except Exception as e:
        logging.error(f"Error in evaluate_rule_json: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

# ==========================
# Quote Search Functions
# ==========================
@app.route('/', methods=['GET', 'POST'])
def index():
    start_time = time.time()
    logging.info("[TIMER] Starting index() route")

    results = None
    face_amount = sex = age = tobacco = underwriting_class = term_length = selected_database = None
    medical_conditions = {}
    medical_responses = {}
    location_id = request.args.get('locationID') or request.form.get('locationID')
    logging.info(f"[index()] Received location_id='{location_id}'")

    parse_time = time.time()
    logging.info(f"[TIMER] Basic initialization took {parse_time - start_time:.2f} seconds")

    if request.method == 'POST':
        try:
            face_amount = request.form['face_amount']
            sex = request.form['sex']
            age = request.form['age']
            tobacco = request.form['tobacco']
            selected_database = request.form['database']
            underwriting_class = request.form.get('underwriting_class')
            term_length = request.form.get('term_length')

            # Grab raw strings from the form
            medical_conditions_raw = request.form.get('medical_conditions', '{}')
            medical_responses_raw = request.form.get('medical_responses', '{}')

            logging.info(f"[index POST] Medical conditions (raw): {medical_conditions_raw}")
            logging.info(f"[index POST] Medical responses (raw): {medical_responses_raw}")

            try:
                medical_conditions = json.loads(medical_conditions_raw)
                medical_responses = json.loads(medical_responses_raw)
            except json.JSONDecodeError:
                logging.warning("[index POST] Failed to parse medical data, using empty dicts")
                medical_conditions = {}
                medical_responses = {}

            location_id = request.args.get('locationID') or request.form.get('locationID')
            selected_carriers = None
            
            if location_id:
                pref_file = LOCATIONS_DIR / f"{location_id}.json"
                if pref_file.exists():
                    with open(pref_file, 'r') as f:
                        prefs = json.load(f)
                        if selected_database == 'fex':
                            selected_carriers = [carrier for carrier, chosen in prefs['fexPreferences'].items() if chosen]
                        else:
                            selected_carriers = [carrier for carrier, chosen in prefs['termPreferences'].items() if chosen]

            logging.info(
                "[index POST] face_amount: %s, Sex: %s, Age: %s, Tobacco: %s, "
                "database: %s, underwriting_class: %s, term_length: %s",
                face_amount, sex, age, tobacco, selected_database, underwriting_class, term_length
            )

            db_name = 'term_quotes_db' if selected_database == 'term' else 'quotesdb'
            conn = get_db_connection(db_name)
            cur = conn.cursor()

            # Build the correct query
            if selected_database == 'term':
                query = """
                    SELECT id, face_amount, sex, term_length, state, age, tobacco,
                           company, plan_name, tier_name, monthly_rate, annual_rate,
                           warnings, logo_url, eapp
                    FROM term_quotes
                    WHERE face_amount = %s
                    AND sex = %s
                    AND age = %s
                    AND tobacco = %s
                    AND term_length = %s
                """
                params = [face_amount, sex, age, tobacco, term_length]
            else:
                query = """
                    SELECT id, face_amount, sex, state, age, tobacco, underwriting_class,
                           company, plan_name, tier_name, monthly_rate, annual_rate,
                           warnings, logo_url, eapp
                    FROM fex_quotes
                    WHERE face_amount = %s
                    AND sex = %s
                    AND age = %s
                    AND tobacco = %s
                    AND underwriting_class = %s
                """
                params = [face_amount, sex, age, tobacco, underwriting_class]

            if selected_carriers:
                query += " AND company = ANY(%s)"
                params.append(selected_carriers)

            query += " ORDER BY monthly_rate ASC"
            db_query_time = time.time()
            logging.info(f"[TIMER] Building query took {db_query_time - parse_time:.2f} seconds")

            logging.info("[index POST] Running query: %s with params: %s", query, params)
            db_exec_start = time.time()
            cur.execute(query, params)
            db_exec_end = time.time()
            logging.info(f"[TIMER] DB execute took {db_exec_end - db_exec_start:.2f} seconds")
            results_fetch_start = time.time()
            results = cur.fetchall()
            results_fetch_end = time.time()
            logging.info(f"[TIMER] Fetching results took {results_fetch_end - results_fetch_start:.2f} seconds")
            logging.info("[index POST] Found %d matching quotes", len(results))

            cur.close()
            conn.close()
            
            # Process results with medical conditions
            processed_results = []
            for idx, row in enumerate(results):
                row_list = list(row)
                
                carrier_name = row_list[7]
                logging.info("[index POST] Processing carrier: %s", carrier_name)

                approval_status = "UNKNOWN APPROVAL"
                complete_rule = ""
                found_decline = False
                found_approval = False

                # Evaluate each condition
                for condKey, condData in medical_conditions.items():
                    if condKey in medical_responses:
                        carrier_results = condData.get('carriersResult', [])
                        for cRes in carrier_results:
                            # JSON has "company" for the carrier
                            json_carrier = cRes.get('company')
                            if json_carrier == carrier_name:
                                status = cRes.get('status', "UNKNOWN APPROVAL")
                                # We'll store either 'reason' or 'completeRule' for the tooltip
                                reason_text = cRes.get('reason', "")
                                if not reason_text:
                                    reason_text = cRes.get('completeRule', "")

                                logging.info("[index POST] Found status=%s, reason=%s for %s",
                                             status, reason_text, carrier_name)

                                # If the JSON uses 'Decline' -> we set found_decline
                                # If the JSON uses 'Approved' -> found_approval
                                # (If you have 'Declined', you might also want to handle that.)
                                status_lower = status.strip().lower()
                                if status_lower in ("decline", "declined"):
                                    found_decline = True
                                elif status_lower == "approved":
                                    found_approval = True

                                if reason_text:
                                    complete_rule = reason_text

                # Decide final approval_status
                if found_decline:
                    approval_status = "Decline"
                elif found_approval:
                    approval_status = "Approved"
                else:
                    approval_status = "UNKNOWN APPROVAL"

                # Ensure row_list has at least 15 elements
                while len(row_list) < 15:
                    row_list.append(None)

                # Append approval_status (index 15) and complete_rule (index 16)
                row_list.append(approval_status)
                row_list.append(complete_rule)

                logging.info("[index POST] Row %d final status (row_list[15]) is: %s", idx, row_list[15])
                logging.debug("[index POST] Row %d: %s", idx, row_list)
                processed_results.append(tuple(row_list))

            def parse_rate(row):
                try:
                    return float(row[10])  # monthly_rate is at index 10
                except:
                    return 999999  # fallback if missing/invalid

            # Sort so that Declines appear after Approvals, and within each group we sort by monthly_rate
            processed_results.sort(key=lambda r: (
                r[15] == 'Decline',  # True sorts after False
                parse_rate(r)
            ))

            logging.info("[index POST] Finished processing results")
            processing_done = time.time()
            logging.info(f"[TIMER] Processing results took {processing_done - results_fetch_end:.2f} seconds")
            results = processed_results

        except Exception as e:
            logging.error("Error processing quote request: %s", e, exc_info=True)
            return render_template('index.html', error=str(e))

    # Final render - passing back the health info as JSON strings
    final_render_start = time.time()
    html = render_template(
        'index.html',
        location_id=location_id,
        results=results,
        face_amount=face_amount,
        sex=sex,
        age=age,
        tobacco=tobacco,
        underwriting_class=underwriting_class,
        term_length=term_length,
        selected_database=selected_database,
        medical_conditions=medical_conditions,
        medical_responses=medical_responses
    )
    final_render_end = time.time()
    logging.info(f"[TIMER] Final render took {final_render_end - final_render_start:.2f} seconds")
    total_time = final_render_end - start_time
    logging.info(f"[TIMER] TOTAL index() time: {total_time:.2f} seconds")
    return html

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)