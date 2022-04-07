import { task } from "hardhat/config";

task(
  "verify-fix",
  "Another verify task because etherscan-verify currently does not work"
).setAction(async ({}, { deployments, run }) => {
  const contracts = await deployments.all();
  for (const contract of Object.values(contracts)) {
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      });
    } catch (e) {
      console.log(e);
      console.log("Contract already verified");
    }
  }
});
