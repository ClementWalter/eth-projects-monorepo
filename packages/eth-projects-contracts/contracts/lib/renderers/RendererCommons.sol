// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../utils/Integers.sol";
import {Array} from "../utils/Array.sol";

struct Attribute {
    string trait_type;
    string value;
}

struct TokenData {
    string image;
    string description;
    string name;
    Attribute[] attributes;
}

/**  @title BaseRenderer
 *
 *   This library contains shared functionality and constants for the renderers.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
library RendererCommons {
    using Integers for uint256;
    using Integers for uint8;
    using Array for string[];

    string public constant DATA_URI = "data:image/svg+xml,";
    string public constant XMLNS_HEADER =
        "xmlns=%27http://www.w3.org/2000/svg%27";
    string public constant SPACE = "%20";
    string public constant QUOTE = "%27";
    string public constant NUMBER_SIGN = "%23";
    string public constant TAG_START = "%3c";
    string public constant TAG_END = "/%3e";

    event BytesStored(address pointer);

    /**
     * @dev Usually colors are already defined in hex color space so we just concat all the colors. No check is made
     *      and this function only concatenates the input colors.
     * @param palette The list of colors as hex strings, without the leading #.
     * @return The concatenated colors as string. To be used as bytes afterwards.
     */
    function encodePalette(string[] memory palette)
        public
        pure
        returns (string memory)
    {
        return string.concat("0x", palette.join());
    }

    /** @dev Returns one single color reading directly from the storage.
     * @param pointer The pointer to the palette bytes array where each color is R, G, B at storage i, i+1, i+2.
     * @param index The index of the color to retrieve
     * @return The hexstring representation of the color, e.g. "a3120f".
     */
    function getFill(address pointer, uint256 index)
        public
        view
        returns (string memory)
    {
        bytes memory palette = SSTORE2.read(pointer, 3 * index, 3 * index + 3);

        return
            string.concat(
                uint8(palette[0]).toString(16, 2),
                uint8(palette[1]).toString(16, 2),
                uint8(palette[2]).toString(16, 2)
            );
    }

    /** @dev Returns one single color from a pre-loaded whole palette as a bytes array.
     * @param palette A bytes array encoding several RGB colors. Length should be a multiple of 3.
     * @param index The index of the color to retrieve
     * @return The hexstring representation of the color, e.g. "a3120f".
     */
    function getFill(bytes memory palette, uint256 index)
        public
        pure
        returns (string memory)
    {
        return
            string.concat(
                uint8(palette[3 * index]).toString(16, 2),
                uint8(palette[3 * index + 1]).toString(16, 2),
                uint8(palette[3 * index + 2]).toString(16, 2)
            );
    }

    /** @dev Decode the whole palette once for all and returns an array of hexstrings.
     * @param pointer The pointer to the palette bytes array where each color is at storage at i, i+1, i+2.
     * @return An array of hexstring representation of the color, e.g. "a3120f".
     */
    function getPalette(address pointer) public view returns (string[] memory) {
        bytes memory palette = SSTORE2.read(pointer);
        return getPalette(palette);
    }

    function getPalette(bytes memory palette)
        public
        pure
        returns (string[] memory)
    {
        uint256 paletteSize = palette.length / 3;
        string[] memory paletteHex = new string[](paletteSize);
        for (uint256 i = 0; i < paletteSize; i++) {
            paletteHex[i] = getFill(palette, i);
        }
        return paletteHex;
    }

    /** @dev Retrieve the names encoded with the collection: description, characteristics and traits names array.
     * @param names The bytes the names encoded by the RectEncoder.
     */
    function decodeNames(bytes memory names)
        public
        pure
        returns (
            string memory description,
            string[] memory characteristicNames,
            string[][] memory traitNames
        )
    {
        return abi.decode(names, (string, string[], string[][]));
    }

    /** @dev Retrieve the names encoded with the collection: description, characteristics and traits names array.
     * @param pointer The address of the SSTORE2 contract for the names.
     */
    function decodeNames(address pointer)
        public
        view
        returns (
            string memory description,
            string[] memory characteristicNames,
            string[][] memory traitNames
        )
    {
        return decodeNames(SSTORE2.read(pointer));
    }


    /** @dev This is just a direct call to abi.encode to insure standard encoding scheme for the names across renders.
     * @param description The description of the collection.
     * @param characteristicNames The names of the characteristics.
     * @param traitNames The names of the traits.
     * @return The encoded bytes.
     */
    function encodeNames(string memory description, string[] memory characteristicNames, string[][] memory traitNames)
        public
        pure
        returns (bytes memory)
    {
        return abi.encode(
            description, characteristicNames, traitNames
        );
    }

    function tokenData(address pointer, uint256[] memory items)
        public
        view
        returns (TokenData memory)
    {
        (
            string memory description,
            string[] memory characteristicNames,
            string[][] memory traitNames
        ) = decodeNames(SSTORE2.read(pointer));
        Attribute[] memory attributes = new Attribute[](items.length);
        for (uint256 i = 0; i < items.length; i++) {
            attributes[i] = Attribute(
                characteristicNames[i],
                traitNames[i][items[i]]
            );
        }
        return TokenData("", description, "", attributes);
    }

    function tokenURI(address pointer, uint256[] memory items) public view returns (string memory) {
        TokenData memory _tokenData = tokenData(pointer, items);
        string[] memory attributes = new string[](_tokenData.attributes.length);
        for (uint256 i = 0; i < _tokenData.attributes.length; i++) {
            attributes[i] = string.concat(
                '{"trait_type": "',
                _tokenData.attributes[i].trait_type,
                '", "value": "',
                _tokenData.attributes[i].value,
                '"}'
            );
        }
        return
            string.concat(
                "data:application/json,",
                '{"image": "',
                _tokenData.image,
                '"',
                ',"description": "',
                _tokenData.description,
                '"',
                ',"name": "',
                _tokenData.name,
                '"',
                ',"attributes": ',
                "[",
                attributes.join(","),
                "]",
                "}"
            );
    }
}
