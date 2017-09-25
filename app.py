
import argparse
import logging
from logging.handlers import RotatingFileHandler
# from http://flask.pocoo.org/ tutorial
from flask import Flask, render_template, request

from xml_toolbox import XmlToolbox

parser = argparse.ArgumentParser(description='Show transversal xml properties.')
parser.add_argument('--debug', '-d', dest='debug',
                    action='store_true',
                    help='Debug mode')

app = Flask(__name__)
app.toolbox = XmlToolbox()


@app.route('/config', methods=['POST'])
def reload_config():
    app.toolbox.reload_config()


@app.route("/", methods=['GET'])  # take note of this decorator syntax, it's a common pattern
def lookup():
    node = request.args.get('node', "Template")
    attribute = request.args.get('attribute', "fHealthRate")
    app.logger.info("starting app")
    app.toolbox.load_file("/app/tests/9015184194004816.lib.xml")
    return render_template('transversal_lookup.html', entries=app.toolbox.find_nodes_attr(node, attribute))


if __name__ == "__main__":
    formatter = logging.Formatter("[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = RotatingFileHandler("flask.log", maxBytes=10000000, backupCount=5)
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)

    args = parser.parse_args()
    app.run()
