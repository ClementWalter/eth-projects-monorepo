import { Characteristic, Collection, Rect, Trait } from "../types";
import { encodeBitsToBytes } from "./bits";
import { cumulativeSum } from "../arrays";

export const encodeCoordinateToBits = (coordinate: number): string => {
  return coordinate.toString(2).padStart(6, "0");
};

export const encodeFillToBits = (fill: number): string => {
  return fill.toString(2).padStart(8, "0");
};

export const encodeRectToBits = (rect: Rect): string => {
  return (
    encodeCoordinateToBits(rect.x) +
    encodeCoordinateToBits(rect.y) +
    encodeCoordinateToBits(rect.width) +
    encodeCoordinateToBits(rect.height) +
    encodeFillToBits(rect.fillIndex)
  );
};

export const encodeRectToBytes4 = (rect: Rect): string => {
  return encodeBitsToBytes(encodeRectToBits(rect));
};

export const encodeTrait = (trait: Trait): string => {
  return trait.rects.map(encodeRectToBytes4).join("");
};

export const encodeCharacteristic = (
  characteristic: Characteristic
): string => {
  const traits = characteristic.traits.map(encodeTrait);
  const shift = 4 + traits.length * 2;
  const indexes = [0, ...traits.map((t) => t.length / 2)]
    .map(cumulativeSum(shift))
    .map((i) => i.toString(16).padStart(4, "0"))
    .join("");
  return (
    (traits.length + 1).toString(16).padStart(4, "0") +
    indexes +
    traits.join("")
  );
};

export const encodeCollection = (collection: Collection): string => {
  const characteristics = collection.characteristics.map(encodeCharacteristic);
  const shift = 2 + characteristics.length * 2;
  const indexes = [0, ...characteristics.map((c) => c.length / 2)]
    .slice(0, -1)
    .map(cumulativeSum(shift))
    .map((i) => i.toString(16).padStart(4, "0"))
    .join("");
  return (
    characteristics.length.toString(16).padStart(4, "0") +
    indexes +
    characteristics.join("")
  );
};

export const inlineRect = (rect: Rect): string => {
  return `x:${rect.x}, y:${rect.y}, width:${rect.width}, height:${rect.height}, fillIndex:${rect.fillIndex}`;
};
