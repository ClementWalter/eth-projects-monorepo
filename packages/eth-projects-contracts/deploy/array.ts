// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Array", {
    from: deployer,
    log: true,
    contract: "contracts/lib/utils/Array.sol:Array",
  });

  if (network.tags.local) {
    await deploy("ArrayTestHelper", {
      from: deployer,
      log: true,
    });
  }
};
export default func;
func.tags = [TAGS.ARRAY];
