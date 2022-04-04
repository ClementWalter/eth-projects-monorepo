import json
from pathlib import Path

import numpy as np
import pandas as pd
import svgpathtools as spt

from image_processing.constants import (
    PALETTES_FILE, TRAITS_COMPUTED_DIR, TRAITS_DIR,
)
from image_processing.svg_parsing import svg2paths


#%% Define functions
def round_path(p, initial_scale):
    if p.__class__.__name__ == "Arc":
        p = p.scaled(255 / initial_scale, 255 / initial_scale)
        p.start = np.round(np.array(p.start))
        p.start = np.clip(0, 255, p.start.real) + 1j * np.clip(0, 255, p.start.imag)
        p.end = np.round(np.array(p.end))
        p.end = np.clip(0, 255, p.end.real) + 1j * np.clip(0, 255, p.end.imag)
        p.center = np.round(np.array(p.center))
        p.center = np.clip(0, 255, p.center.real) + 1j * np.clip(0, 255, p.center.imag)
        p.radius = np.clip(0, 255, np.floor(p.radius.real)) + 1j * np.clip(
            0, 255, np.floor(p.radius.imag)
        )
        return p

    coordinates = np.round(np.array(p.bpoints()) * 255 / initial_scale)
    return getattr(spt, p.__class__.__name__)(
        *(np.clip(coordinates.real, 0, 255) + 1j * np.clip(coordinates.imag, 0, 255))
    )


def get_fill(fill):
    return "#" + fill_palette[fill]


def generate_svg(_codes):
    return (
        """<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 255 255\" width=\"500px\" height=\"500px\">"""
        + (
            "".join(
                [
                    f"""<path d="{d_palette[c['d']]}" fill="{get_fill(c['fill'])}" """
                    + f"""stroke="{'#000' if c['stroke'] else ''}" />"""
                    for c in _codes
                ]
            )
        )
        + """<style>path{stroke-width:0.71}</style></svg>"""
    )


#%% Parse files
traits_list = []
for file in TRAITS_DIR.glob("**/*.svg"):
    paths, attributes, svg_attributes = svg2paths(str(file), return_svg_attributes=True)
    view_box = np.array(
        svg_attributes.get("viewBox", "0 0 283.5 283.5").split(" ")
    ).astype(float)
    for path, attribute in zip(paths, attributes):
        computed_path = spt.Path(
            *[
                round_path(path_element, initial_scale=view_box[-1])
                for path_element in path
            ]
        )
        if computed_path.d() == "":
            continue
        traits_list += [
            {
                "file": str(file),
                **attribute,
                "d": computed_path.d(),
            }
        ]

#%% Build dataframe and encode traits
traits_df = (
    pd.DataFrame(traits_list)
    .fillna({"fill": "#000000"})
    .replace({"fill": {"red": "#ff0000", "lime": "#00ff00"}})
    .filter(items=["file", "d", "fill", "stroke"])
    .assign(
        fill=lambda df: df.fill.where(
            df.fill.map(len) == 7,
            df.fill.map(lambda c: f"{c[0]}{c[1]}{c[1]}{c[2]}{c[2]}{c[3]}{c[3]}"),
        ).str.replace("#", ""),
        stroke=lambda df: (~df.stroke.isna()).astype(int),
    )
    .astype({"d": "category", "fill": "category", "stroke": "category"})
    .assign(
        d_code=lambda df: df.d.cat.codes,
        fill_code=lambda df: df.fill.cat.codes,
    )
)

d_palette = traits_df.d.cat.categories
fill_palette = traits_df.fill.cat.categories

traits_codes = (
    traits_df.groupby("file")
    .apply(
        lambda group: group[["d_code", "fill_code", "stroke"]]
        .rename(columns=lambda c: c.replace("_code", ""))
        .to_dict("records")
    )
    .reset_index()
    .assign(
        layer_index=lambda df: df.file.str.split("/", expand=True)
        .iloc[:, -1]
        .str.extract(r"(?P<layer_name>\d+)")
        .layer_name.astype(int),
        item_index=lambda df: df.file.str.split("/", expand=True)
        .iloc[:, -1]
        .str.extract(r"\d+\-(?P<item_index>\d+)")
        .item_index.astype(int),
    )
    .sort_values(["layer_index", "item_index"])
    .set_index(["file"])
    .drop(columns=["layer_index", "item_index"])[0]
)

#%% Dump reconstructed SVG files for visual check
for file_name, codes in traits_codes.items():
    file_name_computed = TRAITS_COMPUTED_DIR / Path(file_name).relative_to(TRAITS_DIR)
    file_name_computed.parent.mkdir(exist_ok=True, parents=True)

    with open(file_name_computed, "w") as f:
        f.write(generate_svg(codes))

#%% Dump palettes and traits
with open(PALETTES_FILE, "w") as f:
    json.dump(
        {
            "d": d_palette.tolist(),
            "fill": fill_palette.tolist(),
            "trait": traits_codes.to_dict(),
            "layerIndexes": (
                traits_codes.index.to_frame()
                .file.str.split("/", expand=True)[2]
                .reset_index(drop=True)
            )
            .drop_duplicates()
            .index.tolist(),
        },
        f,
        indent=2,
    )

#%% Some stats
print(f"Number of traits: {len(traits_df)}")
print(f"Number of unique traits: {len(traits_df.d.cat.categories)}")
print(f"Number of unique colors: {len(traits_df.fill.cat.categories)}")
