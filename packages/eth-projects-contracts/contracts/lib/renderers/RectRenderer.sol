// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../utils/Integers.sol";
import {Bytes} from "../utils/Bytes.sol";
import {Array} from "../utils/Array.sol";

error InvalidLength(uint256 length);
error CoordinatesOutOfRange(uint256 coordinate);
error CharacteristicOutOfRange(uint256 characteristic);
error TraitOutOfRange(uint256 trait);

/**  @title RectRenderer
 *
 *   This library can be used to render on-chain images stored as a layering of rectangles.
 *   The returned images is an url safe encoded image uri.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
contract RectRenderer {
    using Integers for uint8;
    using Integers for uint32;
    using Integers for uint256;
    using Bytes for bytes;
    using Array for string[];
    using Array for bytes[];
    using Array for uint16[];
    using Array for bytes4[];

    string public constant RECT_TAG_START = "%3crect%20x=%27";
    string public constant Y_TAG = "%27%20y=%27";
    string public constant WIDTH_TAG = "%27%20width=%27";
    string public constant HEIGHT_TAG = "%27%20height=%27";
    string public constant FILL_TAG = "%27%20fill=%27%23";
    string public constant RECT_TAG_END = "%27/%3e";

    struct Rect {
        uint32 x;
        uint32 y;
        uint32 width;
        uint32 height;
        uint32 fillIndex;
    }

    struct Trait {
        Rect[] rects;
        string name;
    }

    struct TraitEncoded {
        bytes rects;
        string name;
    }

    struct Characteristic {
        Trait[] traits;
        string name;
    }

    struct CharacteristicEncoded {
        bytes traits;
        string[] names;
        string name;
    }

    struct Collection {
        Characteristic[] characteristics;
        string description;
    }

    struct CollectionEncoded {
        bytes traits;
        string[][] traitsNames;
        string[] characteristicsNames;
        string description;
    }

    /** @dev Use this function to encode a single <rect> as expected by the renderer. Use this off-chain!
     *
     * @param rect The <rect> to encode
     * @return The encoded rectangle as a bytes4
     */
    function encodeRect(Rect memory rect) public pure returns (bytes4) {
        // each coordinates should use only 6 bits and is consequently stored like 00nnnnnn
        if (rect.x > 63) revert CoordinatesOutOfRange(rect.x);
        if (rect.y > 63) revert CoordinatesOutOfRange(rect.y);
        if (rect.width > 63) revert CoordinatesOutOfRange(rect.width);
        if (rect.height > 63) revert CoordinatesOutOfRange(rect.height);
        return
            bytes4(rect.x << 26) |
            bytes4(rect.y << 20) |
            bytes4(rect.width << 14) |
            bytes4(rect.height << 8) |
            bytes4(rect.fillIndex);
    }

    /** @dev Use this function to encode a _trait_, i.e. a list of <rect>s with a name, as expected by the renderer.
     *       Use this off-chain!
     *
     * @param trait The list of <rect>s to encode with a given name; should be shorter than 32 char.
     * @return The encoded list of rectangle
     */
    function encodeTrait(Trait memory trait)
        public
        pure
        returns (TraitEncoded memory)
    {
        bytes4[] memory rects = new bytes4[](trait.rects.length);
        for (uint256 i = 0; i < trait.rects.length; i++) {
            rects[i] = encodeRect(trait.rects[i]);
        }
        return TraitEncoded(rects.join(), trait.name);
    }

    /** @dev Use this function to encode a characteristic, i.e. a list of traits belongings to the same group. Note that
     *       there is no intrinsic difference between a characteristic and a whole collection (all the traits of all the
     *       characteristics) but it's how it's used and expected today so we keep the wording here.
     *       Use this off-chain and push the result using RendererCommon.storeBytes
     *  @param characteristic The list of Trait constituting the characteristic.
     *  @return The encoded characteristic (mainly a bytes memory whose encoding somehow follows solidity memory storage rules.)
     */
    function encodeCharacteristic(Characteristic memory characteristic)
        public
        pure
        returns (CharacteristicEncoded memory)
    {
        bytes[] memory rects = new bytes[](characteristic.traits.length);
        string[] memory names = new string[](characteristic.traits.length);
        uint16[] memory lengths = new uint16[](
            characteristic.traits.length + 1
        );
        uint16 cumSum = 4 +
            2 *
            uint16(characteristic.traits.length % type(uint16).max); // 2 extra bytes for storing start & end for each trait
        for (uint256 i = 0; i < characteristic.traits.length; i++) {
            TraitEncoded memory tmp = encodeTrait(characteristic.traits[i]);
            rects[i] = tmp.rects;
            names[i] = tmp.name;
            lengths[i] = cumSum;
            cumSum += uint16(rects[i].length % type(uint16).max);
        }
        lengths[characteristic.traits.length] = cumSum;
        return (
            CharacteristicEncoded(
                bytes.concat(
                    bytes2(
                        uint16(
                            (characteristic.traits.length + 1) %
                                type(uint16).max
                        )
                    ),
                    lengths.join(),
                    rects.join()
                ),
                names,
                characteristic.name
            )
        );
    }

    function encodeCollection(Collection memory collection)
        public
        pure
        returns (CollectionEncoded memory)
    {
        bytes[] memory traits = new bytes[](collection.characteristics.length);
        string[] memory characteristicsNames = new string[](
            collection.characteristics.length
        );
        string[][] memory traitsNames = new string[][](
            collection.characteristics.length
        );
        uint16[] memory lengths = new uint16[](
            collection.characteristics.length
        );
        // init characteristic pointer shift with 2 bytes for length + 2 bytes per characteristic
        uint16 cumSum = 2 +
            2 *
            uint16(collection.characteristics.length % type(uint16).max);
        for (uint256 i = 0; i < collection.characteristics.length; i++) {
            CharacteristicEncoded memory tmp = encodeCharacteristic(
                collection.characteristics[i]
            );
            lengths[i] = cumSum;
            traits[i] = tmp.traits;
            traitsNames[i] = tmp.names;
            characteristicsNames[i] = tmp.name;
            cumSum += uint16(traits[i].length % type(uint16).max);
        }
        return (
            CollectionEncoded(
                bytes.concat(
                    bytes2(
                        uint16(
                            collection.characteristics.length % type(uint16).max
                        )
                    ),
                    lengths.join(),
                    traits.join()
                ),
                traitsNames,
                characteristicsNames,
                collection.description
            )
        );
    }

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
            rects[i] = decodeBytes4ToRect(rectsBytes.toBytes4(i * 4), palette);
        }
        return rects.join();
    }
}
