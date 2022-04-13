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
});
