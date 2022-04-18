export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  fillIndex: number;
};

export type Trait = {
  rects: Rect[];
  name: string;
};

export type Characteristic = {
  traits: Trait[];
  name: string;
};

export type Collection = {
  characteristics: Characteristic[];
  description: string;
};
