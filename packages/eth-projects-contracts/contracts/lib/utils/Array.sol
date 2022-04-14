// SPDX-License-Identifier: MIT

/*
 * @title Arrays Utils
 * @author Clement Walter <clement0walter@gmail.com>
 *
 * @notice An attempt at implementing some of the widely used javascript's Array functions in solidity.
 */
pragma solidity ^0.8.12;

error EmptyArray();

library Array {
    function join(string[] memory a) public pure returns (string memory) {
        bytes memory tempBytes;

        assembly {
            // Get a location of some free memory and store it in tempBytes as
            // Solidity does for memory variables.
            tempBytes := mload(0x40)

            // Skip the first 32 bytes where we will store the length of the result
            let memoryPointer := add(tempBytes, 0x20)

            // Load the length (first 32 bytes)
            let inputLength := mload(a)
            let inputData := add(a, 0x20)
            let end := add(inputData, mul(inputLength, 0x20))

            // Initialize the length of the final string
            let stringLength := 0

            // Iterate over all strings (a string is itself an array).
            for {
                let pointer := inputData
            } lt(pointer, end) {
                pointer := add(pointer, 0x20)
            } {
                let currentStringArray := mload(pointer)
                let currentStringLength := mload(currentStringArray)
                stringLength := add(stringLength, currentStringLength)
                let currentStringBytesCount := add(
                    div(currentStringLength, 0x20),
                    gt(mod(currentStringLength, 0x20), 0)
                )

                let currentPointer := add(currentStringArray, 0x20)

                for {
                    let copiedBytesCount := 0
                } lt(copiedBytesCount, currentStringBytesCount) {
                    copiedBytesCount := add(copiedBytesCount, 1)
                } {
                    mstore(
                        add(memoryPointer, mul(copiedBytesCount, 0x20)),
                        mload(currentPointer)
                    )
                    currentPointer := add(currentPointer, 0x20)
                }
                memoryPointer := add(memoryPointer, currentStringLength)
            }

            mstore(tempBytes, stringLength)
            mstore(0x40, and(add(memoryPointer, 31), not(31)))
        }
        return string(tempBytes);
    }

    function join(bytes1[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes2[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes3[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes4[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes8[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes16[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function join(bytes32[] memory a) public pure returns (bytes memory) {
        uint256 inputLength = a.length;
        if (inputLength == 0) revert EmptyArray();
        uint256 typeLength = a[0].length;

        uint256 inputData;
        assembly {
            inputData := add(a, 0x20)
        }
        return _joinValueType(typeLength, inputLength, inputData);
    }

    function _joinValueType(
        uint256 typeLength,
        uint256 inputLength,
        uint256 inputData
    ) private pure returns (bytes memory) {
        bytes memory tempBytes;

        assembly {
            let end := add(inputData, mul(inputLength, 0x20))

            // Get a location of some free memory and store it in tempBytes as
            // Solidity does for memory variables.
            tempBytes := mload(0x40)

            // Initialize the length of the final bytes: length is typeLength x inputLength (array of bytes4)
            mstore(tempBytes, mul(inputLength, typeLength))
            let memoryPointer := add(tempBytes, 0x20)

            // Iterate over all bytes4
            for {
                let pointer := inputData
            } lt(pointer, end) {
                pointer := add(pointer, 0x20)
            } {
                mstore(memoryPointer, mload(pointer))
                memoryPointer := add(memoryPointer, typeLength)
            }

            mstore(0x40, and(add(memoryPointer, 31), not(31)))
        }
        return tempBytes;
    }
}
