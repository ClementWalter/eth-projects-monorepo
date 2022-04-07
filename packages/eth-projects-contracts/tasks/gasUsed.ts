import { task } from "hardhat/config";

task("gas-used", "Compute the total gas used for deployment").setAction(
  async ({}, { deployments }) => {
    const contracts = await deployments.all();
    let gas = 0;
    for (const contract of Object.values(contracts)) {
      gas += parseInt(contract.receipt?.gasUsed as string);
    }
    console.log(`Total gas used: ${gas}`);
  }
);
