// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TokenTemplate} from "./TokenTemplate.sol";

/**
 * @title TokenFactory
 * @dev Factory for creating minimal proxies of TokenTemplate using EIP-1167.
 */
contract TokenFactory is Ownable {
    address public immutable standardTemplate;
    address public immutable memecoinTemplate;
    uint256 public flatFee;
    address public feeRecipient;

    enum TemplateType { STANDARD, MEMECOIN }

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        TemplateType templateType,
        uint256 fee
    );
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);

    constructor(
        address _standardTemplate, 
        address _memecoinTemplate,
        uint256 _flatFee, 
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_standardTemplate != address(0), "Standard template cannot be zero");
        require(_memecoinTemplate != address(0), "Memecoin template cannot be zero");
        require(_feeRecipient != address(0), "Fee recipient cannot be zero address");
        standardTemplate = _standardTemplate;
        memecoinTemplate = _memecoinTemplate;
        flatFee = _flatFee;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Creates a new token using the minimal proxy pattern (Clones).
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param initialSupply Initial supply of the token (base units)
     * @param templateType 0 for STANDARD, 1 for MEMECOIN
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 initialSupply,
        TemplateType templateType
    ) external payable returns (address) {
        require(msg.value >= flatFee, "Insufficient fee");

        address template = templateType == TemplateType.STANDARD ? standardTemplate : memecoinTemplate;
        
        // Use Clones to deploy a minimal proxy (EIP-1167)
        address clone = Clones.clone(template);

        // Initialize the proxy (both templates share the same initialize signature)
        TokenTemplate(clone).initialize(name, symbol, initialSupply, msg.sender);

        // Send fee to recipient
        if (msg.value > 0) {
            (bool success, ) = payable(feeRecipient).call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }

        emit TokenCreated(clone, msg.sender, name, symbol, initialSupply, templateType, msg.value);
        return clone;
    }

    function setFlatFee(uint256 _newFee) external onlyOwner {
        flatFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }

    // Function to recover accidentally sent ETH to the factory
    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
