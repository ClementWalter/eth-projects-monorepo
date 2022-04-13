// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../utils/Integers.sol";

/**  @title BaseRenderer
 *
 *   This library contains shared functionality and constants for the renderers.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
library RendererCommons {
    using Integers for uint256;
    using Integers for uint8;

    string public constant DATA_URI = "data:image/svg+xml,";
    string public constant XMLNS_HEADER =
        "xmlns=%27http://www.w3.org/2000/svg%27";
    string public constant SPACE = "%20";
    string public constant QUOTE = "%27";
    string public constant NUMBER_SIGN = "%23";
    string public constant TAG_START = "%3c";
    string public constant TAG_END = "/%3e";

    /* @dev This can be used to store both images bytes and palettes bytes. It uses the SSTORE2 lib and returns the
     *      pointer to the storage address to be used, for example, in getImageBytes and getFill.
     * @param bytes The bytes to store.
     * @return The pointer to the storage address.
     */
    function storeBytes(bytes calldata _bytes) external returns (address) {
        return SSTORE2.write(_bytes);
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
        bytes memory palette = SSTORE2.read(pointer, index, index + 3);
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
}
