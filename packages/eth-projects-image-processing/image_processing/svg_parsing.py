"""
Rewrite the svgpathtools.svg2paths function to maintain the original ordering of the paths.
"""
import re
from functools import wraps
from os import getcwd, path as os_path
from xml.dom.minidom import parse

import svgpathtools
from svgpathtools.svg_to_paths import (
    ellipse2pathd,
    parse_path,
    polygon2pathd,
    polyline2pathd,
    rect2pathd,
)


def dom2dict(element):
    """Converts DOM elements to dictionaries of attributes."""
    keys = list(element.attributes.keys())
    values = [val.value for val in list(element.attributes.values())]
    return dict(list(zip(keys, values)))


def parse_node(
    node,
    convert_circles_to_paths=True,
    convert_ellipses_to_paths=True,
    convert_lines_to_paths=True,
    convert_polylines_to_paths=True,
    convert_polygons_to_paths=True,
    convert_rectangles_to_paths=True,
):
    d_strings = []
    attribute_dictionary_list = []

    if node.localName == "g":
        for n in node.childNodes:
            _ = parse_node(n)
            d_strings += _[0]
            attribute_dictionary_list += _[1]

    if not node.localName:
        return d_strings, attribute_dictionary_list

    node_dict = dom2dict(node)
    if node.localName == "path":
        d_strings += [node_dict["d"]]
        attribute_dictionary_list += [node_dict]
    elif node.localName == "circle":
        if convert_circles_to_paths:
            d_strings += [ellipse2pathd(node_dict)]
            attribute_dictionary_list += [node_dict]
    elif node.localName == "ellipse":
        if convert_ellipses_to_paths:
            d_strings += [ellipse2pathd(node_dict)]
            attribute_dictionary_list += [node_dict]
    elif node.localName == "line":
        if convert_lines_to_paths:
            d_strings += [
                (
                    "M"
                    + node_dict["x1"]
                    + " "
                    + node_dict["y1"]
                    + "L"
                    + node_dict["x2"]
                    + " "
                    + node_dict["y2"]
                )
            ]
            attribute_dictionary_list += [node_dict]
    elif node.localName == "polyline":
        if convert_polylines_to_paths:
            d_strings += [polyline2pathd(node_dict)]
            attribute_dictionary_list += [node_dict]
    elif node.localName == "polygon":
        if convert_polygons_to_paths:
            d_strings += [polygon2pathd(node_dict)]
            attribute_dictionary_list += [node_dict]
    elif node.localName == "rect":
        if convert_rectangles_to_paths:
            d_strings += [rect2pathd(node_dict)]
            attribute_dictionary_list += [node_dict]

    return d_strings, attribute_dictionary_list


@wraps(svgpathtools.svg2paths)
def svg2paths(svg_file_location, return_svg_attributes=False, **kwargs):
    if os_path.dirname(svg_file_location) == "":
        svg_file_location = os_path.join(getcwd(), svg_file_location)

    doc = parse(svg_file_location)

    d_strings = []
    attribute_dictionary_list = []

    for node in doc.documentElement.childNodes:
        node_d_string, node_attribute_dictionary_list = parse_node(node, **kwargs)
        d_strings += node_d_string
        attribute_dictionary_list += node_attribute_dictionary_list

    if return_svg_attributes:
        svg_attributes = dom2dict(doc.getElementsByTagName("svg")[0])
        doc.unlink()
        path_list = [parse_path(d) for d in d_strings]
        return path_list, attribute_dictionary_list, svg_attributes
    else:
        doc.unlink()
        path_list = [parse_path(d) for d in d_strings]
        return path_list, attribute_dictionary_list


def use_h_and_v_in_d(d):
    """
    Replace L with h and v when possible.
    """
    commands = re.findall(r"[MLQCAHVZ][\d ,.]+", d)
    x = []
    y = []
    for i, command in enumerate(commands):
        attribute = command[0]
        if attribute == "H":
            end_point = command.strip().split(" ")[-1]
            x += [end_point.split(",")[0]]
            y += [y[-1]]
            continue
        if attribute == "V":
            end_point = command.strip().split(" ")[-1]
            x += [x[-1]]
            y += [end_point.split(",")[0]]
            continue
        end_point = command.strip().split(" ")[-1]
        x += [end_point.split(",")[0]]
        y += [end_point.split(",")[1]]
        if i == 0:
            continue
        if attribute == "L":
            if len(set(x[-2:])) == 1:
                # no horizontal movement, use V instead
                commands[i] = "V " + y[-1] + " "
            elif len(set(y[-2:])) == 1:
                # no vertical movement, use H instead
                commands[i] = "H " + x[-1] + " "
    return "".join(commands).strip()
