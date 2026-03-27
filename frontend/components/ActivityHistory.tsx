'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { formatEther, parseEther, Address } from 'viem';
import { translations, Language } from '@/lib/translations';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';
const LOCKER_ADDRESS = process.env.NEXT_PUBLIC_LOCKER_ADDRESS || '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e';

const LOCKER_ABI = [
  { "inputs": [{ "name": "_id", "type": "uint256" }], "name": "unlock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

export function ActivityHistory({ lang }: { lang: Language }) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  const t = translations[lang].activity;

  // Configuration State for Admin
  const [flatFee, setFlatFee] = useState<string>('0.01');
  const [feeRecipient, setFeeRecipient] = useState<string>('');
  const [isUpdatingFees, setIsUpdatingFees] = useState(false);

  const { data: factoryOwner } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: [{ "type": "function", "name": "owner", "inputs": [], "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view" }],
    functionName: 'owner',
  });

  const { data: flatFeeData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: [{ "type": "function", "name": "flatFee", "inputs": [], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" }],
    functionName: 'flatFee',
  });

  const { data: recipientData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: [{ "type": "function", "name": "feeRecipient", "inputs": [], "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view" }],
    functionName: 'feeRecipient',
  });

  const { data: factoryBalance } = useBalance({
    address: FACTORY_ADDRESS,
  });

  const { writeContract: updateSettings } = useWriteContract();
  const { writeContract: claimTokens, isPending: isClaiming } = useWriteContract();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && address && factoryOwner) {
      setIsAdmin(address.toLowerCase() === (factoryOwner as string).toLowerCase());
    }
  }, [address, factoryOwner, mounted]);

  useEffect(() => {
    if (flatFeeData) setFlatFee(formatEther(flatFeeData as bigint));
    if (recipientData) setFeeRecipient(recipientData as string);
  }, [flatFeeData, recipientData]);

  const fetchHistory = async () => {
    if (!publicClient) return;
    setIsLoading(true);
    try {
      const [factoryLogs, lockerLogs, unlockLogs] = await Promise.all([
        publicClient.getLogs({
          address: FACTORY_ADDRESS as Address,
          event: {
            type: 'event',
            name: 'TokenCreated',
            inputs: [
              { indexed: true, name: 'tokenAddress', type: 'address' },
              { indexed: true, name: 'creator', type: 'address' },
              { name: 'name', type: 'string' },
              { name: 'symbol', type: 'string' },
              { name: 'initialSupply', type: 'uint256' },
              { name: 'fee', type: 'uint256' },
              { name: 'templateType', type: 'uint8' }
            ]
          },
          fromBlock: BigInt(0)
        }),
        publicClient.getLogs({
          address: LOCKER_ADDRESS as Address,
          event: {
            type: 'event',
            name: 'Locked',
            inputs: [
              { indexed: true, name: 'id', type: 'uint256' },
              { indexed: true, name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'unlockTime', type: 'uint256' },
              { name: 'owner', type: 'address' }
            ]
          },
          fromBlock: BigInt(0)
        }),
        publicClient.getLogs({
          address: LOCKER_ADDRESS as Address,
          event: {
            type: 'event',
            name: 'Unlocked',
            inputs: [
              { indexed: true, name: 'id', type: 'uint256' },
              { indexed: true, name: 'owner', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ]
          },
          fromBlock: BigInt(0)
        })
      ]);

      const claimedIds = new Set(unlockLogs.map(log => log.args.id?.toString()));

      const allEvents = await Promise.all([
        ...factoryLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash });
          return {
            type: 'TOKEN_CREATED',
            data: log.args,
            timestamp: Number(block.timestamp),
            hash: log.transactionHash,
            creator: log.args.creator,
          };
        }),
        ...lockerLogs.map(async (log) => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash });
          return {
            type: 'LOCK_CREATED',
            data: log.args,
            timestamp: Number(block.timestamp),
            hash: log.transactionHash,
            creator: log.args.owner,
            isClaimed: claimedIds.has(log.args.id?.toString()),
            lockId: log.args.id
          };
        })
      ]);

      const sortedEvents = allEvents.sort((a, b) => b.timestamp - a.timestamp);
      
      const tokenLocks = sortedEvents.reduce((acc, act) => {
        if (act.type === 'LOCK_CREATED' && act.data.token) {
          const token = act.data.token.toLowerCase();
          if (!acc[token]) acc[token] = [];
          acc[token].push(act);
        }
        return acc;
      }, {} as Record<string, any[]>);

      const enrichedActivities = sortedEvents.map(act => {
        if (act.type === 'TOKEN_CREATED' && act.data.tokenAddress) {
           const locks = tokenLocks[act.data.tokenAddress.toLowerCase()] || [];
           return { ...act, locks };
        }
        return act;
      });

      setActivities(enrichedActivities);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) fetchHistory();
  }, [mounted, publicClient]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!mounted) return null;

  const filteredActivities = activities.filter(act => 
    activeFilter === 'all' || (address && act.creator.toLowerCase() === address.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter uppercase">{t.title}</h2>
          <p className="text-zinc-500 font-light text-sm">{t.subtitle}</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${activeFilter === 'all' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'}`}
          >
            {lang === 'es' ? 'Toda la Actividad' : lang === 'pt' ? 'Toda a Atividade' : lang === 'fr' ? 'Toute l\'Activité' : 'All Activity'}
          </button>
          <button 
            onClick={() => setActiveFilter('mine')}
            className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${activeFilter === 'mine' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/10' : 'text-zinc-500 hover:text-white'}`}
          >
            {t.myActivity}
          </button>
        </div>
      </div>

      {/* Featured Projects Showcase */}
      <div className="space-y-8 mb-20">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-amber-500/80 mb-2">{t.featuredTitle}</h3>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-transparent mb-6" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Orbit Protocol', symbol: 'ORB', supply: '1,000,000,000', locked: '250 ETH', icon: '🌌', color: 'from-amber-500 to-orange-600' },
            { name: 'Base Alpha', symbol: 'ALPHA', supply: '10,000,000', locked: '50 ETH', icon: '🛰️', color: 'from-blue-500 to-cyan-600' },
            { name: 'Nebula DAO', symbol: 'NEB', supply: '21,000,000', locked: '100 ETH', icon: '🧬', color: 'from-purple-500 to-indigo-600' }
          ].map((proj, idx) => (
            <div key={idx} className="group relative p-10 rounded-[3rem] bg-zinc-900 border-2 border-white/10 hover:border-white/30 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${proj.color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
               
               <div className="flex items-center gap-5 mb-10">
                  <div className={`w-16 h-16 rounded-[1.3rem] bg-gradient-to-br ${proj.color} flex items-center justify-center text-3xl shadow-2xl group-hover:scale-110 transition-transform`}>
                    {proj.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-2xl text-white tracking-tighter leading-none mb-2">{proj.name}</h4>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">${proj.symbol}</span>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Suministro</span>
                    <span className="text-sm font-black font-mono text-zinc-300">{proj.supply}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 group-hover:border-amber-500/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/80 mb-2">{lang === 'es' || lang === 'pt' ? 'Liquidez Bloqueada' : lang === 'fr' ? 'Liquidité Verrouillée' : 'Locked Liquidity'}</span>
                      <span className="text-xl font-black font-mono text-white leading-none">{proj.locked}</span>
                    </div>
                    <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">Auditado</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Quick View (Optional) */}
      {isAdmin && address && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="glass-card p-6 flex flex-col justify-between border-amber-500/20 bg-amber-500/[0.02]">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mb-8">{t.adminMode} • {t.totalIncome}</span>
            <div className="space-y-2">
              <div className="text-4xl font-black font-mono">
                {factoryBalance?.formatted ? parseFloat(factoryBalance.formatted).toFixed(4) : '0.0000'}{' '}
                <span className="text-sm">ETH</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-bold">{t.available}</div>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 glass-card p-6 border-white/10">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.configTitle}</span>
                <button 
                  onClick={() => setIsUpdatingFees(!isUpdatingFees)}
                  className="text-[10px] font-bold text-amber-500 hover:underline"
                >
                  {isUpdatingFees ? (lang === 'fr' ? 'Fermer' : 'Cerrar') : t.changeBtn}
                </button>
             </div>
             
             {!isUpdatingFees ? (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase mb-1">{t.flatFeeLabel}</div>
                    <div className="text-xl font-black font-mono">{flatFee} ETH</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase mb-1">{t.recipientLabel}</div>
                    <div className="text-xs font-mono text-zinc-400 truncate">{feeRecipient}</div>
                  </div>
                </div>
             ) : (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        value={flatFee} 
                        onChange={(e) => setFlatFee(e.target.value)}
                        placeholder="0.01"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono"
                      />
                      <input 
                        type="text" 
                        value={feeRecipient} 
                        onChange={(e) => setFeeRecipient(e.target.value)}
                        placeholder="0x..."
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono"
                      />
                   </div>
                   <button 
                    onClick={() => updateSettings({
                      address: FACTORY_ADDRESS as Address,
                      abi: [{ "type": "function", "name": "setFees", "inputs": [{ "name": "_flatFee", "type": "uint256" }, { "name": "_feeRecipient", "type": "address" }], "outputs": [], "stateMutability": "nonpayable" }],
                      functionName: 'setFees',
                      args: [parseEther(flatFee), feeRecipient as Address],
                    })}
                    className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl text-xs uppercase"
                   >
                     {t.updateBtn}
                   </button>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Main Table */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-light text-sm animate-pulse">{t.syncing}</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-32 text-center glass-card border-dashed border-white/5">
          <span className="text-4xl block mb-6">🛰️</span>
          <p className="text-zinc-500 font-light max-w-xs mx-auto text-sm">{t.noResults}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-white/[0.01] backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">{t.table.date}</th>
                <th className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">{t.table.type}</th>
                <th className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">{t.table.details}</th>
                <th className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500">{t.table.creator}</th>
                <th className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500 text-right">{t.table.quantity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredActivities.map((act, i) => (
                <tr key={i} className="group hover:bg-white/[0.03] transition-all duration-300">
                  <td className="py-6 px-8">
                    <div className="text-xs font-bold">{new Date(act.timestamp * 1000).toLocaleDateString()}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">{new Date(act.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${
                      act.type === 'TOKEN_CREATED' 
                        ? (act.data.templateType === 1 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20')
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {act.type === 'TOKEN_CREATED' 
                        ? (act.data.templateType === 1 ? t.memecoin : t.token) 
                        : t.lock}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-black flex items-center gap-2">
                        {act.data.name || (act.type === 'LOCK_CREATED' ? (lang === 'es' ? 'Bloqueo LP' : lang === 'pt' ? 'Bloqueio LP' : lang === 'fr' ? 'Verrou LP' : 'LP Lock') : 'Asset')} ({act.data.symbol || 'ID: ' + act.data.id})
                        {(act.data.tokenAddress || act.data.token) && (
                          <button 
                            onClick={() => copyToClipboard(act.data.tokenAddress || act.data.token)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                            title={t.copyAddr}
                          >
                              {copiedText === (act.data.tokenAddress||act.data.token) ? '✅' : '📋'}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <a 
                            href={`https://basescan.org/tx/${act.hash}`} 
                            target="_blank" 
                            className="text-[10px] text-zinc-500 hover:text-white font-mono underline decoration-zinc-800 transition-colors"
                          >
                            TX: {act.hash.slice(0, 10)}...
                          </a>
                          <button 
                            onClick={() => copyToClipboard(act.hash)}
                            className="text-[10px] text-zinc-600 hover:text-white transition-colors"
                          >
                            {copiedText === act.hash ? t.copied : t.copyHash}
                          </button>
                      </div>

                      {act.type === 'TOKEN_CREATED' && act.locks && act.locks.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {act.locks.map((lock: any, idx: number) => (
                             <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center gap-3 text-[10px]">
                                <span className="text-emerald-500 font-black">🔒 {t.lockedLiq}:</span>
                                <span className="text-zinc-400 font-mono font-bold">{Number(formatEther(lock.data.amount)).toLocaleString()}</span>
                                <span className="text-emerald-500 font-black ml-auto flex items-center gap-1">
                                  <span>📅 {new Date(Number(lock.data.unlockTime) * 1000).toLocaleDateString()}</span>
                                </span>
                             </div>
                          ))}
                        </div>
                      )}

                      {act.type === 'LOCK_CREATED' && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase text-emerald-600/70">{t.unlockDate}</span>
                              <span className="text-[11px] font-black text-emerald-500 font-mono">
                                {new Date(Number(act.data.unlockTime) * 1000).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="w-[1px] h-6 bg-emerald-500/20"></div>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase text-emerald-600/70">{t.unlockTime}</span>
                              <span className="text-[11px] font-black text-emerald-500 font-mono">
                                {new Date(Number(act.data.unlockTime) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          
                          {act.isClaimed ? (
                            <span className="bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 uppercase">
                              {t.claimed}
                            </span>
                          ) : (
                            act.creator === address && (
                              <button
                                onClick={() => claimTokens({
                                  address: LOCKER_ADDRESS as Address,
                                  abi: LOCKER_ABI,
                                  functionName: 'unlock',
                                  args: [act.lockId],
                                })}
                                disabled={isClaiming || Number(act.data.unlockTime) > Math.floor(Date.now() / 1000)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg ${
                                  Number(act.data.unlockTime) <= Math.floor(Date.now() / 1000)
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                                }`}
                              >
                                {isClaiming ? t.processing : Number(act.data.unlockTime) > Math.floor(Date.now() / 1000) ? t.locked : t.claimBtn}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-col gap-1">
                      <div className="text-[11px] font-mono text-zinc-500 group-hover:text-white transition-colors flex items-center gap-2">
                        {act.creator.slice(0, 6)}...{act.creator.slice(-4)}
                        {act.creator === address && <span className="text-amber-500 font-black text-[9px] uppercase tracking-tighter">{t.you}</span>}
                        <button 
                          onClick={() => copyToClipboard(act.creator)}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                        >
                          📋
                        </button>
                      </div>
                      {(act.data.tokenAddress || act.data.token) && (
                        <div className="text-[10px] font-mono text-zinc-600 font-bold">
                          ADDR: {(act.data.tokenAddress || act.data.token).slice(0, 5)}...{(act.data.tokenAddress || act.data.token).slice(-4)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="text-sm font-black font-mono tracking-tight">
                      {act.type === 'TOKEN_CREATED' 
                        ? Number(formatEther(act.data.initialSupply)).toLocaleString()
                        : Number(formatEther(act.data.amount)).toLocaleString()
                      }
                      <span className="ml-2 text-[10px] text-zinc-500 font-black uppercase">{act.data.symbol || 'LP'}</span>
                    </div>
                    {act.type === 'TOKEN_CREATED' && (
                      <div className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1 opacity-70">Fee: {formatEther(act.data.fee || BigInt(0))} ETH</div>
                    )}
                    {act.type === 'LOCK_CREATED' && (
                      <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter mt-1 opacity-70">{t.lockedLiq}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
