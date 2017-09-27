
import argparse
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

toolbox = XmlToolbox()


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
    return json.dumps({"uid": str(uid)})


@app.route('/config', methods=['POST'])
def reload_config():
    app.toolbox.reload_config()


@app.route('/databases', methods=['GET'])
def get_databases():
    return json.dumps(toolbox.list_databases())


@app.route('/databases', methods=['POST'])
def post_database():
    # data = json.loads(request.data.decode())
    data = json.loads(request.data)
    # db = data["database"]
    toolbox.load_database(data['database'])
    return json.dumps({"code": 200})


@app.route("/lookups", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def lookup():
    node = request.args.get('node')
    attributes = request.args.getlist('attributes')
    return json.dumps(toolbox.find_nodes_attr(node, attributes))


@app.route("/nodes", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def nodes():
    return json.dumps(toolbox.get_all_nodes())


@app.route("/attributes", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def attributes():
    node = request.args.get('node')
    return json.dumps(list(toolbox.get_all_attributes(node)))


@app.route("/groups", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def groups():
    return json.dumps(toolbox.get_nodes_groups())

if __name__ == "__main__":
    args = parser.parse_args()

    app.run()
