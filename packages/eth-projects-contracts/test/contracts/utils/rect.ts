import { Characteristic, Collection, Rect, Trait } from "../../../utils/types";

export const generateRect = (index: number): Rect => ({
  x: index % 64,
  y: index % 64,
  width: index % 64,
  height: index % 64,
  fillIndex: (index * 4) % 256,
});

export const generateTrait = (rectCount: number): Trait => ({
  rects: [...Array(rectCount + 1).keys()].map(generateRect),
  name: `trait_${rectCount}`,
});

export const generateCharacteristic = (traitCount: number): Characteristic => ({
  traits: [...Array(traitCount + 1).keys()].map(generateTrait),
  name: `characteristic-${traitCount}`,
});

export const generateCollection = (
  characteristicCount: number
): Collection => ({
  characteristics: [...Array(characteristicCount + 1).keys()].map(
    generateCharacteristic
  ),
  description: `collection-${characteristicCount}`,
});
