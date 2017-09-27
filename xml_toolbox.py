import copy
import hashlib
import logging
import json
import xml.etree.ElementTree as ET

log = logging.getLogger("xml_transversal_lookup")


class XmlToolbox(object):
    """
    Feature search of properties within an xml object
    """

    def __init__(self, config='config.json'):
        self.root = None
        self.load_config(config)
        self.load_database("AnimalPersonality")

    def load_config(self, config):
        with open('config.json', 'r') as f:
            self.config = json.load(f)

    def list_databases(self):
        return [name for name in self.config.get('databases', {}).keys()]

    def load_database(self, db_name):
        filename = self.config['databases'][db_name]
        self.tree = ET.parse(filename)
        self.root = self.tree.getroot()
        log.info("root set: %s" % self.root)

    def get_node_name(self, node):
        node_conf = self.config.get('helpers', {}).get('nodes_names', {}).get(node.tag, {})
        node_id = node.get(node_conf.get("attribute"))
        return node_conf.get("values", {}).get(node_id, node_id)

    def get_node__id(self, node_name):
        for (name, node_id) in self.config.get('helpers', {}).get('node_names', {}).iteritems():
            if name == node_name:
                return node_id
        return node_name

    def get_attr_name(self, attr):
        return self.config.get('helpers', {}).get('attr_names', {}).get(attr, attr)

    def find_attr_node(self, attr, ignore_multiple=True):
        """
        find what node has the given attribute
        returns the first one found if any
        Warning, if multiple nodes have the same
        """
        nodes = set()
        for child in self.root:
            raise Exception(child.findall("*[@%s]" % attr))
            if attr in child.attrib:
                nodes.add(child.tag)
                if ignore_multiple:
                    return child.tag

        if not ignore_multiple:
            if len(nodes) > 1:
                raise Exception("multiple objects have the same attribute")

        raise Exception("returning nodes %s" % nodes)
        return list(nodes)

    def get_node_from_path(self, path):
        node = self.root
        for child in path:
            node = node[child]
        return node

    def iter_child(self, node, attr_name):
        res = []
        if node.get(attr_name):
            res = [node.get(attr_name)]
        for child in node:
            res += self.iter_child(child, attr_name)
        return res

    def get_node_id(self, node):
        hashId = hashlib.md5()
        hashId.update(repr(node).encode('utf-8'))
        return hashId.hexdigest()

    def get_nodes_attributes(self, node_type, attributes):
        log.info("getting attributes %s for %s" % (attributes, node_type))
        nodes = self.root.findall(".//%s" % node_type)
        result = {}
        for node in nodes:
            node_res = copy.deepcopy(node.attrib)
            node_res["name"] = self.get_node_name(node)
            node_res["attributes"] = {attr: [] for attr in attributes}
            for child in node.iter():
                for attr in attributes:
                    if child.get(attr):
                        node_res["attributes"][attr] += [child.get(attr)]
            result[self.get_node_id(node)] = node_res
        return result

    def find_nodes_attr(self, node_type, attributes):
        if not isinstance(attributes, list):
            attributes = [attributes]
        log.info("Searching %s %s" % (node_type, attributes))
        if self.root is None:
            raise Exception("No xml file loaded")
        attr_name = [self.get_attr_name(attr) for attr in attributes]
        log.info("Searching all %s nodes with the attribute %s" % (node_type, attr_name))
        return self.get_nodes_attributes(node_type, attr_name)

    def get_all_attributes(self, node_id=None, rec=True):
        log.info("getting attributes for %s" % node_id)
        nodes = self.root.findall(".//%s" % node_id)
        log.info("nodes found %s " % nodes)
        attributes = set()
        for node in nodes:
            attributes |= set(node.attrib.keys())
            if rec:
                for child in node.iter():
                    attributes |= set(child.attrib.keys())
            log.info("getting attrs")

        return [{"name": attr} for attr in attributes]

    def get_all_nodes(self):
        nodes = set()

        for node in self.root.iter():
            nodes.add(node.tag)  # indent this by tab, not two spaces as I did here

        return [{"id": node, "name": node} for node in list(nodes)]
