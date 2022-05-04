import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { RectRenderer, RendererCommons, SSTORE2 } from "../../typechain";
import {
  encodeCollection,
  encodeRectToBytes4,
  encodeTrait,
  inlineRect,
} from "../../utils/encodings/rectEncoding";
import { Collection } from "../../utils/types";
import { generateCollection, generateImageItems } from "./utils";

chai.use(jestSnapshotPlugin());
chai.use(solidity);
const { expect } = chai;

const collection: Collection = generateCollection(20);
const palette: string[] = [...Array(256).keys()].map((i) =>
  i.toString(16).padStart(6, "0")
);
const setup = async () => {
  await deployments.fixture([
    TAGS.RECT_RENDERER,
    TAGS.RECT_ENCODER,
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
  let tx = await contracts.SSTORE2.write("0x" + collectionBytes);
  let receipt = await tx.wait();
  const collectionPointer = receipt.events
    ?.filter((event) => event.event == "Write")
    .map((e) => e?.args?.pointer)
    .pop();
  tx = await contracts.SSTORE2.write("0x" + palette.join(""));
  receipt = await tx.wait();
  const palettePointer = receipt.events
    ?.filter((event) => event.event == "Write")
    .map((e) => e?.args?.pointer)
    .pop();
  return { ...contracts, collectionPointer, palettePointer };
});

describe("RectRenderer", function () {
  describe("getTraitBytes", async function () {
    collection.characteristics.forEach(
      (characteristic, characteristicIndex) => {
        characteristic.traits.forEach((trait, traitIndex) => {
          it(`should return the correct bytes for characteristic ${characteristicIndex} and trait ${traitIndex}`, async () => {
            const { RectRenderer, collectionPointer } =
              await deployedCollectionFixture();
            const result = await RectRenderer.getTraitBytes(
              collectionPointer,
              characteristicIndex,
              traitIndex
            );
            expect(result).to.equal("0x" + encodeTrait(trait));
          });
        });
      }
    );
  });
  describe("decodeBytes4ToRect", async function () {
    collection.characteristics
      .slice(-1)[0]
      .traits.slice(-1)[0]
      .rects.forEach((rect) => {
        it(`should return the correct rect for rect ${inlineRect(
          rect
        )}`, async () => {
          const { RectRenderer } = await deployedCollectionFixture();
          const result = await RectRenderer[
            "decodeBytes4ToRect(bytes4,string[])"
          ]("0x" + encodeRectToBytes4(rect), palette);
          expect(result).to.matchSnapshot();
        });
      });
  });
  describe("decodeBytesMemoryToRects", async function () {
    collection.characteristics.slice(-1)[0].traits.forEach((trait) => {
      it(`should return the correct trait for ${trait.name}`, async () => {
        const { RectRenderer } = await deployedCollectionFixture();
        const result = await RectRenderer.decodeBytesMemoryToRects(
          "0x" + trait.rects.map(encodeRectToBytes4).join(""),
          palette
        );
        expect(result).to.matchSnapshot();
      });
    });
    it(`should return the correct trait for hardcoded failed example`, async () => {
      const { RectRenderer } = await deployedCollectionFixture();
      const result = await RectRenderer.decodeBytesMemoryToRects(
        "0x000b6d102566cb0029564d0034c4c40038b4460040834c0029664b0a38c4440a3c93ca0040934a0a2d75c9003dd0c10345a043033da043033d90c1034dd0c10355a043034da043034d90c1035dd0c10365a043035da043035d90c1036dd0c10375a043036da043036d90c1035ca1450044a145005cd1420144d1420164d041024cd0410264b042104cb04210651041004d10410051014100507141005460c100585041005470c10258604102547041016a31c1003231c100662241002e2241007670410f3e70410f7260c10f3a60c10f6e41420f3641420f7650410e3e50410e7240c10e3a40c10e7640410c3e40410c6a21c10a3221c10a00000000",
        palette.slice(0, 17)
      );
      expect(result).to.matchSnapshot();
    });
  });
  describe("imageBytes", async function () {
    [...Array(30).keys()]
      .map(() => generateImageItems(collection))
      .forEach((items) => {
        it(`should return the correct image bytes for traits ${items.join(
          "-"
        )}`, async () => {
          const { RectRenderer, collectionPointer } =
            await deployedCollectionFixture();
          const result = await RectRenderer.imageBytes(
            collectionPointer,
            items
          );
          expect(result).to.equal(
            "0x" +
              items
                .map((traitIndex, characteristicIndex) =>
                  encodeTrait(
                    collection.characteristics[characteristicIndex].traits[
                      traitIndex
                    ]
                  )
                )
                .join("")
          );
        });
      });
  });
  describe("decodeImage", async function () {
    [...Array(30).keys()]
      .map(() => generateImageItems(collection))
      .forEach((items) => {
        it(`should return the correct image for traits ${items.join(
          "-"
        )}`, async () => {
          const { RectRenderer, collectionPointer, palettePointer } =
            await deployedCollectionFixture();
          const result = await RectRenderer.decodeImage(
            collectionPointer,
            palettePointer,
            items
          );
          expect(result).to.matchSnapshot();
        });
      });
  });
});
