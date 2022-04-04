from pathlib import Path
from string import Template

# Constants paths for the project
DATA_DIR = Path("data")
TRAITS_DIR = DATA_DIR / "traits"
TRAITS_COMPUTED_DIR = DATA_DIR / "traits_computed"
PALETTES_FILE = DATA_DIR / "palettes.json"

# Templates
RECT = Template("<rect x='$x' y='$y' width='$width' height='$height' fill='#$fill' />")
