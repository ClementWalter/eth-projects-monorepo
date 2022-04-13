// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../utils/Integers.sol";
import {Bytes} from "../utils/Bytes.sol";
import {Array} from "../utils/Array.sol";

error InvalidLength(uint256 length);

/**  @title RectRenderer
 *
 *   This library can be used to render on-chain images stored as a layering of rectangles.
 *   The returned images is an url safe encoded image uri.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
library RectRenderer {
    using Integers for uint8;
    using Integers for uint32;
    using Integers for uint256;
    using Bytes for bytes;
    using Array for string[];

    // We have a total of 4 * 6 = 24 bits = 3 bytes for coordinates + 1 byte for the color
    // Hence each rect is 4 bytes
    uint8 public constant BITS_PER_COORDINATES = 6;
    uint8 public constant BITS_PER_FILL_INDEX = 8;

    string public constant RECT_TAG_START = "%3crect%20x=%27";
    string public constant Y_TAG = "%27%20y=%27";
    string public constant WIDTH_TAG = "%27%20width=%27";
    string public constant HEIGHT_TAG = "%27%20height=%27";
    string public constant FILL_TAG = "%27%20fill=%27%23";
    string public constant RECT_TAG_END = "%27/%3e";

    /** @dev This function lets map from layerIndex and itemIndex to traitIndex. Indeed, all the traits are expected to be stored in a
     *       single concatenated bytes array while it can be more convenient to reference them as item of a given layer array:
     *       each trait is one item of a given characteristic.
     * @param layerIndexes The start index of each layer. Must be sorted in ascending order and have a final value being the
     *        number of traits. For example if there are 2 layers with the first having 3 traits and the second having 2 traits,
     *        then the array must be [0, 3, 5].
     * @param _layerIndex The index of the layer.
     * @param _itemIndex The index of the item within the layer.
     * @return The trait index in the array of traits if it exists, 255 otherwise.
     */
    function getTraitIndex(
        uint256[] calldata layerIndexes,
        uint256 _layerIndex,
        uint256 _itemIndex
    ) public pure returns (uint256) {
        uint8 traitIndex = uint8(layerIndexes[_layerIndex]);
        uint8 nextTraitIndex = uint8(layerIndexes[_layerIndex + 1]);
        if (traitIndex + _itemIndex > nextTraitIndex - 1) {
            return type(uint8).max;
        }

        return _itemIndex + traitIndex;
    }

    /** @dev Retrieve the bytes for the given trait from the traitPalette storage. Because each trait has a variable
     *    size, we need to retrieve the size of the trait first with the traitIndexes and then retrieve the trait bytes.
     *  @param traitIndexesPointer The pointer to the traitIndexes array stored with SSTORE2.
     *  @param traitsPointer The pointer to the traits array stored with SSTORE2.
     *  @return The bytes of the trait.
     */
    function getTraitBytes(
        address traitIndexesPointer,
        address traitsPointer,
        uint256 _index
    ) public view returns (bytes memory) {
        bytes memory _indexes = SSTORE2.read(
            traitIndexesPointer,
            _index * 2,
            _index * 2 + 4
        );
        uint32 start = _indexes.toUint16(0);
        uint32 next = _indexes.toUint16(2);
        return SSTORE2.read(traitsPointer, start, next);
    }

    function decode4BytesTo1Rect(bytes4 rectBytes, string[] memory palette)
        public
        pure
        returns (string memory)
    {
        return decode4BytesTo1Rect(rectBytes, palette, 0, 0);
    }

    function decode4BytesTo1Rect(
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
            rects[i] = decode4BytesTo1Rect(rectsBytes.toBytes4(i * 4), palette);
        }
        return rects.join();
    }
}
