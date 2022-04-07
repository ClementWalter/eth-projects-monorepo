import { Rect, Trait } from "./types";

export const inlineTrait = (trait: Trait): string => {
  return trait
    .map(
      ({ x, y, width, height, fill }) =>
        `x: ${x}; y: ${y}; width: ${width}; height: ${height}; fill: ${fill};`
    )
    .join(" ")
    .trim();
};

export const encodeCoordinate = (coordinate: number): string => {
  return coordinate.toString(2).padStart(6, "0");
};

export const encodeFill = (fill: number): string => {
  return fill.toString(2).padStart(8, "0");
};

export const encodeRect = (rect: Rect): string => {
  // Rect encoding works like this:
  // the grid size is 45x45 so we take 6 bits per coordinate
  // they are 4 coordinates: x, y, width, height: 4x6 = 24 bits * 3 x 8 = 3 bytes
  // We use the last byte to store the fill color; it's way too much but way easier as well as it makes each rect a bytes32
  return (
    encodeCoordinate(rect.x) +
    encodeCoordinate(rect.y) +
    encodeCoordinate(rect.width) +
    encodeCoordinate(rect.height) +
    encodeFill(rect.fill)
  );
};

export const encodeBitsToBytes = (bits: string): string => {
  if (bits.length !== 32) {
    throw new Error("Invalid bits string: length should be 32");
  }

  const bytes = bits.match(/[01]{8}/g);
  if (bytes === null) {
    throw new Error("Invalid bits string: should be filled with 0 and 1");
  }

  return bytes
    .map((byte) => parseInt(byte, 2).toString(16).padStart(2, "0"))
    .join("");
};

export const encodeTrait = (trait: Trait): string => {
  return trait.map(encodeRect).map(encodeBitsToBytes).join("");
};
