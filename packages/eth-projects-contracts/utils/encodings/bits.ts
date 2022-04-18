export const encodeBitsToBytes = (bits: string): string => {
  if (bits.length % 8 !== 0) {
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
