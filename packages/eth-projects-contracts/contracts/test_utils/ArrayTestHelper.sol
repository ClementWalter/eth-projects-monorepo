// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library ArrayTestHelper {
    function join(string[] memory a, string memory glue)
        public
        pure
        returns (string memory)
    {
        string memory result = "";
        for (uint256 i = 0; i < a.length; i++) {
            if (i == a.length - 1) {
                result = string.concat(result, a[i]);
            } else {
                result = string.concat(result, a[i], glue);
            }
        }
        return result;
    }

    function join(string[] memory a) public pure returns (string memory) {
        return join(a, "");
    }
}
