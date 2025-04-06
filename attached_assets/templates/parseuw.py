import csv
import json

def main():
    input_csv = "masteruwparsed.csv"   # Update with your CSV filename
    output_json = "rules.json"  # Update with desired output JSON filename

    # The CSV should have columns:
    # Insurance, Type, Name, Indication, Carrier, Status, TimeRequirementType, TimeRequirementValue, CompleteRule

    data_structure = {}

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            insurance = row.get('Insurance', '').strip()
            cond_type = row.get('Type', '').strip()  # Condition or Medication
            name = row.get('Name', '').strip()
            indication = row.get('Indication', '').strip()
            carrier = row.get('Carrier', '').strip()
            status = row.get('Status', '').strip()
            time_req_type = row.get('TimeRequirementType', 'none').strip()
            time_req_value = row.get('TimeRequirementValue', '').strip()
            complete_rule = row.get('CompleteRule', '').strip()

            if not name:
                # If no name, skip this row
                continue

            # Navigate/initialize nested structure
            if name not in data_structure:
                data_structure[name] = {}
            if indication not in data_structure[name]:
                data_structure[name][indication] = {}
            if insurance not in data_structure[name][indication]:
                data_structure[name][indication][insurance] = {
                    "approvals": [],
                    "declines": [],
                    "notAvailable": []
                }

            # Determine which list to append to based on status
            entry = {
                "carrier": carrier,
                "timeRequirementType": time_req_type,
                "timeRequirementValue": time_req_value if time_req_value else None,
                "completeRule": complete_rule
            }

            if status.lower() == "approved":
                data_structure[name][indication][insurance]["approvals"].append(entry)
            elif status.lower() == "decline":
                data_structure[name][indication][insurance]["declines"].append(entry)
            elif status.lower() == "not available":
                data_structure[name][indication][insurance]["notAvailable"].append(entry)
            else:
                # If status is something unexpected, consider ignoring or treat as decline/notAvailable as needed
                # For now, we do nothing.
                pass

    # Write out the JSON structure
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(data_structure, f, indent=2, ensure_ascii=False)

    print(f"Successfully created {output_json}")

if __name__ == "__main__":
    main()
