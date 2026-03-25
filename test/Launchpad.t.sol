// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {TokenTemplate} from "../src/TokenTemplate.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {LiquidityLocker} from "../src/LiquidityLocker.sol";

contract LaunchpadTest is Test {
    TokenTemplate public template;
    TokenFactory public factory;
    LiquidityLocker public locker;

    address public admin = address(0x111);
    address public user = address(0x222);
    address public feeRecipient = address(0x333);
    uint256 public constant FLAT_FEE = 0.01 ether;

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy template
        template = new TokenTemplate();
        
        // Deploy factory
        factory = new TokenFactory(address(template), FLAT_FEE, feeRecipient);
        
        // Deploy locker
        locker = new LiquidityLocker();
        
        vm.stopPrank();
    }

    function test_CreateToken() public {
        vm.startPrank(user);
        vm.deal(user, 1 ether);

        string memory name = "Test Token";
        string memory symbol = "TT";
        uint256 supply = 1_000_000 * 10**18;

        // Create token via factory
        address tokenAddress = factory.createToken{value: FLAT_FEE}(name, symbol, supply);
        
        TokenTemplate token = TokenTemplate(tokenAddress);

        // Verify state
        assertEq(token.name(), name);
        assertEq(token.symbol(), symbol);
        assertEq(token.totalSupply(), supply);
        assertEq(token.balanceOf(user), supply);
        assertEq(token.owner(), user);

        // Verify fee transfer
        assertEq(feeRecipient.balance, FLAT_FEE);

        vm.stopPrank();
    }

    function test_Fail_CreateToken_InsufficientFee() public {
        vm.startPrank(user);
        vm.deal(user, 1 ether);

        vm.expectRevert("Insufficient fee");
        factory.createToken{value: 0.005 ether}("Fail", "FAIL", 100);

        vm.stopPrank();
    }

    function test_Locker_LockAndUnlock() public {
        // First create a token
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        address tokenAddress = factory.createToken{value: FLAT_FEE}("LP Token", "LP", 1000);
        TokenTemplate token = TokenTemplate(tokenAddress);

        // Approve and Lock
        uint256 lockAmount = 500;
        uint256 unlockTime = block.timestamp + 30 days;
        
        token.approve(address(locker), lockAmount);
        uint256 lockId = locker.lock(tokenAddress, lockAmount, unlockTime);

        // Verify lock state
        (address _token, uint256 _amount, uint256 _unlockTime, address _owner, bool _claimed) = locker.locks(lockId);
        assertEq(_token, tokenAddress);
        assertEq(_amount, lockAmount);
        assertEq(_unlockTime, unlockTime);
        assertEq(_owner, user);
        assertFalse(_claimed);

        // Try to unlock early - should fail
        vm.expectRevert("Tokens are still locked");
        locker.unlock(lockId);

        // Advance time
        vm.warp(unlockTime + 1);

        // Unlock
        locker.unlock(lockId);
        
        // Verify balance and claimed status
        assertEq(token.balanceOf(user), 1000); // 500 original + 500 unlocked
        (,,,,bool claimed) = locker.locks(lockId);
        assertTrue(claimed);

        vm.stopPrank();
    }

    function test_Locker_TransferOwnership() public {
        vm.startPrank(user);
        vm.deal(user, 1 ether);
        address tokenAddress = factory.createToken{value: FLAT_FEE}("LP Token", "LP", 1000);
        TokenTemplate token = TokenTemplate(tokenAddress);

        token.approve(address(locker), 500);
        uint256 lockId = locker.lock(tokenAddress, 500, block.timestamp + 10 days);

        address newOwner = address(0x999);
        locker.transferLockOwnership(lockId, newOwner);

        (,,,address owner,) = locker.locks(lockId);
        assertEq(owner, newOwner);

        vm.stopPrank();
    }
}
