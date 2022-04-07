import fs from "fs";
import { Palettes, PalettesStorage } from "./types";

export const MAX_CONTRACT_SIZE = 24_000;
export const PALETTES_FILE =
  "../../packages/eth-projects-image-processing/data/palettes.json";
export const PALETTES_ENCODED_FILE = "data/palettes-encoded.json";

export const loadPalettes = (): Palettes => {
  try {
    return JSON.parse(fs.readFileSync(PALETTES_FILE, "utf8"));
  } catch (e) {
    console.error(e);
    return {
      fill: [],
      trait: {},
      layer: [],
      layerIndexes: [],
      item: [],
    };
  }
};

export const loadPalettesEncoded = (): PalettesStorage => {
  try {
    return JSON.parse(fs.readFileSync(PALETTES_ENCODED_FILE, "utf8"));
  } catch (e) {
    console.error(e);
    return {
      fillBytes: "",
      traitBytes: "",
      traitBytesIndexes: "",
      layerIndexes: "",
    };
  }
};

// Deploy constants
export const TAGS = {
  INTEGERS: "Integers",
  PALETTE_RENDERER: "PaletteRenderer",
  ARRAY: "Array",
  BYTES: "Bytes",
};
