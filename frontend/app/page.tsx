'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CreateTokenForm } from '@/components/CreateTokenForm';
import { LiquidityLockerForm } from '@/components/LiquidityLockerForm';
import { ActivityHistory } from '@/components/ActivityHistory';
import { translations, Language } from '@/lib/translations';
import Image from 'next/image';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'token' | 'locker'>('token');
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'pt', 'fr'].includes(browserLang)) {
      setLang(browserLang as Language);
    }
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!mounted) return null;

  const t = translations[lang];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30 font-inter">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-5 flex justify-between items-center bg-black/90 backdrop-blur-2xl border-b border-white/20 shadow-2xl">
        <div 
          className="flex items-center gap-3 group cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="relative w-10 h-10 shadow-[0_0_15px_rgba(245,158,11,0.3)] rounded-lg overflow-hidden border border-white/10">
            <Image 
              src="/logo.png" 
              alt="OrbitBase Logo" 
              fill 
              className="object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white">
            ORBIT<span className="text-zinc-500 font-medium tracking-tight">BASE</span>
          </span>
        </div>

        <div className="flex items-center gap-8">
          {/* Language Selector */}
          <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-white/30 shadow-2xl">
            {(['es', 'en', 'pt', 'fr'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${
                  lang === l 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <ConnectButton chainStatus="icon" />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-52 pb-32 px-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[5%] w-[60%] h-[80%] bg-amber-500/[0.2] blur-[160px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 right-[5%] w-[50%] h-[70%] bg-blue-600/[0.12] blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-zinc-900 border-2 border-white/30 mb-12 shadow-2xl cursor-help">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-white">
              {t.hero.tag}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 leading-[0.9] drop-shadow-2xl">
            {t.hero.title}<br />
            <span className="text-amber-500 relative inline-block mt-4 filter drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              {t.hero.subtitle}
            </span>
          </h1>
          
          <p className="max-w-xl mx-auto text-base md:text-lg text-zinc-400 font-semibold mb-16 leading-relaxed tracking-tight">
            {t.hero.desc}
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            <button 
              onClick={() => scrollToSection('activity-section')}
              className="px-14 py-6 bg-white text-black font-black text-xs uppercase tracking-[0.25em] rounded-full hover:scale-105 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.2)] active:scale-95"
            >
              {t.hero.btnExplore}
            </button>
            <button 
              onClick={() => setIsDocsModalOpen(true)}
              className="px-14 py-6 bg-amber-500 text-white font-black text-xs uppercase tracking-[0.25em] rounded-full hover:bg-amber-600 transition-all active:scale-95 shadow-[0_20px_40px_rgba(245,158,11,0.3)]"
            >
              {t.hero.btnDocs}
            </button>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide-section" className="py-40 px-6 border-y-2 border-white/20 bg-zinc-950/90 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-28">
            <h2 className="text-base font-black tracking-[0.6em] uppercase text-white mb-8 shadow-black drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{t.guide.title}</h2>
            <div className="w-56 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="group relative p-12 rounded-[3.5rem] bg-zinc-900 border-2 border-white/20 hover:border-amber-500 transition-all duration-500 hover:shadow-[0_30px_60px_rgba(245,158,11,0.1)]">
                <div className="absolute -top-8 -left-8 w-16 h-16 rounded-[1.8rem] bg-zinc-950 border-2 border-white/40 flex items-center justify-center group-hover:border-amber-500 transition-colors shadow-2xl z-10">
                  <span className="text-amber-500 font-black text-3xl">{step}</span>
                </div>
                <h3 className="text-2xl font-black mb-8 tracking-tight text-white group-hover:text-amber-500 transition-colors">{t.guide[`step${step}`].title}</h3>
                <p className="text-base text-zinc-400 leading-relaxed font-semibold">
                  {t.guide[`step${step}`].desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <section className="py-40 px-6 min-h-[900px] relative">
         <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full -z-10" />
        <div className="max-w-4xl mx-auto">
          {/* New Prominent Side-by-Side Tabs */}
          <div className="grid grid-cols-2 gap-6 mb-24 max-w-2xl mx-auto">
            <button
              onClick={() => setActiveTab('token')}
              className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 ${
                activeTab === 'token' 
                  ? 'bg-white text-black border-white shadow-[0_20px_50px_rgba(255,255,255,0.2)] scale-105' 
                  : 'bg-zinc-900/60 text-zinc-500 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-2xl">🚀</div>
              <span className="text-[14px] font-black uppercase tracking-[0.2em]">Token Factory</span>
            </button>
            <button
              onClick={() => setActiveTab('locker')}
              className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 ${
                activeTab === 'locker' 
                  ? 'bg-amber-500 text-white border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.3)] scale-105' 
                  : 'bg-zinc-900/60 text-zinc-500 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="text-2xl">🔒</div>
              <span className="text-[14px] font-black uppercase tracking-[0.2em]">Liquidity Locker</span>
            </button>
          </div>

          <div className="flex justify-center transition-all duration-700">
            {activeTab === 'token' ? <CreateTokenForm lang={lang} /> : <LiquidityLockerForm lang={lang} />}
          </div>
        </div>
      </section>

      <section id="activity-section" className="py-40 px-6 bg-zinc-950/80 border-t-2 border-white/20 shadow-[0_-30px_60px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto">
          <ActivityHistory lang={lang} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t-2 border-white/20 bg-black shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="flex flex-col items-center md:items-start gap-8">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shadow-lg shadow-amber-500/30 rounded-lg overflow-hidden border border-white/10">
                <Image src="/logo.png" alt="OrbitBase" fill className="object-contain" />
              </div>
              <span className="font-black text-3xl tracking-tighter text-white">ORBIT<span className="text-zinc-600 font-medium">BASE</span></span>
            </div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">
              © 2026 ORBITBASE | {lang === 'es' ? 'INFRAESTRUCTURA PARA BASE' : lang === 'pt' ? 'INFRAESTRUTURA PARA BASE' : lang === 'fr' ? 'INFRASTRUCTURE POUR BASE' : 'INFRASTRUCTURE FOR BASE'}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-12">
            <a 
              href="https://www.infotechlatam.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center md:items-end gap-4"
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600 group-hover:text-amber-500 transition-colors">
                POR
              </span>
              <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl hover:scale-105 transition-all duration-500 border-4 border-white">
                <div className="relative w-48 h-12">
                  <Image 
                    src="/infotech-logo.png" 
                    alt="Infotech LATAM" 
                    fill 
                    className="object-contain p-2"
                  />
                </div>
              </div>
            </a>
          </div>
        </div>
      </footer>

      {/* Documentation Modal */}
      {isDocsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-[#080808] border-2 border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 scrollbar-hide">
              {/* Close Button */}
              <button 
                onClick={() => setIsDocsModalOpen(false)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all z-10"
              >
                ✕
              </button>

              <div className="p-12 md:p-20">
                <header className="mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
                     <span className="w-2 h-2 rounded-full bg-amber-500" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Documentación Técnica</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-[0.9]">
                    Infraestructura de<br />
                    <span className="text-amber-500">Lanzamiento Élite.</span>
                  </h2>
                  <p className="text-lg text-zinc-400 font-semibold leading-relaxed tracking-tight max-w-xl">
                    OrbitBase proporciona herramientas de nivel institucional para el ecosistema de la red Base.
                  </p>
                </header>

                <div className="space-y-20">
                   {/* Table Specs */}
                   <div className="overflow-hidden rounded-[2.5rem] border-2 border-white/10 bg-zinc-900/40 shadow-2xl">
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-white/10">
                          <tr>
                            <td className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Red Primaria</td>
                            <td className="py-8 px-10 font-bold text-amber-500 uppercase tracking-widest text-xs">Base Mainnet (L2)</td>
                          </tr>
                          <tr>
                            <td className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Factory Address</td>
                            <td className="py-8 px-10 font-mono text-[11px] text-zinc-400 break-all leading-relaxed">
                              {process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x513bE1590769cd7e2596825AeAcf5D6a6Fb4E57d'}
                            </td>
                          </tr>
                          <tr>
                           <td className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Locker Address</td>
                            <td className="py-8 px-10 font-mono text-[11px] text-zinc-400 break-all leading-relaxed">
                              {process.env.NEXT_PUBLIC_LOCKER_ADDRESS || '0x851584f94cbAA49B3f934B4eE8fc198ADb3c0BBf'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Comisión</td>
                            <td className="py-8 px-10 font-black text-2xl text-white">0.02 ETH <span className="text-[10px] text-zinc-500 font-medium ml-2 uppercase tracking-widest">Flat Fee</span></td>
                          </tr>
                          <tr>
                             <td className="py-8 px-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Seguridad</td>
                             <td className="py-8 px-10">
                               <span className="px-5 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/30">Contratos Auditados & Inmutables</span>
                             </td>
                          </tr>
                        </tbody>
                      </table>
                   </div>

                   {/* Features Section */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="p-10 rounded-[2.5rem] bg-zinc-900/60 border-2 border-white/10">
                         <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Token Factory</h3>
                         <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
                            Despliegue instantáneo de Standard Tokens y Memecoins. Contratos optimizados para gas e inmutabilidad absoluta.
                         </p>
                      </div>
                      <div className="p-10 rounded-[2.5rem] bg-zinc-900/60 border-2 border-white/10">
                         <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Liquidity Locker</h3>
                         <p className="text-sm text-zinc-400 leading-relaxed font-semibold">
                            Protección contra Rug-pulls. Permite bloquear tokens LP con fechas de desbloqueo garantizadas por smart contracts.
                         </p>
                      </div>
                   </div>

                   {/* Footer Info */}
                   <div className="p-12 rounded-[3rem] bg-amber-500/5 border-2 border-amber-500/20 text-center">
                      <p className="text-amber-500 font-black text-sm uppercase tracking-widest mb-4">¿Preguntas Técnicas?</p>
                      <p className="text-zinc-500 text-xs font-semibold">Toda nuestra infraestructura está diseñada para operar de forma descentralizada y transparente en la red Base.</p>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
