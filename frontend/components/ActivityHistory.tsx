'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { formatEther, parseEther, Address } from 'viem';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x610178dA211FEF7D417bC0e6FeD39F05609AD788';
const LOCKER_ADDRESS = process.env.NEXT_PUBLIC_LOCKER_ADDRESS || '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e';

export function ActivityHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [newFee, setNewFee] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [configStep, setConfigStep] = useState<'view' | 'edit'>('view');
  const [mounted, setMounted] = useState(false);

  // All hooks must be called here
  const { data: factoryOwner } = useReadContract({
    address: FACTORY_ADDRESS as Address,
    abi: [{ "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'owner',
  });

  const { data: flatFeeData } = useReadContract({
    address: FACTORY_ADDRESS as Address,
    abi: [{ "inputs": [], "name": "flatFee", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
    functionName: 'flatFee',
  });

  const { data: currentRecipient } = useReadContract({
    address: FACTORY_ADDRESS as Address,
    abi: [{ "inputs": [], "name": "feeRecipient", "outputs": [{ "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'feeRecipient',
  });

  const { data: factoryBalance } = useBalance({
    address: FACTORY_ADDRESS as Address,
  });

  const { writeContract: updateSettings } = useWriteContract();

  useEffect(() => { setMounted(true); }, []);

  // Logic using hooks
  const isAdmin = useMemo(() => isConnected && address?.toLowerCase() === factoryOwner?.toLowerCase(), [address, factoryOwner, isConnected]);

  useEffect(() => {
    if (!isAdmin) setIsAdminView(false);
  }, [isAdmin]);

  const handleUpdateConfig = (type: 'fee' | 'recipient') => {
    if (type === 'fee') {
      updateSettings({
        address: FACTORY_ADDRESS as Address,
        abi: [{ "inputs": [{ "name": "_newFee", "type": "uint256" }], "name": "setFlatFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }],
        functionName: 'setFlatFee',
        args: [parseEther(newFee)],
      });
    } else {
      updateSettings({
        address: FACTORY_ADDRESS as Address,
        abi: [{ "inputs": [{ "name": "_newRecipient", "type": "address" }], "name": "setFeeRecipient", "outputs": [], "stateMutability": "nonpayable", "type": "function" }],
        functionName: 'setFeeRecipient',
        args: [newRecipient as Address],
      });
    }
  };

  const handleWithdraw = () => {
    updateSettings({
      address: FACTORY_ADDRESS as Address,
      abi: [{ "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }],
      functionName: 'withdraw',
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!publicClient || !isConnected) return;
      setIsLoading(true);
      try {
        // En redes públicas como Sepolia, no podemos pedir desde el bloque 0.
        // Lo ideal es conocer el bloque de despliegue. 
        // Como solución temporal/robusta, pedimos los últimos 10,000 bloques.
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(9999) > BigInt(0) ? currentBlock - BigInt(9999) : BigInt(0);

        const factoryLogs = await publicClient.getLogs({
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
              { name: 'templateType', type: 'uint8' },
              { name: 'fee', type: 'uint256' }
            ]
          },
          fromBlock: BigInt(0)
        });

        const lockerLogs = await publicClient.getLogs({
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
        });

        console.log("Raw Factory Logs:", factoryLogs);
        console.log("Raw Locker Logs:", lockerLogs);

        const allEvents = await Promise.all([
          ...factoryLogs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
              type: 'TOKEN_CREATED',
              data: log.args,
              timestamp: Number(block.timestamp),
              hash: log.transactionHash,
              creator: log.args.creator,
            };
          }),
          ...lockerLogs.map(async (log) => {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            return {
              type: 'LOCK_CREATED',
              data: log.args,
              timestamp: Number(block.timestamp),
              hash: log.transactionHash,
              creator: log.args.owner,
            };
          })
        ]);
        console.log("Mapped Events:", allEvents);

        setActivities(allEvents.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected && publicClient) {
      fetchHistory();
    }
  }, [isConnected, publicClient]);

  // Early return after all hooks
  if (!mounted || !isConnected) return null;

  const filteredActivities = activities.filter(act => {
    // 1. Role / Permission Filter
    const isOwner = (act.creator && act.creator.toLowerCase() === address?.toLowerCase());
    const matchesPermission = isAdminView ? isAdmin : isOwner;
    
    // 2. Date Filter
    const timestampMs = act.timestamp * 1000;
    
    let matchesStart = true;
    if (dateRange.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        matchesStart = timestampMs >= start.getTime();
    }
    
    let matchesEnd = true;
    if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        matchesEnd = timestampMs <= end.getTime();
    }
    
    return matchesPermission && matchesStart && matchesEnd;
  });

  const totalIncome = filteredActivities
    .filter(a => a.type === 'TOKEN_CREATED')
    .reduce((acc, act) => acc + Number(formatEther(act.data.fee || BigInt(0))), 0);

  return (
    <div className="glass-card p-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white">
            Panel de Actividad
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Monitorea tus lanzamientos y bloqueos de liquidez.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {isAdmin && (
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <button 
                onClick={() => setIsAdminView(false)}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold transition-all ${!isAdminView ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Mi Actividad
              </button>
              <button 
                onClick={() => setIsAdminView(true)}
                className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold transition-all ${isAdminView ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Modo Admin
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] uppercase font-bold text-zinc-500 focus:ring-0"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <span className="text-zinc-400">→</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] uppercase font-bold text-zinc-500 focus:ring-0"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>

          <button 
            onClick={() => {}} // Could trigger a re-fetch if fetchHistory was external
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            title="Actualizar"
          >
            🔄
          </button>
        </div>
      </div>

      {isAdminView && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Ingresos Totales</h4>
              <p className="text-3xl font-black text-amber-600 font-mono">{totalIncome.toFixed(2)} ETH</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Tokens Creados</h4>
              <p className="text-3xl font-black text-blue-600 font-mono">{filteredActivities.filter(a => a.type === 'TOKEN_CREATED').length}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Bloqueos de Liquidez</h4>
              <p className="text-3xl font-black text-emerald-600 font-mono">{filteredActivities.filter(a => a.type === 'LOCK_CREATED').length}</p>
            </div>
          </div>

          <div className="mb-12 p-8 bg-zinc-100 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-zinc-500 text-base">⚙️</span> Configuración de Plataforma
                </h3>
                <div className="flex flex-col items-end gap-1">
                    <button 
                        onClick={handleWithdraw}
                        disabled={!factoryBalance || factoryBalance.value === BigInt(0)}
                        className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-80 disabled:opacity-30 transition-all shadow-lg"
                    >
                        Retirar Balance
                    </button>
                    <span className="text-[10px] font-bold text-zinc-400 mr-2">
                        Disponible: {factoryBalance?.formatted?.slice(0, 6) || '0.00'} {factoryBalance?.symbol || 'ETH'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Tarifa por Creación (Flat Fee)</label>
                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <input 
                            type="number" 
                            step="0.001"
                            placeholder={flatFeeData ? formatEther(flatFeeData as bigint) : '0.01'}
                            className="flex-1 min-w-[120px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            value={newFee}
                            onChange={(e) => setNewFee(e.target.value)}
                        />
                        <button 
                            onClick={() => handleUpdateConfig('fee')}
                            className="whitespace-nowrap px-8 py-3 bg-amber-500 text-white rounded-2xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                        >
                            Actualizar
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic font-medium ml-1">Actual: {flatFeeData ? formatEther(flatFeeData as bigint) : '---'} ETH</p>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Billetera Receptora de Comisiones</label>
                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <input 
                            type="text" 
                            placeholder={currentRecipient as string || '0x...'}
                            className="flex-1 min-w-[200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3 text-xs font-mono focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            value={newRecipient}
                            onChange={(e) => setNewRecipient(e.target.value)}
                        />
                        <button 
                            onClick={() => handleUpdateConfig('recipient')}
                            className="whitespace-nowrap px-8 py-3 bg-blue-500 text-white rounded-2xl text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                        >
                            Cambiar
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic font-medium ml-1 truncate">Actual: {currentRecipient as string || '---'}</p>
                </div>
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm animate-pulse">Sincronizando con la red Base...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
          <p className="text-zinc-400">No se encontraron movimientos para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fecha</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tipo</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Detalles</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Creador</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Cantidad / Suministro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredActivities.map((act, i) => (
                <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                  <td className="py-4 px-4">
                    <div className="text-xs font-medium">{new Date(act.timestamp * 1000).toLocaleDateString()}</div>
                    <div className="text-[10px] text-zinc-400">{new Date(act.timestamp * 1000).toLocaleTimeString()}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      act.type === 'TOKEN_CREATED' 
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' 
                        : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {act.type === 'TOKEN_CREATED' ? 'Token' : 'Lock'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs font-bold">{act.data.name || 'Lock LP'} ({act.data.symbol || 'ID: ' + act.data.id})</div>
                    <a href={`#`} className="text-[9px] text-zinc-400 hover:text-blue-500 font-mono truncate block max-w-[100px]">
                      {act.hash.slice(0, 15)}...
                    </a>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {act.creator.slice(0, 6)}...{act.creator.slice(-4)}
                      {act.creator === address && <span className="ml-2 text-blue-500 font-bold">(Tú)</span>}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="text-xs font-black font-mono">
                      {act.type === 'TOKEN_CREATED' 
                        ? Number(formatEther(act.data.initialSupply)).toLocaleString()
                        : Number(formatEther(act.data.amount)).toLocaleString()
                      }
                      <span className="ml-1 text-[10px] text-zinc-400 font-bold">{act.data.symbol || 'Tokens'}</span>
                    </div>
                    {act.type === 'TOKEN_CREATED' && (
                      <div className="text-[8px] font-bold text-amber-500">Fee: {formatEther(act.data.fee || BigInt(0))} ETH</div>
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
