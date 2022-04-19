import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { RectRenderer, RendererCommons, SSTORE2 } from "../../typechain";
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

const collection: Collection = generateCollection(20);

const setup = async () => {
  await deployments.fixture([
    TAGS.RECT_RENDERER,
    TAGS.RENDERER_COMMONS,
    TAGS.SSTORE2,
  ]);
  const contracts = {
    RendererCommons: (await ethers.getContract(
      "RendererCommons"
    )) as RendererCommons,
    RectRenderer: (await ethers.getContract("RectRenderer")) as RectRenderer,
    SSTORE2: (await ethers.getContract("SSTORE2")) as SSTORE2,
  };
  return {
    ...contracts,
  };
};

const deployedCollectionFixture = deployments.createFixture(async () => {
  const contracts = await setup();
  const collectionBytes = encodeCollection(collection);
  const tx = await contracts.SSTORE2.write("0x" + collectionBytes);
  const receipt = await tx.wait();
  const pointer = receipt.events
    ?.filter((event) => event.event == "Write")
    .map((e) => e?.args?.pointer)
    .pop();
  return { ...contracts, pointer };
});

describe("RectRenderer", function () {
  describe("encodeRect", async function () {
    [...Array(100).keys()]
      .map(() => Math.floor(Math.random() * 255))
      .map(generateRect)
      .forEach((rect: Rect) => {
        it(`should return the correct bytes4 string for ${inlineRect(
          rect
        )}`, async function () {
          const { RectRenderer } = await setup();
          const result = await RectRenderer.encodeRect(rect);
          expect(result).to.equal("0x" + encodeRectToBytes4(rect));
        });
      });
  });
  describe("encodeTrait", async function () {
    [...Array(64).keys()].map(generateTrait).forEach((trait: Trait) => {
      it(`should return the correct bytes and name for trait ${trait.name}`, async function () {
        const { RectRenderer } = await setup();
        const result = await RectRenderer.encodeTrait(trait);
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
          const { RectRenderer } = await setup();
          const result = await RectRenderer.encodeCharacteristic(
            characteristic
          );
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
          const { RectRenderer } = await setup();
          const result = await RectRenderer.encodeCollection(collection);
          expect(result.characteristicNames).to.deep.equal(
            collection.characteristics.map(
              (characteristic) => characteristic.name
            )
          );
          expect(result.traitNames).to.deep.equal(
            collection.characteristics.map((characteristic) =>
              characteristic.traits.map((trait) => trait.name)
            )
          );
          expect(result.description).to.equal(collection.description);
          expect(result.traits).to.equal("0x" + encodeCollection(collection));
        });
      });
  });
  describe("getTraitBytes", async function () {
    collection.characteristics.forEach(
      (characteristic, characteristicIndex) => {
        characteristic.traits.forEach((trait, traitIndex) => {
          it(`should return the correct bytes for characteristic ${characteristicIndex} and trait ${traitIndex}`, async () => {
            const { RectRenderer, pointer } = await deployedCollectionFixture();
            const result = await RectRenderer.getTraitBytes(
              pointer,
              characteristicIndex,
              traitIndex
            );
            expect(result).to.equal("0x" + encodeTrait(trait));
          });
        });
      }
    );
  });
});
