'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract, useSignMessage } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ConnectKitButton } from 'connectkit';
import { WalletEmailCapture } from './WalletEmailCapture';
import { translations, Language } from '@/lib/translations';
import { safeBigInt } from '@/lib/web3-utils';

const POOL_ABI = [
  { "type": "function", "name": "contribute", "inputs": [{ "name": "_amount", "type": "uint256" }], "stateMutability": "payable" },
  { "type": "function", "name": "claimTokens", "inputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "refund", "inputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "totalRaised", "inputs": [], "outputs": [{ "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "rate", "inputs": [], "outputs": [{ "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "finalized", "inputs": [], "outputs": [{ "type": "bool" }], "stateMutability": "view" },
  { "type": "function", "name": "forcedFailed", "inputs": [], "outputs": [{ "type": "bool" }], "stateMutability": "view" },
  { "type": "function", "name": "softCap", "inputs": [], "outputs": [{ "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "hardCap", "inputs": [], "outputs": [{ "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "paymentToken", "inputs": [], "outputs": [{ "type": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "type": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "endTime", "inputs": [], "outputs": [{ "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "finalize", "inputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "cancelPool", "inputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "contributions", "inputs": [{ "name": "", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "token", "inputs": [], "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "tokensClaimed", "inputs": [{ "name": "", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" }
] as const;

const ERC20_ABI = [
  { "type": "function", "name": "approve", "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [{ "name": "", "type": "bool" }], "stateMutability": "nonpayable" },
  { "type": "function", "name": "allowance", "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "decimals", "inputs": [], "outputs": [{ "name": "", "type": "uint8" }], "stateMutability": "view" },
  { "type": "function", "name": "balanceOf", "inputs": [{ "name": "account", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" },
  { "type": "function", "name": "transfer", "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [{ "name": "success", "type": "bool" }], "stateMutability": "nonpayable" },
  { "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view" },
  { "type": "function", "name": "mint", "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "symbol", "inputs": [], "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view" }
] as const;

interface PresaleDetailProps {
  poolAddress: string;
  isETH: boolean;
  metadata?: any;
  onBack?: () => void;
  lang: Language;
}



export function PresaleDetail({ poolAddress, isETH, metadata, onBack, lang }: PresaleDetailProps) {
  const t = translations[lang]?.forms?.presaleDetail || translations['es'].forms.presaleDetail;
  const commonT = translations[lang]?.activity || translations['es'].activity;
  const [amount, setAmount] = useState('1');
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState('');
  const { address } = useAccount();

  const { data: payTokenAddr } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'paymentToken' });
  const { data: raised, refetch: refetchRaised } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'totalRaised' });
  const { data: isFin, refetch: refetchIsFin } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'finalized' });
  const { data: isForcedFailed, refetch: refetchIsForced } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'forcedFailed' });
  const { data: sCap } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'softCap' });
  const { data: hCap } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'hardCap' });
  const { data: poolOwner } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'owner' });
  const { data: endTime } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'endTime' });
  const { data: userContribution } = useReadContract({ 
    address: poolAddress as `0x${string}`, 
    abi: POOL_ABI, 
    functionName: 'contributions', 
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  const { data: projTokenAddr } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'token' });
  const { data: poolRate } = useReadContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'rate' });
  const { data: userClaimed, refetch: refetchUserClaimed } = useReadContract({ 
    address: poolAddress as `0x${string}`, 
    abi: POOL_ABI, 
    functionName: 'tokensClaimed',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  const { data: poolTokenBalance, refetch: refetchPoolTokenBalance } = useReadContract({ 
    address: projTokenAddr as `0x${string}`, 
    abi: ERC20_ABI, 
    functionName: 'balanceOf', 
    args: [poolAddress as `0x${string}`],
    query: { enabled: !!projTokenAddr }
  });
  const { data: projDecs } = useReadContract({ 
    address: projTokenAddr as `0x${string}`, 
    abi: ERC20_ABI, 
    functionName: 'decimals', 
    query: { enabled: !!projTokenAddr }
  });
  const { data: projSymbol } = useReadContract({ 
    address: projTokenAddr as `0x${string}`, 
    abi: ERC20_ABI, 
    functionName: 'symbol', 
    query: { enabled: !!projTokenAddr }
  });
  const { data: projTokenContractOwner } = useReadContract({ 
    address: projTokenAddr as `0x${string}`, 
    abi: ERC20_ABI, 
    functionName: 'owner', 
    query: { enabled: !!projTokenAddr }
  });
  const isTokenOwner = address && projTokenContractOwner && (projTokenContractOwner as string).toLowerCase() === address.toLowerCase();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [tokenLocks, setTokenLocks] = useState<any[]>([]);
  const [isLocksLoading, setIsLocksLoading] = useState(false);

  useEffect(() => {
    if (!projTokenAddr) return;
    const fetchLocks = async () => {
      try {
        setIsLocksLoading(true);
        const res = await fetch('/api/movimientos');
        const json = await res.json();
        if (json.success && json.events) {
          // Filtrar bloqueos creados para este token
          const locks = json.events.filter((ev: any) => 
            (ev.type === 'LOCK_CREATED' || ev.type === 'TOKEN_LOCKED') && 
            ((ev.data?.token?.toLowerCase() === (projTokenAddr as string).toLowerCase()) || 
             (ev.data?.tokenAddress?.toLowerCase() === (projTokenAddr as string).toLowerCase()))
          );
          setTokenLocks(locks);
        }
      } catch (err) {
        console.error("[PresaleDetail] Error fetching token locks:", err);
      } finally {
        setIsLocksLoading(false);
      }
    };
    fetchLocks();
  }, [projTokenAddr]);

  const [emailTrigger, setEmailTrigger] = useState(false);

  useEffect(() => {
    if (isSuccess && hash && receipt) {
      refetchRaised();
      refetchIsFin();
      refetchIsForced();
      
      fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash,
          blockNumber: Number(receipt.blockNumber),
          type: 'CONTRIBUTED',
          creator: address,
          address: poolAddress,
          timestamp: Math.floor(Date.now() / 1000),
          data: { 
            amount: pAmt.toString(), // Guardamos el valor en unidades RAW (Wei)
            isETH,
            name: metadata?.description || `Pool ${poolAddress.substring(0, 6)}`,
            symbol: isETH ? 'ETH' : (metadata?.symbol || 'TOK'),
            decimals: tDecs
          }
        })
      }).catch(err => console.error("[PresaleDetail] Error logging contribution:", err));
      setEmailTrigger(true); // Disparar captura de email post-contribución
    }
    if (isSuccess || (hash && !isConfirming && !isPending)) {
      setIsLocalLoading(false);
      setShowCancelModal(false);
      // Refrescar todos los balances vitales
      refetchIsFin?.();
      refetchRaised?.();
      refetchIsForced?.();
      refetchPoolTokenBalance?.();
      refetchUserClaimed?.();
    }
  }, [isSuccess, hash, address, poolAddress, amount, isETH, refetchIsFin, refetchRaised, refetchIsForced, refetchPoolTokenBalance, refetchUserClaimed, isConfirming, isPending]);

  const isOwner = !!(address && poolOwner && String(poolOwner).toLowerCase() === address.toLowerCase());
  const expired = endTime ? (Date.now() / 1000) > Number(endTime as any) : false;
  const erc20 = !isETH && payTokenAddr && payTokenAddr !== '0x0000000000000000000000000000000000000000';
  const { data: decimals } = useReadContract({ address: payTokenAddr as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals', query: { enabled: !!erc20 } });
  const { data: allowance } = useReadContract({ address: payTokenAddr as `0x${string}`, abi: ERC20_ABI, functionName: 'allowance', args: address && poolAddress ? [address, poolAddress as `0x${string}`] : undefined, query: { enabled: !!(erc20 && address) } });

  const tDecs = isETH ? 18 : (Number(decimals as any) || 18);
  const pAmt = parseUnits(amount || '0', tDecs);
  const enough = isETH || (allowance !== undefined && (allowance as any) >= pAmt);

  const hardCapReached = !!(raised && hCap && (safeBigInt(raised) >= safeBigInt(hCap)));
  const isBlocked = !!(isFin) || expired || !!(isForcedFailed) || hardCapReached;

  const handleAction = () => {
    if (!address || isLocalLoading || isBlocked) return;
    setIsLocalLoading(true);
    if (!enough && erc20) {
      writeContract({ address: payTokenAddr as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [poolAddress as `0x${string}`, pAmt] });
    } else {
      writeContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'contribute', args: [isETH ? BigInt(0) : pAmt], value: isETH ? pAmt : undefined });
    }
  };

  const handleClaim = () => { if (!isLocalLoading) { setIsLocalLoading(true); writeContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'claimTokens' }); } };
  const handleRefund = () => { if (!isLocalLoading) { setIsLocalLoading(true); writeContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'refund' }); } };
  const handleFinalize = () => { if (!isLocalLoading) { setIsLocalLoading(true); writeContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'finalize' }); } };

  const handleCancel = () => { 
    if (!isLocalLoading && cancelConfirmText === 'CANCELAR') { 
      setIsLocalLoading(true); 
      writeContract({ address: poolAddress as `0x${string}`, abi: POOL_ABI, functionName: 'cancelPool' }); 
    } 
  };

  const tokensNeeded = (hCap && poolRate) ? (safeBigInt(hCap) * safeBigInt(poolRate)) : BigInt(0);
  const tokensMissing = tokensNeeded > (safeBigInt(poolTokenBalance)) ? tokensNeeded - (safeBigInt(poolTokenBalance)) : BigInt(0);

  const handleFund = () => {
    if (!isLocalLoading && projTokenAddr && tokensMissing > BigInt(0)) {
      setIsLocalLoading(true);
      writeContract({
        address: projTokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [poolAddress as `0x${string}`, tokensMissing]
      });
    }
  };

  const handleEmergencyMint = () => {
    if (!isLocalLoading && projTokenAddr && tokensMissing > BigInt(0) && isTokenOwner) {
      setIsLocalLoading(true);
      writeContract({
        address: projTokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [poolAddress as `0x${string}`, tokensMissing]
      });
    }
  };

  const prgNum = (raised && hCap && safeBigInt(hCap) > BigInt(0)) 
    ? Number((safeBigInt(raised) * BigInt(10000)) / safeBigInt(hCap)) / 100 
    : 0;
  const prg = isNaN(prgNum) ? 0 : Math.min(100, prgNum);
  const readyFin = expired || (raised && hCap && (safeBigInt(raised) >= safeBigInt(hCap)));

  const [timeLeftStr, setTimeLeftStr] = useState("0D 0H 0M");
  useEffect(() => {
    if (!endTime) return;
    const upd = () => {
      const diff = Number(endTime as any) - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeLeftStr("Expirado"); return; }
      const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60);
      setTimeLeftStr(`${d}D ${h}H ${m}M`);
    };
    upd();
    const inv = setInterval(upd, 60000);
    return () => clearInterval(inv);
  }, [endTime]);

  const raisedC = raised ? formatUnits(safeBigInt(raised), tDecs) : '0';
  const hCapC = hCap ? formatUnits(safeBigInt(hCap), tDecs) : '0';

  const hasContribution = !!(userContribution && safeBigInt(userContribution) > BigInt(0));
  const totalPotentialClaim = (userContribution && poolRate) ? (safeBigInt(userContribution) * safeBigInt(poolRate)) : BigInt(0);
  const showClaim = !!(isFin && !isForcedFailed && raised && sCap && (safeBigInt(raised) >= safeBigInt(sCap)) && hasContribution && (userClaimed !== undefined && userClaimed !== null && safeBigInt(userClaimed) < totalPotentialClaim));
  const showRefund = !!(isFin && (isForcedFailed || (raised && sCap && (safeBigInt(raised) < safeBigInt(sCap)))) && hasContribution);

  const investorCount = raised ? Math.max(1, Math.floor(Number(raisedC) / 1.5) + (parseInt(poolAddress.slice(-2), 16) % 15)) : 0;

  const SparkChart = () => (
    <svg className="w-full h-16 opacity-50" viewBox="0 0 100 30" preserveAspectRatio="none">
      <path d={`M 0 30 Q 25 ${30 - prg * 0.2} 50 ${30 - prg * 0.3} T 100 ${30 - prg * 0.35}`} fill="none" stroke="url(#grad)" strokeWidth="1.5" className="animate-pulse"/>
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} /><stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} /></linearGradient></defs>
    </svg>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-700">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{t.backBtn}</span>
        </button>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          <div className="glass-card p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-6">
              {metadata?.logoUrl ? (
                <img src={metadata.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl border border-white/5">🛰️</div>
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{t.title}</span>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                  {metadata?.description || `Pool ${poolAddress.substring(0, 6)}`}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/5">DB ID: {metadata?.id || 'LOCAL'}</span>
              
              {tokenLocks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-in zoom-in duration-500">
                  <span className="text-[10px]">🔐</span>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    {tokenLocks.reduce((acc, lock) => acc + Number(formatUnits(safeBigInt(lock.data?.amount), projDecs || 18)), 0).toLocaleString()} {projSymbol || 'TKN'} {t.secured}
                  </span>
                </div>
              )}

              {isForcedFailed ? (
                <div className="p-1 px-3 bg-red-500/10 border border-red-500/20 rounded-full">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{t.statusClosed}</span>
                </div>
              ) : isFin || expired ? (
                <span className="px-3 py-1 bg-zinc-900 border border-white/10 rounded-lg text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.statusFinished}</span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">{t.statusActive}</span>
              )}
            </div>

            <div className="mt-10 space-y-6">
               <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.raised}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{formatUnits(safeBigInt(raised), tDecs)}</span>
                      <span className="text-sm font-bold text-zinc-500 uppercase">{isETH ? 'ETH' : (metadata?.symbol || 'TOK')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.target}</span>
                     <p className="text-sm font-black text-white">{formatUnits(safeBigInt(hCap), tDecs)} {isETH ? 'ETH' : (metadata?.symbol || 'TOK')}</p>
                  </div>
               </div>

               <div className="relative pt-8 pb-4 px-1">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-amber-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min(100, Number(prg))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.progress}</span>
                    <span className="text-[10px] font-black text-blue-400">{prg.toFixed(1)}%</span>
                  </div>

                  <div className="mt-4 flex justify-between items-center px-1">
                     <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.milestones}</span>
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">
                       {isForcedFailed ? t.projectCancelled : `${t.timeLeft} ${timeLeftStr}`}
                     </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.softCap}</span>
                    <span className="text-[10px] font-black text-white">{formatUnits(safeBigInt(sCap), tDecs)} {isETH ? 'ETH' : (metadata?.symbol || 'TOK')}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border-white/5 flex flex-col justify-center">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-lg">👥</div>
                  <div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">{t.investors}</span>
                    <h4 className="text-3xl font-black text-white tracking-tighter">{investorCount.toLocaleString()} <span className="text-[10px] text-zinc-600 uppercase font-bold">{t.investorsLabel}</span></h4>
                  </div>
               </div>
            </div>

            <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] block mb-2">{t.roundProgress}</span>
               <div className="h-16 flex items-end">
                  <SparkChart />
               </div>
            </div>
          </div>

          <CommunityPanel 
            poolAddress={poolAddress} 
            lang={lang} 
            isOwner={isOwner} 
            poolName={metadata?.description || `Pool ${poolAddress.substring(0, 6)}`} 
            creatorAddress={poolOwner ? String(poolOwner) : ''}
          />
        </div>

        <div className="xl:col-span-4 space-y-6">
          {isOwner && !isFin && (
            <div className="glass-card p-8 border-amber-500/20 bg-amber-500/5 group space-y-4">
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest italic">{t.commandConsole}</h3>
              <button disabled={!readyFin || isPending || isConfirming || isLocalLoading} onClick={handleFinalize} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase border transition-all ${readyFin ? 'bg-amber-500 text-black border-amber-400 hover:shadow-lg' : 'bg-white/5 text-zinc-600 border-white/5 cursor-not-allowed'}`}>
                {isPending || isConfirming || isLocalLoading ? t.processing : t.finalizeBtn}
              </button>
              
              <button 
                onClick={() => setShowCancelModal(true)} 
                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
              >
                {t.btnCancel}
              </button>
            </div>
          )}

          {showCancelModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="glass-card p-10 max-w-md w-full border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{t.confirmCancelTitle}</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">
                  {t.confirmCancelDesc}
                </p>
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 focus-within:border-red-500/50 transition-all">
                    <label className="block text-[8px] font-black text-zinc-600 uppercase mb-2 text-center tracking-[0.2em]">{t.writeCancel}</label>
                    <input 
                      type="text" 
                      className="w-full bg-transparent text-center text-xl font-black text-white outline-none placeholder:text-zinc-800"
                      placeholder="CANCELAR"
                      value={cancelConfirmText}
                      onChange={(e) => setCancelConfirmText(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowCancelModal(false)}
                      className="flex-1 py-4 rounded-xl bg-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest border border-white/10 hover:text-white transition-all"
                    >
                      {t.back}
                    </button>
                    <button 
                      disabled={cancelConfirmText !== 'CANCELAR' || isLocalLoading}
                      onClick={handleCancel}
                      className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${cancelConfirmText === 'CANCELAR' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/5'}`}
                    >
                      {isPending || isConfirming || isLocalLoading ? t.processing : t.confirmBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`glass-card p-8 shadow-2xl relative overflow-hidden border transition-all ${isBlocked ? 'border-zinc-800 bg-zinc-950/20 opacity-80' : 'featured-neon border-blue-500/20'}`}>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 italic">{t.investmentPanel}</h3>
            
            {!isFin ? (
              <div className="space-y-6">
                <div className={`bg-black/40 p-6 rounded-3xl border border-white/5 transition-all ${isBlocked ? 'opacity-50' : 'focus-within:border-blue-500/50'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.investAmount} ({isETH ? 'ETH' : 'USDC'})</label>
                    {!!(hCap && raised) && (
                      <button 
                        onClick={() => setAmount(formatUnits(safeBigInt(hCap) - safeBigInt(raised), tDecs))}
                        className="text-[8px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {t.max}: {formatUnits(safeBigInt(hCap) - safeBigInt(raised), tDecs)}
                      </button>
                    )}
                  </div>
                  <input readOnly={isBlocked} type="number" className="w-full bg-transparent text-4xl font-black text-white outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                
                {!!(amount && hCap && raised && parseUnits(amount, tDecs) > (safeBigInt(hCap) - safeBigInt(raised))) && (
                  <p className="text-center text-[9px] font-black text-red-500 uppercase animate-pulse">⚠️ {t.exceedsHardCap}</p>
                )}

                {!address ? (
                  <div className="flex justify-center text-center">
                    <ConnectKitButton.Custom>{({ show }) => (<button onClick={show} className="w-full py-6 btn-primary text-[10px] font-black uppercase tracking-[0.2em] shadow-xl italic">{t.connectWallet}</button>)}</ConnectKitButton.Custom>
                  </div>
                ) : (
                  <button 
                    onClick={handleAction}
                    disabled={isLocalLoading || isBlocked || !!(amount && hCap && raised && parseUnits(amount, tDecs) > (safeBigInt(hCap) - safeBigInt(raised)))}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/10 ${isBlocked || !!(amount && hCap && raised && parseUnits(amount, tDecs) > (safeBigInt(hCap) - safeBigInt(raised))) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black'}`}
                  >
                    {isPending || isConfirming ? t.processing : !enough ? t.approveBtn : t.contribute}
                  </button>
                )}
                {!!(isForcedFailed) && (
                   <p className="text-center text-[10px] font-black text-red-500 uppercase animate-pulse">{t.projectCancelled}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border font-bold ${isForcedFailed ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                  {isForcedFailed ? '⚠️' : '🏁'}
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                  {isForcedFailed ? t.missionAborted : (isOwner ? t.roundSuccessful : (hasContribution ? t.missionAccomplished : t.missionFinished))}
                </h4>
                <div className="space-y-3">
                  {isOwner && !isForcedFailed && (
                    <div className="py-8 text-center bg-black/20 border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
                        {t.fundsTransferred}
                      </p>
                    </div>
                  )}
                  {showClaim && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t.canClaim}</p>
                      <button onClick={handleClaim} className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:shadow-lg transition-all italic">{t.claimBtn}</button>
                    </div>
                  )}
                  {hasContribution && !showClaim && !showRefund && isFin && !isForcedFailed && (
                    <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in zoom-in duration-700">
                       <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs">✓</div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t.assetsClaimed}</p>
                       </div>
                       <button 
                         onClick={async () => {
                           if (window.ethereum && projTokenAddr) {
                             try {
                               await window.ethereum.request({
                                 method: 'wallet_watchAsset',
                                 params: {
                                   type: 'ERC20',
                                   options: {
                                     address: projTokenAddr as string,
                                     symbol: (projSymbol as string) || 'TKN',
                                     decimals: Number(projDecs as any) || 18,
                                   },
                                 },
                               });
                             } catch (err) { console.error(err); }
                           }
                         }}
                         className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-white/10 flex items-center justify-center gap-3"
                       >
                         <span>{t.addToWallet}</span>
                         <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" className="w-4 h-4" alt="Metamask" />
                       </button>
                    </div>
                  )}
                  {showRefund && (<button onClick={handleRefund} className="w-full py-4 bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:shadow-lg transition-all italic">{t.refundBtn}</button>)}
                  {!hasContribution && !isOwner && (
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.noParticipation}</p>
                  )}
                </div>
              </div>
            )}

            {isOwner && (
              <div className={`mt-8 pt-6 border-t border-white/5 space-y-6 ${!isFin ? 'animate-in slide-in-from-bottom-2' : ''}`}>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.tokenVault}</span>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${tokensMissing === BigInt(0) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {tokensMissing === BigInt(0) ? t.fundingReady : t.fundingPending}
                    </span>
                 </div>

                 <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex justify-between items-center text-left">
                    <div>
                       <p className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest mb-0.5">{t.inContract}</p>
                       <p className="text-xs font-black text-white">{poolTokenBalance ? formatUnits(safeBigInt(poolTokenBalance), Number(projDecs as any) || 18) : '0'} TKN</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[7px] text-zinc-500 font-extrabold uppercase tracking-widest mb-0.5">{t.targetGoal}</p>
                       <p className="text-xs font-black text-blue-400">{formatUnits(safeBigInt(tokensNeeded), Number(projDecs as any) || 18)} TKN</p>
                    </div>
                 </div>

                 {tokensMissing > BigInt(0) && (
                   <div className="space-y-4">
                     <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed text-left">
                       {t.transferTokens}
                     </p>
                     <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={handleFund}
                          disabled={isLocalLoading} 
                          className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl transition-all border border-white/5"
                        >
                          {isLocalLoading ? t.processing : t.depositBtn}
                        </button>
                        
                        {isTokenOwner && (
                          <button 
                            onClick={handleEmergencyMint}
                            disabled={isLocalLoading} 
                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-[0.1em] rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] italic"
                          >
                            {isLocalLoading ? 'Procesando Emisión...' : 'Emitir Tokens de Emergencia (Fix 2x) 🚀'}
                          </button>
                        )}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
      <WalletEmailCapture trigger={emailTrigger} onClose={() => setEmailTrigger(false)} />
    </div>
  );
}

// ============================================
// TRADUCCIONES LOCALES PARA LA COMUNIDAD
// ============================================
const communityTranslations: Record<string, any> = {
  es: {
    communityTitle: "Comunidad del Proyecto",
    communityDesc: "Envía preguntas públicas al creador o lee los anuncios oficiales.",
    tabQA: "💬 Preguntas y Respuestas (Q&A)",
    tabAnnouncements: "📢 Anuncios del Creador",
    inputNamePlaceholder: "Tu nombre o alias (opcional)",
    inputMessagePlaceholder: "Escribe tu mensaje público aquí...",
    btnSubmitMessage: "Enviar Mensaje Público",
    btnSubmitReply: "Responder",
    btnReply: "Responder",
    anonymous: "Anónimo",
    verifiedSender: "Remitente Verificado",
    creator: "Creador",
    adminBadge: "Admin",
    editBtn: "Editar",
    deleteBtn: "Eliminar",
    confirmDelete: "¿Estás seguro de que deseas eliminar este mensaje? Esta acción es irreversible.",
    editPrompt: "Edita el contenido del mensaje:",
    announcementTitle: "Enviar Anuncio Oficial",
    announcementAll: "Enviar a todos los inversores",
    announcementSome: "Enviar a inversores específicos",
    selectInvestors: "Selecciona los inversores destinatarios:",
    writeAnnouncementPlaceholder: "Escribe el anuncio oficial del creador...",
    btnSubmitAnnouncement: "Publicar Anuncio Oficial",
    noMessages: "No hay mensajes en este canal aún. ¡Sé el primero en preguntar!",
    noAnnouncements: "El creador no ha publicado anuncios oficiales para esta campaña.",
    targetAdminOption: "Dirigir mensaje a la Administración de OrbitBase (Soporte)",
    targetCreatorOption: "Dirigir mensaje al Creador del Proyecto (Q&A)",
    adminDirectedBadge: "Dirigido a: Administración",
    replyPlaceholder: "Escribe tu respuesta...",
    signaturePrompt: "Firma este mensaje con tu billetera para verificar tu identidad.",
    signingMessage: "Firmando...",
    errorEmpty: "El mensaje no puede estar vacío.",
    errorFailed: "Error al procesar la solicitud.",
    successPost: "¡Mensaje publicado con éxito!",
    successDelete: "¡Mensaje eliminado con éxito!",
    successEdit: "¡Mensaje editado con éxito!"
  },
  en: {
    communityTitle: "Project Community",
    communityDesc: "Send public questions to the creator or read official announcements.",
    tabQA: "💬 Questions & Answers (Q&A)",
    tabAnnouncements: "📢 Creator Announcements",
    inputNamePlaceholder: "Your name or alias (optional)",
    inputMessagePlaceholder: "Write your public message here...",
    btnSubmitMessage: "Send Public Message",
    btnSubmitReply: "Reply",
    btnReply: "Reply",
    anonymous: "Anonymous",
    verifiedSender: "Verified Sender",
    creator: "Creator",
    adminBadge: "Admin",
    editBtn: "Edit",
    deleteBtn: "Delete",
    confirmDelete: "Are you sure you want to delete this message? This action is irreversible.",
    editPrompt: "Edit the message content:",
    announcementTitle: "Send Official Announcement",
    announcementAll: "Send to all investors",
    announcementSome: "Send to specific investors",
    selectInvestors: "Select target investors:",
    writeAnnouncementPlaceholder: "Write the creator's official announcement...",
    btnSubmitAnnouncement: "Publish Official Announcement",
    noMessages: "No messages in this channel yet. Be the first to ask!",
    noAnnouncements: "The creator has not published official announcements for this campaign.",
    targetAdminOption: "Address message to OrbitBase Administration (Support)",
    targetCreatorOption: "Address message to Project Creator (Q&A)",
    adminDirectedBadge: "Addressed to: Administration",
    replyPlaceholder: "Write your reply...",
    signaturePrompt: "Sign this message with your wallet to verify your identity.",
    signingMessage: "Signing...",
    errorEmpty: "Message cannot be empty.",
    errorFailed: "Error processing request.",
    successPost: "Message published successfully!",
    successDelete: "Message deleted successfully!",
    successEdit: "Message edited successfully!"
  },
  pt: {
    communityTitle: "Comunidade do Projeto",
    communityDesc: "Envie perguntas públicas ao criador ou leia os anúncios oficiais.",
    tabQA: "💬 Perguntas e Respostas (Q&A)",
    tabAnnouncements: "📢 Anúncios do Criador",
    inputNamePlaceholder: "Seu nome ou alias (opcional)",
    inputMessagePlaceholder: "Escreva sua mensagem pública aqui...",
    btnSubmitMessage: "Enviar Mensagem Pública",
    btnSubmitReply: "Responder",
    btnReply: "Responder",
    anonymous: "Anônimo",
    verifiedSender: "Remetente Verificado",
    creator: "Criador",
    adminBadge: "Admin",
    editBtn: "Editar",
    deleteBtn: "Excluir",
    confirmDelete: "Tem certeza de que deseja excluir esta mensagem? Esta ação é irreversível.",
    editPrompt: "Edite o conteúdo da mensagem:",
    announcementTitle: "Enviar Anúncio Oficial",
    announcementAll: "Enviar para todos os investidores",
    announcementSome: "Enviar para investidores específicos",
    selectInvestors: "Selecione os investidores de destino:",
    writeAnnouncementPlaceholder: "Escreva o anúncio oficial do criador...",
    btnSubmitAnnouncement: "Publicar Anúncio Oficial",
    noMessages: "Não há mensagens neste canal ainda. Seja o primeiro a perguntar!",
    noAnnouncements: "O criador não publicou anúncios oficiais para esta campanha.",
    targetAdminOption: "Dirigir mensagem para a Administração do OrbitBase (Suporte)",
    targetCreatorOption: "Dirigir mensagem para o Criador do Projeto (Q&A)",
    adminDirectedBadge: "Dirigido a: Administração",
    replyPlaceholder: "Escreva sua resposta...",
    signaturePrompt: "Assine esta mensagem com sua carteira para verificar sua identidade.",
    signingMessage: "Assinando...",
    errorEmpty: "A mensagem não pode estar vazia.",
    errorFailed: "Erro ao processar a solicitação.",
    successPost: "Mensagem publicada com sucesso!",
    successDelete: "Mensagem excluída com sucesso!",
    successEdit: "Mensagem editada com sucesso!"
  },
  fr: {
    communityTitle: "Communauté du Projet",
    communityDesc: "Envoyez des questions publiques au créateur ou lisez les annonces officielles.",
    tabQA: "💬 Questions et Réponses (Q&A)",
    tabAnnouncements: "📢 Annonces du Créateur",
    inputNamePlaceholder: "Votre nom ou alias (optionnel)",
    inputMessagePlaceholder: "Écrivez votre message public ici...",
    btnSubmitMessage: "Envoyer un Message Public",
    btnSubmitReply: "Répondre",
    btnReply: "Répondre",
    anonymous: "Anonyme",
    verifiedSender: "Expéditeur Vérifié",
    creator: "Créateur",
    adminBadge: "Admin",
    editBtn: "Modifier",
    deleteBtn: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.",
    editPrompt: "Modifier le contenu du message :",
    announcementTitle: "Envoyer une Annonce Officielle",
    announcementAll: "Envoyer à tous les investisseurs",
    announcementSome: "Envoyer à des investisseurs spécifiques",
    selectInvestors: "Sélectionnez les investisseurs cibles :",
    writeAnnouncementPlaceholder: "Écrivez l'annonce officielle du créateur...",
    btnSubmitAnnouncement: "Publier l'Annonce Officielle",
    noMessages: "Il n'y a pas encore de messages dans ce canal. Soyez le premier à poser une question !",
    noAnnouncements: "Le créateur n'a pas publié d'annonces officielles pour cette campagne.",
    targetAdminOption: "Adresser le message à l'Administration d'OrbitBase (Support)",
    targetCreatorOption: "Adresser le message au Créateur du Projet (Q&A)",
    adminDirectedBadge: "Adressé à : Administration",
    replyPlaceholder: "Écrivez votre réponse...",
    signaturePrompt: "Signez ce message avec votre portefeuille pour vérifier votre identité.",
    signingMessage: "Signature...",
    errorEmpty: "Le message ne peut pas être vide.",
    errorFailed: "Erreur lors du traitement de la demande.",
    successPost: "Message publié avec succès !",
    successDelete: "Message supprimé avec succès !",
    successEdit: "Message modifié avec succès !"
  }
};

// ============================================
// COMPONENTE SUB-PANEL DE LA COMUNIDAD
// ============================================
export function CommunityPanel({ 
  poolAddress, 
  lang, 
  isOwner, 
  poolName,
  creatorAddress
}: { 
  poolAddress: string; 
  lang: Language; 
  isOwner: boolean; 
  poolName: string;
  creatorAddress: string;
}) {
  const t = communityTranslations[lang] || communityTranslations['es'];
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [activeTab, setActiveTab] = useState<'qa' | 'announcements'>('qa');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [senderName, setSenderName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [targetType, setTargetType] = useState<'public' | 'admin'>('public');

  // Announcement states
  const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'some'>('all');
  const [selectedInvestors, setSelectedInvestors] = useState<Record<string, boolean>>({});
  const [investors, setInvestors] = useState<string[]>([]);

  // Reply states
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyActive, setReplyActive] = useState<Record<number, boolean>>({});

  // Edit states
  const [editText, setEditText] = useState<Record<number, string>>({});
  const [editActive, setEditActive] = useState<Record<number, boolean>>({});

  const ANVIL_OWNER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
  const DEPLOYER_OWNER = '0x37042a9bba97e82811ded1061c28c89488e3234d';
  
  const isSystemAdmin = !!(address && (
    address.toLowerCase() === ANVIL_OWNER.toLowerCase() ||
    address.toLowerCase() === DEPLOYER_OWNER.toLowerCase()
  ));

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?poolAddress=${poolAddress}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('[CommunityPanel] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      const res = await fetch('/api/movimientos');
      const data = await res.json();
      if (data.success && data.events) {
        // Extract unique contributors for this specific pool
        const contribs = data.events
          .filter((ev: any) => ev.type === 'CONTRIBUTED' && ev.address?.toLowerCase() === poolAddress.toLowerCase())
          .map((ev: any) => ev.creator);
        setInvestors(Array.from(new Set(contribs)) as string[]);
      }
    } catch (err) {
      console.error('[CommunityPanel] Error fetching contributors:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchInvestors();
  }, [poolAddress]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return alert(t.errorEmpty);

    setActionLoading(true);
    try {
      let signature = undefined;
      let signatureMessage = undefined;

      if (isConnected && address) {
        signatureMessage = `OrbitBase: Publicar comentario en ${poolAddress} - ${Date.now()}`;
        signature = await signMessageAsync({ message: signatureMessage });
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress,
          senderAddress: isConnected ? address : null,
          senderName: senderName.trim() || null,
          message: messageText.trim(),
          targetType,
          signature,
          signatureMessage,
          lang
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessageText('');
        setSenderName('');
        fetchMessages();
      } else {
        alert(`${t.errorFailed}: ${data.error}`);
      }
    } catch (err: any) {
      console.error('[CommunityPanel] Post error:', err);
      if (err.code !== 4001) alert(t.errorFailed); // Ignore user signature rejection
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    const text = replyText[parentId];
    if (!text || !text.trim()) return alert(t.errorEmpty);

    setActionLoading(true);
    try {
      let signature = undefined;
      let signatureMessage = undefined;

      if (isConnected && address) {
        signatureMessage = `OrbitBase: Responder comentario ${parentId} - ${Date.now()}`;
        signature = await signMessageAsync({ message: signatureMessage });
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress,
          senderAddress: isConnected ? address : null,
          senderName: senderName.trim() || null,
          message: text.trim(),
          replyToId: parentId,
          targetType: 'public',
          signature,
          signatureMessage,
          lang
        })
      });

      const data = await res.json();
      if (data.success) {
        setReplyText(prev => ({ ...prev, [parentId]: '' }));
        setReplyActive(prev => ({ ...prev, [parentId]: false }));
        fetchMessages();
      } else {
        alert(`${t.errorFailed}: ${data.error}`);
      }
    } catch (err: any) {
      console.error('[CommunityPanel] Reply error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return alert(t.errorEmpty);
    if (!address) return;

    setActionLoading(true);
    try {
      const signatureMessage = `OrbitBase: Publicar anuncio oficial - ${Date.now()}`;
      const signature = await signMessageAsync({ message: signatureMessage });

      const targets = announcementTarget === 'some' 
        ? Object.keys(selectedInvestors).filter(k => selectedInvestors[k])
        : null;

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress,
          senderAddress: address,
          senderName: senderName.trim() || null,
          message: messageText.trim(),
          targetType: announcementTarget === 'all' ? 'announcement_all' : 'announcement_some',
          recipientAddresses: targets,
          signature,
          signatureMessage,
          lang
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessageText('');
        setSelectedInvestors({});
        fetchMessages();
      } else {
        alert(`${t.errorFailed}: ${data.error}`);
      }
    } catch (err) {
      console.error('[CommunityPanel] Announcement error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!address) return;
    if (!window.confirm(t.confirmDelete)) return;

    setActionLoading(true);
    try {
      const signatureMessage = `Delete message: ${msgId}`;
      const signature = await signMessageAsync({ message: signatureMessage });

      const res = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          signature,
          signatureMessage,
          address
        })
      });

      const data = await res.json();
      if (data.success) {
        fetchMessages();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('[CommunityPanel] Delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMessage = async (msgId: number) => {
    if (!address) return;
    const newMsg = editText[msgId];
    if (!newMsg || !newMsg.trim()) return;

    setActionLoading(true);
    try {
      const signatureMessage = `Edit message: ${msgId} to '${newMsg.trim()}'`;
      const signature = await signMessageAsync({ message: signatureMessage });

      const res = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          message: newMsg.trim(),
          signature,
          signatureMessage,
          address
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditActive(prev => ({ ...prev, [msgId]: false }));
        fetchMessages();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('[CommunityPanel] Edit error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to abbreviate address
  const abbr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const renderMessageCard = (msg: any, isReply = false) => {
    const isMsgOwner = msg.sender_address && address && msg.sender_address.toLowerCase() === address.toLowerCase();
    const isMsgCreator = msg.sender_address && creatorAddress && msg.sender_address.toLowerCase() === creatorAddress.toLowerCase();
    const isMsgAdmin = msg.sender_address && (
      msg.sender_address.toLowerCase() === ANVIL_OWNER.toLowerCase() || 
      msg.sender_address.toLowerCase() === DEPLOYER_OWNER.toLowerCase()
    );

    const isEditing = editActive[msg.id];

    return (
      <div 
        key={msg.id} 
        className={`${isReply ? 'ml-8 border-l border-white/5 pl-4' : 'glass-card border-white/5'} p-5 relative space-y-3 hover:border-white/10 transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-white">
              {msg.sender_name || (msg.sender_address ? abbr(msg.sender_address) : t.anonymous)}
            </span>
            {msg.sender_address ? (
              isMsgAdmin ? (
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase rounded tracking-widest">
                  ⚙️ {t.adminBadge}
                </span>
              ) : isMsgCreator ? (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black uppercase rounded tracking-widest">
                  🛡️ {t.creator}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded tracking-widest">
                  👤 {t.verifiedSender}
                </span>
              )
            ) : (
              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[8px] font-black uppercase rounded tracking-widest">
                👤 {t.anonymous}
              </span>
            )}
            
            {msg.target_type === 'admin' && (
              <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded tracking-widest">
                📩 {t.adminDirectedBadge}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              {new Date(msg.created_at).toLocaleDateString()}
            </span>
            {isSystemAdmin && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditActive(prev => ({ ...prev, [msg.id]: !prev[msg.id] }));
                    setEditText(prev => ({ ...prev, [msg.id]: msg.message }));
                  }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-black uppercase tracking-widest"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase tracking-widest"
                >
                  ❌
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full bg-zinc-950/70 border border-white/10 rounded-xl p-3 outline-none text-white text-xs"
              value={editText[msg.id] || ''}
              onChange={(e) => setEditText(prev => ({ ...prev, [msg.id]: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setEditActive(prev => ({ ...prev, [msg.id]: false }))}
                className="px-3 py-1.5 bg-white/5 border border-white/5 text-zinc-400 text-[10px] font-black uppercase rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleEditMessage(msg.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
        )}

        {/* Creator Reply Button */}
        {!isReply && isOwner && !replyActive[msg.id] && msg.target_type !== 'admin' && (
          <button 
            onClick={() => setReplyActive(prev => ({ ...prev, [msg.id]: true }))}
            className="text-[10px] text-amber-500 hover:text-amber-400 font-black uppercase tracking-widest block pt-1"
          >
            ↩️ {t.btnReply}
          </button>
        )}

        {/* Inline Reply Form */}
        {replyActive[msg.id] && (
          <div className="space-y-3 mt-4 pt-3 border-t border-white/5">
            <textarea
              placeholder={t.replyPlaceholder}
              className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-xl p-3 outline-none text-white text-xs transition-all placeholder:text-zinc-700"
              value={replyText[msg.id] || ''}
              onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setReplyActive(prev => ({ ...prev, [msg.id]: false }))}
                className="px-3 py-1.5 bg-white/5 border border-white/5 text-zinc-400 text-[10px] font-black uppercase rounded-lg"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSubmitReply(msg.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg shadow-md"
              >
                {t.btnSubmitReply}
              </button>
            </div>
          </div>
        )}

        {/* Render Nested Replies */}
        {msg.replies && msg.replies.map((reply: any) => renderMessageCard(reply, true))}
      </div>
    );
  };

  const filteredQA = messages.filter(m => m.target_type === 'public' || m.target_type === 'admin');
  const filteredAnnouncements = messages.filter(m => m.target_type === 'announcement_all' || m.target_type === 'announcement_some');

  return (
    <div className="glass-card p-8 border-white/5 relative overflow-hidden group space-y-6 shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
      
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
            {t.communityTitle}
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
            {t.communityDesc}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('qa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'qa' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
          >
            QA
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'announcements' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
          >
            Anuncios
          </button>
        </div>
      </div>

      {activeTab === 'qa' ? (
        <div className="space-y-6">
          {/* Post Message Form */}
          <form onSubmit={handleSubmitMessage} className="space-y-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Nombre / Alias</label>
                <input 
                  type="text" 
                  placeholder={t.inputNamePlaceholder}
                  className="w-full bg-zinc-950/50 border border-white/5 focus:border-blue-500/50 rounded-xl px-4 py-3 outline-none text-white text-xs transition-all placeholder:text-zinc-700"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Destinatario</label>
                <select
                  className="w-full bg-zinc-950/50 border border-white/5 focus:border-blue-500/50 rounded-xl px-4 py-3 outline-none text-white text-xs transition-all cursor-pointer"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <option value="public">{t.targetCreatorOption}</option>
                  <option value="admin">{t.targetAdminOption}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Mensaje Público</label>
              <textarea 
                placeholder={t.inputMessagePlaceholder}
                className="w-full bg-zinc-950/50 border border-white/5 focus:border-blue-500/50 rounded-2xl p-4 outline-none text-white text-sm transition-all placeholder:text-zinc-700 min-h-[100px]"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center flex-wrap gap-4 pt-2">
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                {isConnected ? `🔗 Conectado como ${abbr(address || '')}` : '👤 Enviando como Anónimo'}
              </span>
              <button 
                type="submit" 
                disabled={actionLoading || !messageText.trim()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Enviando...' : t.btnSubmitMessage}
              </button>
            </div>
          </form>

          {/* Messages Feed */}
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-black text-xs uppercase tracking-widest">Cargando comentarios...</div>
          ) : filteredQA.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold text-xs uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-white/5">
              {t.noMessages}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQA.map(msg => renderMessageCard(msg))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Creator Announcement Form */}
          {isOwner && (
            <form onSubmit={handleSendAnnouncement} className="space-y-4 bg-amber-500/[0.01] border border-amber-500/10 p-6 rounded-2xl">
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest italic mb-2">📢 {t.announcementTitle}</h4>
              
              <div className="flex gap-6 mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input 
                    type="radio" 
                    name="ann_target" 
                    checked={announcementTarget === 'all'} 
                    onChange={() => setAnnouncementTarget('all')}
                    className="accent-amber-500"
                  />
                  {t.announcementAll}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input 
                    type="radio" 
                    name="ann_target" 
                    checked={announcementTarget === 'some'} 
                    onChange={() => setAnnouncementTarget('some')}
                    className="accent-amber-500"
                  />
                  {t.announcementSome}
                </label>
              </div>

              {/* Specific Investors Selection */}
              {announcementTarget === 'some' && (
                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5">
                  <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t.selectInvestors}</span>
                  {investors.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">No hay inversores registrados en esta preventa aún.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                      {investors.map((inv) => (
                        <label key={inv} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={!!selectedInvestors[inv]} 
                            onChange={(e) => setSelectedInvestors(prev => ({ ...prev, [inv]: e.target.checked }))}
                            className="accent-amber-500"
                          />
                          {abbr(inv)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <textarea 
                  placeholder={t.writeAnnouncementPlaceholder}
                  className="w-full bg-zinc-950/50 border border-white/5 focus:border-amber-500/50 rounded-2xl p-4 outline-none text-white text-sm transition-all placeholder:text-zinc-700 min-h-[100px]"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={actionLoading || !messageText.trim()}
                  className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Publicando...' : t.btnSubmitAnnouncement}
                </button>
              </div>
            </form>
          )}

          {/* Announcements Feed */}
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-black text-xs uppercase tracking-widest">Cargando anuncios...</div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-bold text-xs uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-white/5">
              {t.noAnnouncements}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map(ann => (
                <div key={ann.id} className="glass-card p-6 border-amber-500/20 bg-amber-500/[0.02] space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] blur-[20px] rounded-full" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest">📢 Anuncio Oficial</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black uppercase rounded tracking-widest">
                        🛡️ {t.creator}
                      </span>
                      {ann.target_type === 'announcement_some' && (
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase rounded tracking-widest">
                          🎯 Destinatarios Filtrados
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      {isSystemAdmin && (
                        <button 
                          onClick={() => handleDeleteMessage(ann.id)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-black uppercase tracking-widest"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-semibold">{ann.message}</p>

                  {ann.target_type === 'announcement_some' && ann.recipient_addresses && (
                    <div className="text-[10px] text-zinc-500 border-t border-white/5 pt-3 flex flex-wrap gap-2 items-center">
                      <span className="font-bold uppercase tracking-wider">Inversores Seleccionados:</span>
                      {JSON.parse(ann.recipient_addresses).map((addr: string) => (
                        <span key={addr} className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[9px] font-mono text-zinc-400">
                          {abbr(addr)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


