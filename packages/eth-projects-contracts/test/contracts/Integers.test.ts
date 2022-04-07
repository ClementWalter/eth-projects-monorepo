import { setupUser, setupUsers } from "./utils";
import { expect } from "chai";
import {
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import { cartesian } from "../../utils/arrays";

async function setup() {
  await deployments.fixture(["Integers"]);
  const contracts = {
    Integers: await ethers.getContract("Integers"),
  };
  const { deployer } = await getNamedAccounts();
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
    deployer: await setupUser(deployer, contracts),
  };
}

describe("Integers", function () {
  describe("toString(uint256,uint8,uint8)", () => {
    cartesian(
      [...Array(256).keys()], // values
      [2, 10, 16], // base
      [0, 2] // length
    ).forEach((test: Array<number>) =>
      it(`Should write ${test[0]} to string with base ${test[1]} and padding ${test[2]}`, async function () {
        const { Integers } = await setup();
        let res = await Integers.functions["toString(uint256,uint8,uint8)"](
          test[0],
          test[1],
          test[2]
        );
        expect(res[0].toLowerCase()).to.equal(
          test[0]
            .toString(test[1])
            .padStart(test[2], "0")
            .slice(-test[2])
            .toLowerCase()
        );
        if (test[1] === 10 && test[2] === 0) {
          res = await Integers.functions["toString(uint256)"](test[0]);
          expect(res[0].toLowerCase()).to.equal(test[0].toString());
        }
        if (test[2] === 0) {
          res = await Integers.functions["toString(uint256,uint8)"](
            test[0],
            test[1]
          );
          expect(res[0].toLowerCase()).to.equal(
            test[0].toString(test[1]).toLowerCase()
          );
        }
      })
    );
  });
  describe("load16", () => {
    const tests = [
      { args: ["0x00", "0x01"], expected: 1 },
      { args: ["0x00", "0x10"], expected: 16 },
      { args: ["0x01", "0x00"], expected: 256 },
      { args: ["0x10", "0x00"], expected: 4_096 },
      { args: ["0xff", "0xff"], expected: 65_535 },
    ];
    tests.forEach((test) =>
      it(`Should decode ${test.args} to ${test.expected}`, async function () {
        const { Integers } = await setup();
        const res = await Integers.load16(test.args[0], test.args[1]);
        expect(res).to.equal(test.expected);
      })
    );
  });
  describe("load12", () => {
    const tests = [
      {
        args: ["0x00", "0x01", "0x01"],
        expected: [parseInt("000", 16), parseInt("101", 16)],
      },
      {
        args: ["0x11", "0x01", "0x01"],
        expected: [parseInt("110", 16), parseInt("101", 16)],
      },
      {
        args: ["0x10", "0x11", "0x01"],
        expected: [parseInt("101", 16), parseInt("101", 16)],
      },
      {
        args: ["0x00", "0x00", "0x00"],
        expected: [0, 0],
      },
      {
        args: ["0xff", "0xff", "0xff"],
        expected: [4_095, 4_095],
      },
    ];
    tests.forEach((test) =>
      it(`Should decode ${test.args} to ${test.expected}`, async function () {
        const { Integers } = await setup();
        const res = await Integers.load12x2(
          test.args[0],
          test.args[1],
          test.args[2]
        );
        expect(res[0]).to.equal(test.expected[0]);
        expect(res[1]).to.equal(test.expected[1]);
      })
    );
  });
});
