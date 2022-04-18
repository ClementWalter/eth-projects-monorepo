import { expect } from "chai";
import { encodeBitsToBytes } from "../../utils/encodings/bits";

describe("bits utils", function () {
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
});
