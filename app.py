
import argparse
from datetime import datetime
import json
import logging
# from http://flask.pocoo.org/ tutorial
from flask import Flask, render_template, request, session
import uuid

from xml_toolbox import XmlToolbox

log = logging.getLogger("xml_transversal_lookup")

parser = argparse.ArgumentParser(description='Show transversal xml properties.')
parser.add_argument('--debug', '-d', dest='debug',
                    action='store_true',
                    help='Debug mode')

app = Flask(__name__)
app.secret_key = "test"


@app.before_first_request
def initialize():
    logger = logging.getLogger("xml_transversal_lookup")
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter(
        """%(levelname)s in %(module)s [%(pathname)s:%(lineno)d]:\n%(message)s"""
    )
    ch.setFormatter(formatter)
    logger.addHandler(ch)


@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    uid = str(uuid.uuid4())
    session[uid] = datetime.now()
    return json.dumps({"uid": str(uid)})


@app.route('/databases', methods=['GET'])
def get_databases():
    toolbox = XmlToolbox()
    result = {
        "default": toolbox.get_default_database(),
        "all": toolbox.list_databases()
    }
    return json.dumps(result)


@app.route("/nodes", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def nodes():
    toolbox = XmlToolbox(db=request.args.get('database'))
    result = {
        "default": toolbox.get_default_node_type(),
        "all": toolbox.get_all_nodes_types()
    }
    return json.dumps(result)


@app.route("/nodes/names", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def nodes_names():
    toolbox = XmlToolbox(db=request.args.get('database'))
    node_type = request.args.get('node')
    return json.dumps(toolbox.get_nodes_names(node_type))


@app.route("/nodes/groups", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def nodes_groups():
    toolbox = XmlToolbox(db=request.args.get('database'))
    node_type = request.args.get('node')
    return json.dumps(toolbox.get_nodes_groups(node_type))


@app.route("/nodes/attributes", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def attributes():
    toolbox = XmlToolbox(db=request.args.get('database'))
    node = request.args.get('node')
    return json.dumps(toolbox.get_nodes_attributes(node))


@app.route("/nodes/attributes/groups", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def attributes_groups():
    toolbox = XmlToolbox(db=request.args.get('database'))
    node = request.args.get('node')
    return json.dumps(toolbox.get_nodes_attributes_groups(node))


@app.route("/nodes/attributes/groups", methods=['POST'])  # take note of this decorator syntax, it's a common pattern
def add_attributes_group():
    db = request.json['database']
    toolbox = XmlToolbox(db=db)
    group = request.json['group']
    return json.dumps(toolbox.add_attributes_group(db, group))



if __name__ == "__main__":
    args = parser.parse_args()

    app.run()
