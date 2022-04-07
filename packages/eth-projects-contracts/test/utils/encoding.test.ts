import { expect } from "chai";
import {
  encodeBitsToBytes,
  encodeCoordinate,
  encodeFill,
  encodeRect,
  encodeTrait,
} from "../../utils/encoding";

describe("encoding utils", function () {
  describe("encodeCoordinate", () => {
    const tests = [
      { args: 0, expected: "000000" },
      { args: 1, expected: "000001" },
      { args: 2, expected: "000010" },
      { args: 63, expected: "111111" },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeCoordinate(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeFill", () => {
    const tests = [
      { args: 0, expected: "00000000" },
      { args: 1, expected: "00000001" },
      { args: 2, expected: "00000010" },
      { args: 255, expected: "11111111" },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeFill(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeRect", () => {
    const tests = [
      {
        args: { x: 0, y: 0, width: 15, height: 7, fill: 0 },
        expected: "000000" + "000000" + "001111" + "000111" + "00000000",
      },
      {
        args: { x: 63, y: 31, width: 3, height: 0, fill: 255 },
        expected: "111111" + "011111" + "000011" + "000000" + "11111111",
      },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeRect(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeBitsToBytes", () => {
    const tests = [
      { args: "0".repeat(32), expected: "0".repeat(4 * 2) },
      { args: "0".repeat(24) + "11111111", expected: "0".repeat(3 * 2) + "ff" },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeBitsToBytes(test.args)).to.equal(test.expected);
      });
    });
  });
  describe("encodeTrait", () => {
    const tests = [
      {
        args: [
          { x: 0, y: 0, width: 15, height: 7, fill: 0 },
          { x: 63, y: 31, width: 3, height: 0, fill: 255 },
        ],
        expected: "0003c700fdf0c0ff",
      },
    ];

    tests.forEach((test) => {
      it(`should encode ${test.args} as ${test.expected}`, () => {
        expect(encodeTrait(test.args)).to.equal(test.expected);
      });
    });
  });
});
