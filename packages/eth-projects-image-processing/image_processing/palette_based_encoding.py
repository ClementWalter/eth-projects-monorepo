import json
import shutil
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from PIL import Image

from image_processing.constants import (
    PALETTES_FILE, RECT, TRAITS_COMPUTED_DIR, TRAITS_DIR,
)
from image_processing.types import Filename


#%% Define functions
def downscale_png(
    input_file: Filename, output_file: Optional[Filename] = None, scale=40
):
    image = Image.open(input_file).convert("RGB")
    # noinspection PyTypeChecker
    arr = np.array(image)[::scale, ::scale, :]
    downscaled_image = Image.fromarray(arr)
    downscaled_image.save(output_file if output_file else input_file)
    return downscaled_image


def quantize_png(
    input_file: Filename, output_file: Optional[Filename] = None, **kwargs
):
    quantized = (
        Image.open(input_file)
        .convert("RGB")
        .convert("P", palette=Image.ADAPTIVE, **kwargs)
    )
    quantized.save(output_file if output_file else input_file)


def parse_png(input_file: Filename) -> Tuple[List[str], List[int]]:
    image = Image.open(input_file).convert("RGB").convert("P", palette=Image.ADAPTIVE)
    colors = (
        pd.Series(image.palette.colors)
        .sort_values()
        .index.to_frame()
        .agg(lambda c: "".join([("0" + format(_c, "x"))[-2:] for _c in c]), axis=1)
        .tolist()
    )
    # noinspection PyTypeChecker
    indexes = np.array(image).flatten().tolist()
    return colors, indexes


def generate_svg(colors: List[str], indexes: List[int]) -> str:
    return (
        """<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\" width=\"360px\" height=\"360px\">"""
        + (
            "".join(
                [
                    RECT.substitute(x=i % 36, y=i // 36, fill=colors[index], width=1, height=1)
                    for i, index in enumerate(indexes)
                ]
            )
        )
        + "<style>rect{shape-rendering:crispEdges}</style></svg>"
    )


#%% Parse files
traits_list = []
for file in TRAITS_DIR.glob("**/*.png"):
    _colors, _indexes = parse_png(file)
    traits_list += [
        {
            "file": str(file),
            "colors": _colors,
            "indexes": _indexes,
        }
    ]

#%% Dump reconstructed SVG files for visual check
shutil.rmtree(TRAITS_COMPUTED_DIR, ignore_errors=True)
for trait in traits_list:
    file_name_computed = TRAITS_COMPUTED_DIR / Path(trait["file"]).relative_to(
        TRAITS_DIR
    ).with_suffix(".svg")
    file_name_computed.parent.mkdir(exist_ok=True, parents=True)

    with open(file_name_computed, "w") as f:
        f.write(generate_svg(trait["colors"], trait["indexes"]))

#%% Dump palettes and traits
with open(PALETTES_FILE, "w") as f:
    json.dump(
        (
            pd.DataFrame(traits_list)
            .assign(
                tokenId=lambda df: df.file.str.split("/", expand=True)[2]
                .str.replace(".png", "", regex=True)
                .astype(int)
            )
            .sort_values("tokenId")
            .to_dict("records")
        ),
        f,
        indent=2,
    )
