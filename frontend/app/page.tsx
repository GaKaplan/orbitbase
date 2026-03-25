'use client';
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateTokenForm } from "@/components/CreateTokenForm";
import { LiquidityLockerForm } from "@/components/LiquidityLockerForm";
import { ActivityHistory } from "@/components/ActivityHistory";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-24">
        {/* Header */}
        <header className="flex w-full justify-between items-center mb-24 anim-fade-in">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 transition-all hover:scale-105 duration-500 group">
              <div className="absolute inset-0 bg-[var(--primary)] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <Image
                src="/logo.png"
                alt="OrbitBase Logo"
                fill
                className="object-contain relative z-10 rounded-3xl shadow-2xl"
                priority
              />
            </div>
            <span className="text-4xl font-black tracking-tighter text-white">
              Orbit<span className="text-[var(--primary)]">Base</span>
            </span>
          </div>
          <div className="glass-card px-2 py-2 rounded-2xl">
            <ConnectButton />
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mb-32 space-y-8">
          <div className="inline-block px-4 py-1.5 glass-card rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)] mb-4">
            Built on Base Mainnet
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white max-w-4xl tracking-tight leading-[1.1]">
            <span className="text-gradient">Launchpad as a Service</span>
            <br />
            Institutional Grade.
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-zinc-400 font-medium">
            Lanza tus proyectos con seguridad de élite. OrbitBase combina la potencia de BASE con herramientas de liquidez y factory de nivel institucional.
          </p>
          <div className="flex gap-4 pt-4">
             <button 
               onClick={() => document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' })}
               className="btn-primary"
             >
               Explorar Proyectos
             </button>
             <button className="px-8 py-4 glass-card text-white font-bold hover:bg-white/10 transition-all rounded-2xl">
               Documentación
             </button>
          </div>
        </section>
        
        {/* Core Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start mb-32">
          <div className="anim-slide-up" style={{ animationDelay: '0.1s' }}>
            <CreateTokenForm />
          </div>
          <div className="anim-slide-up" style={{ animationDelay: '0.2s' }}>
            <LiquidityLockerForm />
          </div>
        </div>

        {/* Dashboard Section */}
        <section id="activity-section" className="w-full mb-32 anim-slide-up" style={{ animationDelay: '0.3s' }}>
          <ActivityHistory />
        </section>

        {/* Footer */}
        <footer className="pt-16 pb-8 border-t border-white/5 w-full flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative opacity-50">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <p>© 2026 OrbitBase. Protocolo de infraestructura para el ecosistema BASE.</p>
          </div>
          <div className="flex gap-8 font-bold uppercase tracking-widest text-[10px]">
            <a href="#" className="hover:text-[var(--primary)] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">Docs</a>
            <a href="#" className="hover:text-[var(--primary)] transition-colors">Security</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
