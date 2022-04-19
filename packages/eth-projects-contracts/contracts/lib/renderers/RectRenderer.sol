// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../utils/Integers.sol";
import {Bytes} from "../utils/Bytes.sol";
import {Array} from "../utils/Array.sol";

import "hardhat/console.sol";

error InvalidLength(uint256 length);
error CharacteristicOutOfRange(uint256 characteristic);
error TraitOutOfRange(uint256 trait);

/**  @title RectRenderer
 *
 *   This library can be used to render on-chain images stored as a layering of rectangles.
 *   The returned images is an url safe encoded image uri.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
library RectRenderer {
    using Integers for uint8;
    using Integers for uint256;
    using Bytes for bytes;
    using Array for string[];

    string public constant RECT_TAG_START = "%3crect%20x=%27";
    string public constant Y_TAG = "%27%20y=%27";
    string public constant WIDTH_TAG = "%27%20width=%27";
    string public constant HEIGHT_TAG = "%27%20height=%27";
    string public constant FILL_TAG = "%27%20fill=%27%23";
    string public constant RECT_TAG_END = "%27/%3e";

    /** @dev Retrieve the bytes for the given trait from the traits storage.
     *  @param pointer The pointer to the traits stored with SSTORE2.
     *  @param characteristicIndex The index of the characteristic in the collection.
     *  @param traitIndex The index of the trait in the characteristic.
     *  @return The bytes of the trait.
     */
    function getTraitBytes(
        address pointer,
        uint256 characteristicIndex,
        uint256 traitIndex
    ) public view returns (bytes memory) {
        uint16 characteristicsLength = SSTORE2.read(pointer, 0, 2).toUint16();

        if (characteristicsLength - 1 < characteristicIndex)
            revert CharacteristicOutOfRange(characteristicIndex);
        uint16 characteristicStart = SSTORE2
            .read(
                pointer,
                2 + 2 * characteristicIndex,
                2 + 2 * characteristicIndex + 2
            )
            .toUint16();
        uint16 traitsLength = SSTORE2
            .read(pointer, characteristicStart, characteristicStart + 2)
            .toUint16() - 1;
        if (traitsLength - 1 < traitIndex) revert TraitOutOfRange(traitIndex);
        bytes memory _indexes = SSTORE2.read(
            pointer,
            characteristicStart + 2 + 2 * traitIndex,
            characteristicStart + 2 + 2 * traitIndex + 4
        );
        return
            SSTORE2.read(
                pointer,
                characteristicStart + _indexes.toUint16(0),
                characteristicStart + _indexes.toUint16(2)
            );
    }

    function decodeBytes4ToRect(bytes4 rectBytes, string[] memory palette)
        public
        pure
        returns (string memory)
    {
        return decodeBytes4ToRect(rectBytes, palette, 0, 0);
    }

    function decodeBytes4ToRect(
        bytes4 rectBytes,
        string[] memory palette,
        uint256 offsetX,
        uint256 offsetY
    ) public pure returns (string memory) {
        return
            string.concat(
                RECT_TAG_START,
                (uint8(uint32(rectBytes >> 26)) + offsetX).toString(),
                Y_TAG,
                ((uint8(uint32(rectBytes >> 20)) & 0x3f) + offsetY).toString(),
                WIDTH_TAG,
                (uint8(uint32(rectBytes >> 14)) & 0x3f).toString(),
                HEIGHT_TAG,
                (uint8(uint32(rectBytes >> 8)) & 0x3f).toString(),
                FILL_TAG,
                palette[uint8(rectBytes[3])],
                RECT_TAG_END
            );
    }

    function decodeBytesMemoryToRects(
        bytes memory rectsBytes,
        string[] memory palette
    ) public pure returns (string memory) {
        if (rectsBytes.length % 4 != 0) {
            revert InvalidLength(rectsBytes.length);
        }
        uint256 nbRects = rectsBytes.length / 4;
        string[] memory rects = new string[](nbRects);
        for (uint256 i = 0; i < rects.length; i++) {
            rects[i] = decodeBytes4ToRect(
                bytes4(rectsBytes.toUint32(i * 4)),
                palette
            );
        }
        return rects.join();
    }
}
