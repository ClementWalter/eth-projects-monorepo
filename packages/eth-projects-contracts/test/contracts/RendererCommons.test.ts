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

const names = {
  description: "description",
  characteristicNames: [...Array(10).keys()].map((i) => `characteristic-${i}`),
  traitNames: [...Array(10).keys()].map((i) =>
    [...Array(10).keys()].map((j) => `characteristic-${i}-trait-${j}`)
  ),
};
const items = names.traitNames.map((traits) =>
  Math.floor(Math.random() * traits.length)
);
const attributes = names.characteristicNames.map((characteristic, i) => ({
  trait_type: characteristic,
  value: names.traitNames[i][items[i]],
}));

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

const deployedPalettesFixture = deployments.createFixture(async () => {
  const contracts = await setup();
  const paletteEncoded = await contracts.RendererCommons.encodePalette(palette);
  let tx = await contracts.SSTORE2.write(paletteEncoded);
  let receipt = await tx.wait();
  const palettePointer = receipt.events
    ?.filter((e) => e.event === "Write")
    .map((e) => e?.args?.pointer)[0];
  const namesEncoded = await contracts.RendererCommons.encodeNames(
    names.description,
    names.characteristicNames,
    names.traitNames
  );
  tx = await contracts.SSTORE2.write(namesEncoded);
  receipt = await tx.wait();
  const namesPointer = receipt.events
    ?.filter((e) => e.event === "Write")
    .map((e) => e?.args?.pointer)[0];
  return { ...contracts, palettePointer, namesPointer };
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
          const { RendererCommons, palettePointer } =
            await deployedPalettesFixture();
          const fill = await RendererCommons["getFill(address,uint256)"](
            palettePointer,
            index
          );
          expect(fill).to.equal(color);
        });
      });
    });
    describe("getFill(bytes,uint256)", function () {
      palette.forEach((color, index) => {
        it(`should return ${color} for ${index}`, async () => {
          const { RendererCommons, SSTORE2, palettePointer } =
            await deployedPalettesFixture();
          const paletteBytes = await SSTORE2["read(address)"](palettePointer);
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
        const { RendererCommons, palettePointer } =
          await deployedPalettesFixture();
        const paletteStored = await RendererCommons["getPalette(address)"](
          palettePointer
        );
        expect(paletteStored).to.deep.equal(palette);
      });
    });
    describe("getPalette(bytes)", function () {
      it("should return the original palette", async () => {
        const { RendererCommons, SSTORE2, palettePointer } =
          await deployedPalettesFixture();
        const paletteBytes = await SSTORE2["read(address)"](palettePointer);
        const paletteStored = await RendererCommons["getPalette(bytes)"](
          paletteBytes
        );
        expect(paletteStored).to.deep.equal(palette);
      });
    });
  });
  describe("tokenData", async function () {
    it("should return token data as js object", async () => {
      const { RendererCommons, namesPointer } = await deployedPalettesFixture();
      const tokenData = await RendererCommons.tokenData(namesPointer, items);
      expect({
        image: tokenData.image,
        description: tokenData.description,
        name: tokenData.name,
        attributes: tokenData.attributes.map((a) => ({
          trait_type: a.trait_type,
          value: a.value,
        })),
      }).to.deep.equal({
        image: "",
        name: "",
        description: names.description,
        attributes,
      });
    });
  });
  describe("tokenURI", async function () {
    it("should return token URI as json object", async () => {
      const { RendererCommons, namesPointer } = await deployedPalettesFixture();
      const tokenURI = await RendererCommons.tokenURI(namesPointer, items);
      expect(
        JSON.parse(tokenURI.replace("data:application/json,", ""))
      ).to.deep.equal({
        image: "",
        name: "",
        description: names.description,
        attributes,
      });
    });
  });
});
