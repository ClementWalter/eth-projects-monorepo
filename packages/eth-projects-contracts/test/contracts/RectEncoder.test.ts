import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { RectEncoder, RectRenderer } from "../../typechain";
import {
  encodeCharacteristic,
  encodeCollection,
  encodeRectToBytes4,
  encodeTrait,
  inlineRect,
} from "../../utils/encodings/rectEncoding";
import { Characteristic, Collection, Rect, Trait } from "../../utils/types";
import {
  generateCharacteristic,
  generateCollection,
  generateRect,
  generateTrait,
} from "./utils";

chai.use(jestSnapshotPlugin());
chai.use(solidity);
const { expect } = chai;

const setup = async () => {
  await deployments.fixture([
    TAGS.RECT_ENCODER,
    TAGS.RECT_RENDERER,
    TAGS.RENDERER_COMMONS,
    TAGS.SSTORE2,
  ]);
  const contracts = {
    RectEncoder: (await ethers.getContract("RectEncoder")) as RectEncoder,
    RectRenderer: (await ethers.getContract("RectRenderer")) as RectRenderer,
  };
  return {
    ...contracts,
  };
};

describe("RectEncoder", function () {
  describe("encodeRect", async function () {
    [...Array(100).keys()]
      .map(() => Math.floor(Math.random() * 255))
      .map(generateRect)
      .forEach((rect: Rect) => {
        it(`should return the correct bytes4 string for ${inlineRect(
          rect
        )}`, async function () {
          const { RectEncoder } = await setup();
          const result = await RectEncoder.encodeRect(rect);
          expect(result).to.equal("0x" + encodeRectToBytes4(rect));
        });
      });
  });
  describe("encodeTrait", async function () {
    [...Array(64).keys()].map(generateTrait).forEach((trait: Trait) => {
      it(`should return the correct bytes and name for trait ${trait.name}`, async function () {
        const { RectEncoder } = await setup();
        const result = await RectEncoder.encodeTrait(trait);
        expect(result.rects).to.equal("0x" + encodeTrait(trait));
        expect(result.name).to.equal(trait.name);
      });
    });
  });
  describe("encodeCharacteristic", async function () {
    [...Array(100).keys()]
      .map(generateCharacteristic)
      .forEach((characteristic: Characteristic) => {
        it(`should return the correct bytes and names for ${characteristic.name} of ${characteristic.traits.length} traits`, async () => {
          const { RectEncoder } = await setup();
          const result = await RectEncoder.encodeCharacteristic(characteristic);
          expect(result.name).to.equal(characteristic.name);
          expect(result.names).to.deep.equal(
            characteristic.traits.map((trait) => trait.name)
          );
          expect(result.traits).to.equal(
            "0x" + encodeCharacteristic(characteristic)
          );
        });
      });
  });
  describe("encodeCollection", async function () {
    [...Array(30).keys()]
      .map(generateCollection)
      .forEach((collection: Collection) => {
        it(`should return the correct bytes and names for ${collection.description} of ${collection.characteristics.length} characteristics`, async () => {
          const { RectEncoder, RectRenderer } = await setup();
          const result = await RectEncoder.encodeCollection(collection);
          const resultDecoded = await RectRenderer.decodeNames(result.names);
          expect(resultDecoded.characteristicNames).to.deep.equal(
            collection.characteristics.map(
              (characteristic) => characteristic.name
            )
          );
          expect(resultDecoded.traitNames).to.deep.equal(
            collection.characteristics.map((characteristic) =>
              characteristic.traits.map((trait) => trait.name)
            )
          );
          expect(resultDecoded.description).to.equal(collection.description);
          expect(result.traits).to.equal("0x" + encodeCollection(collection));
        });
      });
  });
});
