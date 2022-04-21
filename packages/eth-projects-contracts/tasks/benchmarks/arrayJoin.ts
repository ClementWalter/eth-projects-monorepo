import { task, types } from "hardhat/config";
import fs from "fs";

import { Array as ArrayAssembly, ArrayTestHelper } from "../../typechain";
import { MultiBar } from "cli-progress";
import { TAGS } from "../../utils/constants";

task(
  "benchmark:array-join",
  "Benchmark the gas usage of join in assembly and with concat loop"
)
  .addOptionalParam(
    "stringCountMax",
    "Maximum number of string to concat",
    100,
    types.int
  )
  .addOptionalParam(
    "stringLengthMax",
    "Maximum length for strings",
    100,
    types.int
  )
  .setAction(
    async ({ stringCountMax, stringLengthMax }, { deployments, ethers }) => {
      await deployments.fixture(TAGS.ARRAY);
      const ArrayAssembly = (await ethers.getContract(
        "Array"
      )) as ArrayAssembly;
      const ArrayTestHelper = (await ethers.getContract(
        "ArrayTestHelper"
      )) as ArrayTestHelper;

      const bar = new MultiBar({});
      const stringCountBar = bar.create(stringCountMax, 0);
      const stringLengthBar = bar.create(stringLengthMax, 0);
      const strings = [...Array(stringCountMax).keys()].map((j) =>
        j.toString().padEnd(stringLengthMax, "0")
      );

      // eslint-disable-next-line @typescript-eslint/ban-types
      const stats: Array<object> = [];
      for (const stringCount of [...Array(stringCountMax + 1).keys()].slice(
        1
      )) {
        for (const stringLength of [...Array(stringLengthMax + 1).keys()].slice(
          1
        )) {
          for (const glue of [",", ""]) {
            const assembly = (
              await ArrayAssembly.estimateGas["join(string[],string)"](
                strings
                  .slice(0, stringCount)
                  .map((s) => s.slice(0, stringLength)),
                glue
              )
            ).toString();
            const concat = (
              await ArrayTestHelper.estimateGas["join(string[],string)"](
                strings
                  .slice(0, stringCount)
                  .map((s) => s.slice(0, stringLength)),
                glue
              )
            ).toString();

            stats.push({
              stringCount,
              stringLength,
              glue,
              assembly,
              concat,
            });
            stringLengthBar.increment();
            console.log(
              "stringCount",
              stringCount,
              "stringLength",
              stringLength
            );
          }
          stringCountBar.increment();
        }
        stringLengthBar.update(0);
      }
      console.log(stats);
      fs.writeFileSync(
        "benchmarks/arrayJoin.json",
        JSON.stringify(stats, null, 2)
      );
      bar.stop();
    }
  );
