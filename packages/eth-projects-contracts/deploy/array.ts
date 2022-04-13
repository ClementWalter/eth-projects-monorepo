// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Array", {
    from: deployer,
    log: true,
    contract: "contracts/lib/utils/Array.sol:Array",
  });
};
export default func;
func.tags = [TAGS.ARRAY];
