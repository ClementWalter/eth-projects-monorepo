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
    [...Array(100).keys()].forEach((stringCount) => {
      [...Array(100).keys()].forEach((stringLength) => {
        it(`should return the correct string for ${
          stringCount + 1
        } strings of length ${stringLength + 1}`, async function () {
          const { ArraySol } = await setup();
          const strings = [...Array(stringCount + 1).keys()].map(
            (j) => `${j}${"-".repeat(stringLength)}`
          );
          const result = await ArraySol.join(strings);
          expect(result).to.equal(strings.join(""));
        });
      });
    });
  });
});
