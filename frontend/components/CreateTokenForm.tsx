'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';
const FACTORY_ABI = [
  {
    "type": "function",
    "name": "createToken",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "symbol", "type": "string" },
      { "name": "initialSupply", "type": "uint256" },
      { "name": "templateType", "type": "uint8" }
    ],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "payable"
  }
] as const;

export function CreateTokenForm() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000');
  const [isMemecoin, setIsMemecoin] = useState(true);
  const [mounted, setMounted] = useState(false);

  // All hooks must be called here
  const { isConnected } = useAccount();
  const { data: flatFeeData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: [{ "type": "function", "name": "flatFee", "inputs": [], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" }],
    functionName: 'flatFee',
  });

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = 
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Early return after all hooks
  if (!mounted) return null;

  // Logic using hooks data
  const tokenAddress = receipt?.logs?.[0]?.address || '0x...';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
        alert('Por favor, conecta tu wallet');
        return;
    }

    try {
        writeContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: 'createToken',
          args: [
            name, 
            symbol, 
            BigInt(supply) * BigInt(10**18),
            isMemecoin ? 1 : 0 // 1 for MEMECOIN, 0 for STANDARD
          ],
          value: flatFeeData ? (flatFeeData as bigint) : parseEther('0.01'), 
        });
    } catch (err) {
        console.error("Error submitting transaction:", err);
    }
  };

  return (
    <div className="glass-card p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="text-[var(--primary)]">🚀</span> Lanzar Nuevo Proyecto
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setIsMemecoin(true)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              isMemecoin 
                ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Memecoin (Fijo)
          </button>
          <button
            type="button"
            onClick={() => setIsMemecoin(false)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              !isMemecoin 
                ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Token Estándar
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Nombre del Proyecto</label>
          <input
            type="text"
            placeholder="Ej: Base Moon Rocket"
            className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Símbolo</label>
            <input
              type="text"
              placeholder="MOON"
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Suministro Inicial</label>
            <input
              type="number"
              className="w-full bg-black/5 dark:bg-white/5 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="1000000"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming || !isConnected}
          className="btn-primary w-full"
        >
          {!isConnected 
            ? 'Conectar Wallet para continuar' 
            : isPending 
              ? 'Confirmando en Wallet...' 
              : isConfirming 
                ? 'Minando transacción...' 
                : `Crear ${isMemecoin ? 'Memecoin' : 'Token'} (${flatFeeData ? formatEther(flatFeeData as bigint) : '0.01'} ETH)`}
        </button>
      </form>

      {isConfirmed && (
        <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-400 text-base">¡Token Desplegado!</h3>
              <p className="text-emerald-700/70 dark:text-emerald-400/60 text-xs">Tu contrato está vivo en la red local.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="group relative">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-600/50 dark:text-emerald-400/40 mb-1 ml-1">Dirección del Contrato</label>
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl transition-all hover:border-emerald-500/50">
                <code className="flex-1 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 truncate">
                  {tokenAddress}
                </code>
                <button 
                  onClick={() => navigator.clipboard.writeText(tokenAddress)}
                  className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-md transition-colors text-emerald-600"
                  title="Copiar dirección"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-100 dark:border-emerald-500/10 flex justify-between items-center text-[10px]">
              <span className="text-emerald-600/60 dark:text-emerald-400/40 font-medium">Hash de Transacción</span>
              <a 
                href={`#`} 
                className="font-mono text-emerald-700 dark:text-emerald-400/80 hover:underline truncate max-w-[120px]"
              >
                {hash?.slice(0, 10)}...{hash?.slice(-8)}
              </a>
            </div>
          </div>
          
          <p className="mt-4 text-[9px] text-center text-emerald-600/40 dark:text-emerald-400/30 italic">
            * Importa esta dirección en MetaMask para interactuar con tu token.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
          <span className="font-bold">Error: </span>
          {error.message.includes('User rejected') 
            ? 'Transacción cancelada por el usuario.' 
            : 'Fondos insuficientes o error de red.'}
        </div>
      )}
    </div>
  );
}
