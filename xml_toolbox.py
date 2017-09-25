import logging
import json
import xml.etree.ElementTree as ET


log = logging.getLogger(__name__)


class XmlToolbox(object):
    """
    Feature search of properties within an xml object
    """

    def __init__(self, config='config.json'):
        self.load_config(config)

    def load_config(self, config):
        with open('config.json', 'r') as f:
            self.config = json.load(f)

    def load_file(self, filename):
        with open(filename) as f:
            log.debug(f.read())
        self.tree = ET.parse(filename)
        self.root = self.tree.getroot()

    def get_repr(self, node_name):
        return self.config.get('helpers', {}).get('nodes_repr', {}).get(node_name, node_name)

    def get_node_name(self, node):
        return self.config.get('helpers', {}).get('node_names', {}).get(node, node)

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

    def search_children(self, child_name, attr_name):
        result = {}
        children = self.root.findall(child_name)
        for child in children:
            attr = self.iter_child(child, attr_name)
            # attr = [node.get(attr_name) for node in child.findall(".//[@%s]" % attr_name)]
            result[child.get(self.get_repr(child_name))] = attr

        return result

    def find_nodes_attr(self, name, attr):
        log.info("Searching %s %s" % (name, attr))
        if self.root is None:
            raise Exception("No xml file loaded")
        node_name = self.get_node_name(name)
        attr_name = self.get_attr_name(attr)
        log.info("Searching all %s nodes with the attribute %s" % (node_name, attr_name))
        return self.search_children(node_name, attr_name)
