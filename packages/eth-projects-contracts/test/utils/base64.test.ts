// See https://stackoverflow.com/a/61155795/4444546
import { expect } from "chai";
import { decode, encode } from "../../utils/base64";

describe("base64", function () {
  describe("encode", () => {
    it("should return encoded str", () => {
      const b64 = "SGVsbG8sIFdvcmxkIQ==";
      const str = "Hello, World!";
      expect(encode(str)).to.equal(b64);
    });
  });
  describe("decode", () => {
    it("should return decoded str", () => {
      const b64 = "SGVsbG8sIFdvcmxkIQ==";
      const str = "Hello, World!";
      expect(decode(b64)).to.equal(str);
    });
  });
  describe("encode/decode", () => {
    it("should return same str", () => {
      const str = "Hello, World!";
      expect(decode(encode(str))).to.equal(str);
    });
  });
  describe("decode/encode", () => {
    it("should return same b64", () => {
      const b64 = "SGVsbG8sIFdvcmxkIQ==";
      expect(encode(decode(b64))).to.equal(b64);
    });
  });
});
