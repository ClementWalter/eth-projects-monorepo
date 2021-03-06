import chai from "chai";
import { deployments, ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { TAGS } from "../../utils/constants";
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot";
import { Array as ArraySol } from "../../typechain";

chai.use(jestSnapshotPlugin());
chai.use(solidity);
const { expect } = chai;

const setup = async () => {
  await deployments.fixture([TAGS.ARRAY]);
  const contracts = {
    ArraySol: (await ethers.getContract("Array")) as ArraySol,
  };
  return {
    ...contracts,
  };
};

describe("Array", function () {
  describe("join", async function () {
    describe("join(string[],string)", async function () {
      [...Array(100).keys()].forEach((stringCount) => {
        [...Array(100).keys()].forEach((stringLength) => {
          ["", ","].forEach((glue) => {
            it(`should return the correct string for ${
              stringCount + 1
            } strings of length ${
              stringLength + 1
            } with glue "${glue}"`, async function () {
              const { ArraySol } = await setup();
              const strings = [...Array(stringCount + 1).keys()].map(
                (j) => `${j}${"-".repeat(stringLength)}`
              );
              const result = await ArraySol["join(string[],string)"](
                strings,
                glue
              );
              expect(result).to.equal(strings.join(glue));
            });
          });
        });
      });

      it("should revert when glue is longer than 32", async () => {
        const { ArraySol } = await setup();
        const limit = await ArraySol["join(string[],string)"](
          ["strings"],
          ",".repeat(32)
        );
        expect(limit).to.eq("strings");
        await expect(
          ArraySol["join(string[],string)"](["strings"], ",".repeat(33))
        ).to.be.revertedWith("");
      });
    });

    [2, 3, 4, 8, 16, 32]
      .map((l) => ({
        length: l,
        key: `join(bytes${l}[])`,
      }))
      .forEach((type) => {
        describe(`bytes${type.length}[]`, function () {
          [...Array(100).keys()].forEach((length) => {
            it(`should return the correct bytes for bytes${type.length}[${
              length + 1
            }]`, async function () {
              const { ArraySol } = await setup();
              const inputArray = [...Array(length + 1).keys()].map((j) =>
                j.toString(16).padEnd(type.length * 2, "0")
              );
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const result = await ArraySol[type.key](
                inputArray.map((b) => "0x" + b)
              );
              expect(result).to.equal("0x" + inputArray.join(""));
            });
          });
        });
      });

    [16]
      .map((l) => ({
        length: l,
        key: `join(uint${l}[])`,
      }))
      .forEach((type) => {
        describe(`uint${type.length}[]`, function () {
          [...Array(100).keys()].forEach((length) => {
            it(`should return the correct bytes for uint${type.length}[${
              length + 1
            }]`, async function () {
              const { ArraySol } = await setup();
              const inputArray = [...Array(length + 1).keys()];
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const result = await ArraySol[type.key](inputArray);
              expect(result).to.equal(
                "0x" +
                  inputArray
                    .map((i) => i.toString(16).padStart(4, "0"))
                    .join("")
              );
            });
          });
        });
      });
  });
});
