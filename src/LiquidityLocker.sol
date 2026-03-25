// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiquidityLocker
 * @dev Simple contract to lock LP tokens (or any ERC20) for a specific period of time.
 * Built for transparency and trust in the BASE ecosystem.
 */
contract LiquidityLocker is Ownable {
    using SafeERC20 for IERC20;

    struct Lock {
        address token;
        uint256 amount;
        uint256 unlockTime;
        address owner;
        bool claimed;
    }

    mapping(uint256 => Lock) public locks;
    uint256 public lockCount;

    event Locked(uint256 indexed id, address indexed token, uint256 amount, uint256 unlockTime, address owner);
    event Unlocked(uint256 indexed id, address indexed owner, uint256 amount);
    event LockOwnershipTransferred(uint256 indexed id, address indexed previousOwner, address indexed newOwner);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Locks tokens for a specific period.
     * @param _token Address of the ERC20 (LP) token
     * @param _amount Amount to lock
     * @param _unlockTime Timestamp when tokens can be unlocked
     * @return id The ID of the lock
     */
    function lock(address _token, uint256 _amount, uint256 _unlockTime) external returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 id = lockCount++;
        locks[id] = Lock({
            token: _token,
            amount: _amount,
            unlockTime: _unlockTime,
            owner: msg.sender,
            claimed: false
        });

        emit Locked(id, _token, _amount, _unlockTime, msg.sender);
        return id;
    }

    /**
     * @dev Unlocks tokens after the lock period has expired.
     * @param _id The ID of the lock to claim
     */
    function unlock(uint256 _id) external {
        Lock storage lockInfo = locks[_id];
        require(msg.sender == lockInfo.owner, "Not the owner of the lock");
        require(block.timestamp >= lockInfo.unlockTime, "Tokens are still locked");
        require(!lockInfo.claimed, "Tokens already claimed");

        lockInfo.claimed = true;
        IERC20(lockInfo.token).safeTransfer(lockInfo.owner, lockInfo.amount);

        emit Unlocked(_id, msg.sender, lockInfo.amount);
    }

    /**
     * @dev Allows the owner of a lock to transfer ownership of the lock.
     * @param _id The ID of the lock
     * @param _newOwner The new owner address
     */
    function transferLockOwnership(uint256 _id, address _newOwner) external {
        Lock storage lockInfo = locks[_id];
        require(msg.sender == lockInfo.owner, "Not the owner of the lock");
        require(_newOwner != address(0), "New owner cannot be zero address");
        
        address oldOwner = lockInfo.owner;
        lockInfo.owner = _newOwner;

        emit LockOwnershipTransferred(_id, oldOwner, _newOwner);
    }

    /**
     * @dev Returns all locks for a specific user. (Simplified for contract logic, 
     * usually handled via events in the frontend).
     */
    function getLock(uint256 _id) external view returns (address, uint256, uint256, address, bool) {
        Lock memory l = locks[_id];
        return (l.token, l.amount, l.unlockTime, l.owner, l.claimed);
    }
}
