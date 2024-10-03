from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your React app

# In-memory store for study groups (for now)
groups = []

# Endpoint to fetch all study groups
@app.route('/groups', methods=['GET'])
def get_groups():
    return jsonify(groups)

# Endpoint to create a new study group
@app.route('/groups', methods=['POST'])
def create_group():
    data = request.json
    group_name = data.get('groupName')
    if group_name:
        groups.append({'name': group_name})
        return jsonify({'message': 'Group created successfully!'}), 201
    else:
        return jsonify({'error': 'Group name is required'}), 400

if __name__ == '__main__':
    app.run(debug=True)
