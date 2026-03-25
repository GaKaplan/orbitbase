'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, erc20Abi, Address } from 'viem';

const LOCKER_ADDRESS = process.env.NEXT_PUBLIC_LOCKER_ADDRESS || '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e';

export function LiquidityLockerForm() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [step, setStep] = useState<'initial' | 'approving' | 'approved' | 'locking' | 'locked'>('initial');
  const [mounted, setMounted] = useState(false);

  // All hooks must be called here
  const { isConnected } = useAccount();

  const { writeContract: approveWrite, data: approveHash, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = 
    useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: lockWrite, data: lockHash, error: lockError } = useWriteContract();
  const { isLoading: isLockConfirming, isSuccess: isLockConfirmed } = 
    useWaitForTransactionReceipt({ hash: lockHash });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Early return after all hooks
  if (!mounted) return null;

  // Logic using hooks data
  if (isApproveConfirmed && step === 'approving') setStep('approved');
  if (isLockConfirmed && step === 'locking') setStep('locked');

  const handleApprove = async () => {
    if (!tokenAddress || !amount) return;
    setStep('approving');
    approveWrite({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [LOCKER_ADDRESS, parseEther(amount)],
    });
  };

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress || !amount || !unlockDate) return;

    setStep('locking');
    const unlockTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
    const amountWei = parseEther(amount);

    lockWrite({
      address: LOCKER_ADDRESS,
      abi: [
        {
          "inputs": [
            { "name": "_token", "type": "address" },
            { "name": "_amount", "type": "uint256" },
            { "name": "_unlockTime", "type": "uint256" }
          ],
          "name": "lock",
          "outputs": [{ "name": "", "type": "uint256" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      functionName: 'lock',
      args: [tokenAddress as Address, amountWei, BigInt(unlockTimestamp)],
    });
  };

  return (
    <div className="glass-card p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-amber-500">🔒</span> Liquidity Locker
      </h2>
      
      <form onSubmit={handleLock} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Dirección del Token (LP)</label>
          <input
            type="text"
            placeholder="0x..."
            className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            disabled={step === 'locked' || step === 'locking'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Cantidad</label>
            <input
              type="number"
              placeholder="1000"
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={step === 'locking' || step === 'locked'}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Fecha de Desbloqueo</label>
            <input
              type="datetime-local"
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-3 text-[11px] focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              disabled={step === 'locking' || step === 'locked'}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {step === 'initial' || step === 'approving' ? (
            <button
              type="button"
              onClick={handleApprove}
               className="btn-primary w-full"
            >
              {step === 'approving' ? 'Confirmando aprobación...' : 'Paso 1: Aprobar Tokens'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isConnected || step === 'locking' || step === 'locked'}
              className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all ${
                step === 'locked' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
              }`}
            >
              {step === 'locking' ? 'Bloqueando...' : step === 'locked' ? '✅ Tokens Bloqueados' : 'Paso 2: Bloquear Tokens'}
            </button>
          )}
        </div>
      </form>

      {step === 'approved' && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 text-xs text-center">
            ✨ Aprobación exitosa. ¡Ahora puedes bloquear tus tokens!
        </div>
      )}

      {step === 'locked' && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm">
           ✅ Operación completada. Tokens bloqueados hasta el {new Date(unlockDate).toLocaleString()}
        </div>
      )}

      {(approveError || lockError) && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-[11px]">
          Hubo un error en la transacción. Revisa MetaMask.
        </div>
      )}
    </div>
  );
}
