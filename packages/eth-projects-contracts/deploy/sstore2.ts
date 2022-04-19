// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  if (!network.tags.local) {
    return;
  }

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SSTORE2", {
    from: deployer,
    log: true,
    contract: "contracts/test_utils/SSTORE2.sol:SSTORE2",
  });
};
export default func;
func.tags = [TAGS.SSTORE2];
