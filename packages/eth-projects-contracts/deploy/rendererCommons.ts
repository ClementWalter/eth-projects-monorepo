// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const Integers = await get("Integers");
  const Array = await get("Array");

  await deploy("RendererCommons", {
    from: deployer,
    log: true,
    libraries: {
      Integers: Integers.address,
      Array: Array.address,
    },
  });
};
export default func;
func.tags = [TAGS.RENDERER_COMMONS];
func.dependencies = [TAGS.INTEGERS, TAGS.ARRAY];
