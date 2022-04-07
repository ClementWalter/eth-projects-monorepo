// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC721B} from "./ERC721B.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Bytes} from "../lib/Bytes.sol";

/**
 * @title ERC-721 Non-Fungible Token optimized for batch minting with enumerable interface
 * @notice a bytes2 (uint16) is used to store the token id so the collection should be lower than 2^16 = 65536 items
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 *      Based on the study for writing indexes and addresses, we use a single mapping for storing all the data
 *      We use the uint16 / bytes2 tokenId
 */
contract ERC721BEnumerable is ERC721B, IERC721Enumerable {
    using Bytes for bytes;

    function totalSupply() external view override returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < owners.length; i += 20) {
            total += _balanceOf(i);
        }
        return total;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        override
        returns (uint256 tokenId)
    {
        require(
            index * 2 < _tokensByOwner[owner].length,
            "ERC721Enumerable: index out of range"
        );
        return _tokensByOwner[owner].toUint16(index * 2);
    }

    function tokenByIndex(uint256 index)
        external
        view
        override
        returns (uint256)
    {
        uint256 ownerIndex = 0;
        uint256 count;
        while (count <= index) {
            count += _balanceOf(ownerIndex);
            ownerIndex += 20;
        }
        ownerIndex -= 20;
        count -= _balanceOf(ownerIndex);
        return
            _tokensByOwner[owners.toAddress(ownerIndex)].toUint16(
                (index - count) * 2
            );
    }

    constructor(string memory name_, string memory symbol_)
        ERC721B(name_, symbol_)
    {}

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165, ERC721B)
        returns (bool)
    {
        return
            interfaceId == type(IERC721Enumerable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
