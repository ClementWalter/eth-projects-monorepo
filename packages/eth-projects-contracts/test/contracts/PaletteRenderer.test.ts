import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { PaletteRenderer } from "../../typechain";
import { cartesian } from "../../utils/arrays";

chai.use(jestSnapshotPlugin());
chai.use(solidity);
const { expect } = chai;

const setup = async () => {
  await deployments.fixture([TAGS.PALETTE_RENDERER]);
  const contracts = {
    PaletteRenderer: (await ethers.getContract(
      "PaletteRenderer"
    )) as PaletteRenderer,
  };
  const constants = {
    RECT_TAG_START: await contracts.PaletteRenderer.RECT_TAG_START(),
    Y_TAG: await contracts.PaletteRenderer.Y_TAG(),
    WH_FILL_TAG: await contracts.PaletteRenderer.WH_FILL_TAG(),
    RECT_TAG_END: await contracts.PaletteRenderer.RECT_TAG_END(),
    SVG_TAG_START: await contracts.PaletteRenderer.SVG_TAG_START(),
    SVG_TAG_END: await contracts.PaletteRenderer.SVG_TAG_END(),
  };
  return {
    ...contracts,
    ...constants,
  };
};

const paletteFixture = deployments.createFixture(async ({}) => {
  const contractsAndConstants = await setup();
  const palette =
    "0x" +
    [...Array(256).keys()].map((i) => i.toString(16).padStart(6, "0")).join("");
  // await contractsAndConstants.PaletteRenderer.storeBytes
});

describe("PaletteRenderer", function () {
  describe("join", async function () {
    [...Array(100).keys()].forEach((stringCount) => {
      [...Array(100).keys()].forEach((stringLength) => {
        it(`should return the correct string for ${
          stringCount + 1
        } strings of length ${stringLength + 1}`, async function () {
          const { PaletteRenderer } = await setup();
          const strings = [...Array(stringCount + 1).keys()].map(
            (j) => `${j}${"-".repeat(stringLength)}`
          );
          const result = await PaletteRenderer.join(strings);
          expect(result).to.equal(strings.join(""));
        });
      });
    });
  });
});
