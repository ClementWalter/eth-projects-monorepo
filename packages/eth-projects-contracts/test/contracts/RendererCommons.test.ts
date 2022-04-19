import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { TAGS } from "../../utils/constants";
import { RendererCommons, SSTORE2 } from "../../typechain";
import { cartesian } from "../../utils/arrays";

const palette: Array<string> = cartesian(
  [...Array(5).keys()].map(() =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()
  ),
  [...Array(5).keys()].map(() =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()
  ),
  [...Array(5).keys()].map(() =>
    Math.floor(Math.random() * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()
  )
).map((c: Array<string>) => c.join(""));

async function setup() {
  await deployments.fixture([TAGS.RENDERER_COMMONS, TAGS.SSTORE2]);
  const contracts = {
    RendererCommons: (await ethers.getContract(
      "RendererCommons"
    )) as RendererCommons,
    SSTORE2: (await ethers.getContract("SSTORE2")) as SSTORE2,
  };
  return {
    ...contracts,
  };
}

const deployedPaletteFixture = deployments.createFixture(async () => {
  const contracts = await setup();
  const paletteEncoded = await contracts.RendererCommons.encodePalette(palette);
  const tx = await contracts.SSTORE2.write(paletteEncoded);
  const receipt = await tx.wait();
  const pointer = receipt.events
    ?.filter((e) => e.event === "Write")
    .map((e) => e?.args?.pointer)[0];
  return { ...contracts, pointer };
});

describe("RendererCommons", function () {
  describe("encodePalette", () => {
    it(`should concat hex colors`, async () => {
      const { RendererCommons } = await setup();
      const paletteEncoded = await RendererCommons.encodePalette(palette);
      expect(paletteEncoded).to.equal("0x" + palette.join(""));
    });
  });
  describe("getFill", async () => {
    describe("getFill(address,uint256)", async function () {
      palette.forEach((color, index) => {
        it(`should return ${color} for ${index}`, async () => {
          const { RendererCommons, pointer } = await deployedPaletteFixture();
          const fill = await RendererCommons["getFill(address,uint256)"](
            pointer,
            index
          );
          expect(fill).to.equal(color);
        });
      });
    });
    describe("getFill(bytes,uint256)", function () {
      palette.forEach((color, index) => {
        it(`should return ${color} for ${index}`, async () => {
          const { RendererCommons, SSTORE2, pointer } =
            await deployedPaletteFixture();
          const paletteBytes = await SSTORE2["read(address)"](pointer);
          const fill = await RendererCommons["getFill(bytes,uint256)"](
            paletteBytes,
            index
          );
          expect(fill).to.equal(color);
        });
      });
    });
  });
  describe("getPalette", function () {
    describe("getPalette(address)", function () {
      it("should return the original palette", async () => {
        const { RendererCommons, pointer } = await deployedPaletteFixture();
        const paletteStored = await RendererCommons["getPalette(address)"](
          pointer
        );
        expect(paletteStored).to.deep.equal(palette);
      });
    });
    describe("getPalette(bytes)", function () {
      it("should return the original palette", async () => {
        const { RendererCommons, SSTORE2, pointer } =
          await deployedPaletteFixture();
        const paletteBytes = await SSTORE2["read(address)"](pointer);
        const paletteStored = await RendererCommons["getPalette(bytes)"](
          paletteBytes
        );
        expect(paletteStored).to.deep.equal(palette);
      });
    });
  });
});
