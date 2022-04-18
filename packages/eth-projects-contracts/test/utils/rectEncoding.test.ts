import { expect } from "chai";
import {
  encodeCoordinateToBits,
  encodeFillToBits,
  encodeRectToBits,
  encodeTrait,
} from "../../utils/encodings/rectEncoding";

describe("rectEncoding utils", function () {
  describe("encodeCoordinateToBits", () => {
    const tests = [
      { args: 0, expected: "000000" },
      { args: 1, expected: "000001" },
      { args: 2, expected: "000010" },
      { args: 63, expected: "111111" },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeCoordinateToBits(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeFillToBits", () => {
    const tests = [
      { args: 0, expected: "00000000" },
      { args: 1, expected: "00000001" },
      { args: 2, expected: "00000010" },
      { args: 255, expected: "11111111" },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeFillToBits(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeRectToBits", () => {
    const tests = [
      {
        args: { x: 0, y: 0, width: 15, height: 7, fillIndex: 0 },
        expected: "000000" + "000000" + "001111" + "000111" + "00000000",
      },
      {
        args: { x: 63, y: 31, width: 3, height: 0, fillIndex: 255 },
        expected: "111111" + "011111" + "000011" + "000000" + "11111111",
      },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeRectToBits(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeTrait", () => {
    const tests = [
      {
        args: {
          rects: [
            { x: 0, y: 0, width: 15, height: 7, fillIndex: 0 },
            { x: 63, y: 31, width: 3, height: 0, fillIndex: 255 },
          ],
          name: "trait",
        },
        expected: "0x0003c700fdf0c0ff",
      },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args.rects} as ${test.expected}`, () => {
        expect(encodeTrait(test.args)).to.equal(test.expected);
      });
    });
  });
});
