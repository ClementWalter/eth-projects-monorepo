// noinspection JSUnusedGlobalSymbols

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { TAGS } from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const Array = await get("Array");
  const Bytes = await get("Bytes");
  const Integers = await get("Integers");

  await deploy("RectRenderer", {
    from: deployer,
    log: true,
    libraries: {
      Array: Array.address,
      Bytes: Bytes.address,
      Integers: Integers.address,
    },
  });
};
export default func;
func.tags = [TAGS.RECT_RENDERER];
func.dependencies = [TAGS.ARRAY, TAGS.BYTES, TAGS.INTEGERS];
