// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@0xsequence/sstore2/contracts/SSTORE2.sol";

import {Integers} from "../lib/Integers.sol";
import {Bytes} from "../lib/Bytes.sol";
import {Array} from "../lib/Array.sol";

/**
 * @title PaletteRenderer
 *
 * This library can be used to render a palette encoded image on-chain.
 * Palette encoding means that each pixel does not store the color itself, but rather the index of the
 * color in the palette.
 *
 * The returned images is an url safe encoded image uri.
 *
 * @author Clement Walter <clement0walter@gmail.com>
 */
library PaletteRenderer {
    using Integers for uint256;
    using Integers for uint8;
    using Array for string[];
    using Bytes for bytes;

    string public constant RECT_TAG_START = "%3crect%20x=%27";
    string public constant Y_TAG = "%27%20y=%27";
    string public constant WH_FILL_TAG =
        "%27%20width=%271%27%20height=%271%27%20fill=%27%23";
    string public constant RECT_TAG_END = "%27/%3e";
    string public constant SVG_TAG_START =
        "%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2036%2036%27%20width=%27360px%27%20height=%27360px%27%3e";
    string public constant SVG_TAG_END = "%3c/svg%3e";

    /* @dev This can be used to store both images bytes and palettes bytes. It uses the SSTORE2 lib and returns the
     *      pointer to the storage address to be used, for example, in getImageBytes and getFill.
     * @param bytes The bytes to store.
     * @return The pointer to the storage address.
     */
    function storeBytes(bytes calldata _bytes) external returns (address) {
        return SSTORE2.write(_bytes);
    }

    /** @dev All images have a constant number of pixels and consequently a constant number of bytes.
     *       The function reads the corresponding number of bytes at the given _pointer_ address (written with SSTORE2.write).
     *       It is more efficient to concat all the bytes of all the images in one single bytes (<24k) to save on gas
     *       This function eventually helps retrieve one image given its index from the bytes array.
     * @param pointer The pointer returned by the SSTORE2.write function (or storeBytes for instance).
     * @param index The index of the image to retrieve.
     * @param bitsPaletteSize The number of bits used to index the palette, e.g. 3 bits for 2^3 = 8 colors, 8 bits for 2^8 = 256 colors.
     * @param pixelsCount The number of pixels of the image, e.g. 32x32 = 1024 pixels. This function hence reads pixelsCount * bitsPaletteSize / 8 bytes.
     * @return The bytes of the image.
     */
    function getImageBytes(
        address pointer,
        uint256 index,
        uint256 bitsPaletteSize,
        uint256 pixelsCount
    ) public view returns (bytes memory) {
        uint256 start = index > 0
            ? ((index - 1) * bitsPaletteSize * pixelsCount) / 8
            : 0;
        return
            SSTORE2.read(
                pointer,
                start,
                start + (bitsPaletteSize * pixelsCount) / 8
            );
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

    /**
     * @dev Decode one single pixel, i.e. retrieve the color at the given index and produce a <rect> with appropriate parameters.
     *      This is used as a base function for writing rect and is also relevant for cases where the palette uses 8 bits.
     * @param pixelIndex The index of the current pixel in the image flatten array.
     * @param paletteIndex The value of the pixel at the given index, i.e. the index of the color in the palette.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @param palette The array of decoded colors as hex strings.
     * @return A filled <rect> with appropriate parameters as a string.
     */
    function decode1Pixel(
        uint256 pixelIndex,
        uint8 paletteIndex,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                RECT_TAG_START,
                (pixelIndex % imageWidth).toString(),
                Y_TAG,
                (pixelIndex / imageWidth).toString(),
                WH_FILL_TAG,
                palette[paletteIndex],
                RECT_TAG_END
            );
    }

    function decode1Pixel(
        uint256 pixelIndex,
        bytes1 paletteIndex,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            decode1Pixel(pixelIndex, uint8(paletteIndex), palette, imageWidth);
    }

    /** @dev This function can be used as a base decoding function when using 1 bit per pixel. In this case, one byte is
     *       actually eight rects.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _byte The single byte containing 8 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Eight filled <rect> with appropriate parameters as a string.
     */
    function decode1ByteTo8Pixels(
        uint256 startIndex,
        bytes1 _byte,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(startIndex, _byte >> 7, palette, imageWidth),
                decode1Pixel(
                    startIndex + 1,
                    (_byte >> 6) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    (_byte >> 5) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 3,
                    (_byte >> 4) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 4,
                    (_byte >> 3) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 5,
                    (_byte >> 2) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 6,
                    (_byte >> 1) & 0x01,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 7,
                    (_byte >> 0) & 0x01,
                    palette,
                    imageWidth
                )
            );
    }

    /** @dev This function can be used as a base decoding function when using 2 bits per pixel. In this case, one byte is
     *       actually 4 rects.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _byte The single byte containing 4 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Four filled <rect> with appropriate parameters as a string.
     */
    function decode1ByteTo4Pixels(
        uint256 startIndex,
        bytes1 _byte,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(startIndex, _byte >> 6, palette, imageWidth),
                decode1Pixel(
                    startIndex + 1,
                    (_byte >> 4) & 0x03,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    (_byte >> 2) & 0x03,
                    palette,
                    imageWidth
                ),
                decode1Pixel(startIndex + 3, _byte & 0x03, palette, imageWidth)
            );
    }

    /** @dev This function can be used as a base decoding function when using 3 bits per pixel. In this case, one has
     *       indeed 3 * 8 = 24 bits = 8 * 3 = 3 bytes as a minimal bytes array to decode.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _bytes The bytes3 containing 8 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Eight filled <rect> with appropriate parameters as a string.
     */
    function decode3BytesTo8Pixels(
        uint256 startIndex,
        bytes3 _bytes,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(
                    startIndex,
                    uint8(uint24(_bytes >> 21)),
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 1,
                    uint8(uint24(_bytes >> 18)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    uint8(uint24(_bytes >> 15)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 3,
                    uint8(uint24(_bytes >> 12)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 4,
                    uint8(uint24(_bytes >> 9)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 5,
                    uint8(uint24(_bytes >> 6)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 6,
                    uint8(uint24(_bytes >> 3)) & 0x07,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 7,
                    uint8(uint24(_bytes >> 0)) & 0x07,
                    palette,
                    imageWidth
                )
            );
    }

    /** @dev This function can be used as a base decoding function when using 4 bits per pixel. In this case, one byte is
     *       actually 2 rects.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _byte The single byte containing 2 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Two filled <rect> with appropriate parameters as a string.
     */
    function decode1ByteTo2Pixels(
        uint256 startIndex,
        bytes1 _byte,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(startIndex, _byte >> 4, palette, imageWidth),
                decode1Pixel(startIndex + 1, _byte & 0x0f, palette, imageWidth)
            );
    }

    /** @dev This function can be used as a base decoding function when using 5 bits per pixel. In this case, one has
     *       indeed 5 * 8 = 40 bits = 8 * 5 = 5 bytes as a minimal bytes array to decode.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _bytes The bytes5 containing 8 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Eight filled <rect> with appropriate parameters as a string.
     */
    function decode5BytesTo8Pixels(
        uint256 startIndex,
        bytes5 _bytes,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(
                    startIndex,
                    uint8(uint40(_bytes >> 35)),
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 1,
                    uint8(uint40(_bytes >> 30)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    uint8(uint40(_bytes >> 25)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 3,
                    uint8(uint40(_bytes >> 20)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 4,
                    uint8(uint40(_bytes >> 15)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 5,
                    uint8(uint40(_bytes >> 10)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 6,
                    uint8(uint40(_bytes >> 5)) & 0x1f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 7,
                    uint8(uint40(_bytes >> 0)) & 0x1f,
                    palette,
                    imageWidth
                )
            );
    }

    /** @dev This function can be used as a base decoding function when using 5 bits per pixel. In this case, one has
     *       indeed 4 * 6 = 24 bits = 8 * 3 = 3 bytes as a minimal bytes array to decode.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _bytes The bytes5 containing 4 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Four filled <rect> with appropriate parameters as a string.
     */
    function decode3BytesTo4Pixels(
        uint256 startIndex,
        bytes3 _bytes,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(
                    startIndex,
                    uint8(uint24(_bytes >> 18)),
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 1,
                    uint8(uint24(_bytes >> 12)) & 0x3f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    uint8(uint24(_bytes >> 6)) & 0x3f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 3,
                    uint8(uint24(_bytes >> 0)) & 0x3f,
                    palette,
                    imageWidth
                )
            );
    }

    /** @dev This function can be used as a base decoding function when using 5 bits per pixel. In this case, one has
     *       indeed 7 * 8 = 56 bits = 8 * 7 = 7 bytes as a minimal bytes array to decode.
     * @param startIndex The index of the current pixel in the image flatten array.
     * @param _bytes The bytes7 containing 8 palette indexes.
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @return Eight filled <rect> with appropriate parameters as a string.
     */
    function decode7BytesTo8Pixels(
        uint256 startIndex,
        bytes7 _bytes,
        string[] memory palette,
        uint256 imageWidth
    ) public pure returns (string memory) {
        return
            string.concat(
                decode1Pixel(
                    startIndex,
                    uint8(uint56(_bytes >> 49)),
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 1,
                    uint8(uint56(_bytes >> 42)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 2,
                    uint8(uint56(_bytes >> 35)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 3,
                    uint8(uint56(_bytes >> 28)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 4,
                    uint8(uint56(_bytes >> 21)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 5,
                    uint8(uint56(_bytes >> 14)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 6,
                    uint8(uint56(_bytes >> 7)) & 0x7f,
                    palette,
                    imageWidth
                ),
                decode1Pixel(
                    startIndex + 7,
                    uint8(uint56(_bytes >> 0)) & 0x7f,
                    palette,
                    imageWidth
                )
            );
    }

    /** @dev This function can be used to decode a whole rectangular image
     * @param _image The whole image as a flatten bytes array
     * @param palette The array of decoded colors as hex strings.
     * @param imageWidth Since the image array is flatten, we use the imageWidth to retrieve the x and y coordinates of the rect.
     * @param bitsPerPixel the number of bits used to encode a pixel.
     * @return The image part of the final svg image. To be concatenated with SVG_TAG_START and SVG_TAG_END, and
     *         eventually some <style> tags.
     */
    function decodeImage(
        bytes memory _image,
        string[] memory palette,
        uint256 imageWidth,
        uint256 bitsPerPixel
    ) public pure returns (string memory) {
        string[] memory image;
        if (bitsPerPixel == 1) {
            image = new string[](_image.length);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode1ByteTo8Pixels(
                    i * 8,
                    _image[i],
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 2) {
            image = new string[](_image.length);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode1ByteTo4Pixels(
                    i * 4,
                    _image[i],
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 3) {
            image = new string[]((_image.length * 8) / bitsPerPixel);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode3BytesTo8Pixels(
                    i * 8,
                    bytes3(_image.toUint24(i * bitsPerPixel)),
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 4) {
            image = new string[](_image.length);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode1ByteTo2Pixels(
                    i * 2,
                    _image[i],
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 5) {
            image = new string[]((_image.length * 8) / bitsPerPixel);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode5BytesTo8Pixels(
                    i * 8,
                    bytes5(_image.toUint40(i * bitsPerPixel)),
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 6) {
            image = new string[]((_image.length * 8) / bitsPerPixel);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode3BytesTo4Pixels(
                    i * 4,
                    bytes3(_image.toUint24(i * bitsPerPixel)),
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 7) {
            image = new string[]((_image.length * 8) / bitsPerPixel);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode7BytesTo8Pixels(
                    i * 8,
                    bytes7(_image.toUint56(i * bitsPerPixel)),
                    palette,
                    imageWidth
                );
            }
        } else if (bitsPerPixel == 8) {
            image = new string[](_image.length);
            for (uint256 i = 0; i < image.length; i++) {
                image[i] = decode1Pixel(i, _image[i], palette, imageWidth);
            }
        }
        return image.join();
    }
}
