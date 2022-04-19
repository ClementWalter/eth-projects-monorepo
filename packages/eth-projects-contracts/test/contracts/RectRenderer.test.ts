import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { RectRenderer, RendererCommons, SSTORE2 } from "../../typechain";
import {
  encodeCollection,
  encodeTrait,
} from "../../utils/encodings/rectEncoding";
import { Collection } from "../../utils/types";
import { generateCollection } from "./utils";

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
