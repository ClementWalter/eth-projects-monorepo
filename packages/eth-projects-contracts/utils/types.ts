export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: number;
};

export type Trait = Rect[];

export type Palettes = {
  fill: string[];
  trait: Record<string, Rect[]>;
  layer: string[];
  layerIndexes: number[];
  item: string[];
};

export type PalettesStorage = {
  fillBytes: string;
  traitBytes: string;
  traitBytesIndexes: string;
  layerIndexes: string;
};
