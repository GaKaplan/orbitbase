// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {TokenTemplate} from "../src/TokenTemplate.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {MemecoinTemplate} from "../src/MemecoinTemplate.sol";
import {LiquidityLocker} from "../src/LiquidityLocker.sol";
 
contract DeployScript is Script {
  function run() external {
        // Use PRIVATE_KEY from environment or fallback to Anvil for local
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
 
        // Deploy Templates
        TokenTemplate standardTemplate = new TokenTemplate();
        MemecoinTemplate memecoinTemplate = new MemecoinTemplate();
        
        // Deploy Factory (Flat fee 0.01 ETH)
        TokenFactory factory = new TokenFactory(
            address(standardTemplate),
            address(memecoinTemplate),
            0.01 ether,
            deployer
        );

        // Deploy Locker
        LiquidityLocker locker = new LiquidityLocker();
 
        vm.stopBroadcast();
        
        console2.log("Standard Template deployed at:", address(standardTemplate));
        console2.log("Memecoin Template deployed at:", address(memecoinTemplate));
        console2.log("Factory deployed at:", address(factory));
        console2.log("Locker deployed at:", address(locker));
    }
}
