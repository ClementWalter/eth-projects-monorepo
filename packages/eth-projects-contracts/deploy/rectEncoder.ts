// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const Array = await get("Array");
  const RendererCommons = await get("RendererCommons");

  await deploy("RectEncoder", {
    from: deployer,
    log: true,
    libraries: {
      Array: Array.address,
      RendererCommons: RendererCommons.address,
    },
  });
};
export default func;
func.tags = [TAGS.RECT_ENCODER];
func.dependencies = [TAGS.ARRAY, TAGS.RENDERER_COMMONS];
