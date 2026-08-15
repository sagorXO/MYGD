'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Radio,
  Sparkles
} from 'lucide-react';

export interface TVBoardOrder {
  orderNumber: string;
  status: 'PREPARING' | 'READY';
  station?: string;
  estimatedMinutes?: number;
  pickupCounter?: string;
  readyTimestamp?: string;
}

interface CustomerOrderTVBoardProps {
  storeLocation?: string;
  initialPreparingOrders?: TVBoardOrder[];
  initialReadyOrders?: TVBoardOrder[];
  soundEnabled?: boolean;
}

const DEFAULT_PREPARING: TVBoardOrder[] = [
  { orderNumber: 'EMBA-047', status: 'PREPARING', station: 'Döner Kitchen', estimatedMinutes: 2 },
  { orderNumber: 'EMBA-048', status: 'PREPARING', station: 'Grill & Toast', estimatedMinutes: 3 },
  { orderNumber: 'EMBA-049', status: 'PREPARING', station: 'Fryer & Sides', estimatedMinutes: 4 },
  { orderNumber: 'EMBA-050', status: 'PREPARING', station: 'Döner Box', estimatedMinutes: 4 },
  { orderNumber: 'EMBA-051', status: 'PREPARING', station: 'Veggie & Falafel', estimatedMinutes: 5 },
  { orderNumber: 'EMBA-052', status: 'PREPARING', station: 'Custom Combo', estimatedMinutes: 5 },
];

const DEFAULT_READY: TVBoardOrder[] = [
  { orderNumber: 'EMBA-044', status: 'READY', pickupCounter: 'Counter 1', readyTimestamp: 'Just now' },
  { orderNumber: 'EMBA-045', status: 'READY', pickupCounter: 'Counter 1', readyTimestamp: '1 min ago' },
  { orderNumber: 'EMBA-046', status: 'READY', pickupCounter: 'Counter 1', readyTimestamp: '2 min ago' },
];

export const CustomerOrderTVBoard: React.FC<CustomerOrderTVBoardProps> = ({
  storeLocation = 'EMBA, CYPRUS',
  initialPreparingOrders = DEFAULT_PREPARING,
  initialReadyOrders = DEFAULT_READY,
  soundEnabled = true,
}) => {
  const [preparingOrders, setPreparingOrders] = useState<TVBoardOrder[]>(initialPreparingOrders);
  const [readyOrders, setReadyOrders] = useState<TVBoardOrder[]>(initialReadyOrders);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAudioActive, setIsAudioActive] = useState<boolean>(soundEnabled);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Nicosia',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Chime Generator for Ready Callouts
  const playPickupChime = () => {
    if (!isAudioActive || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  return (
    <div className="h-screen w-screen bg-[#121212] text-white flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      
      {/* ================= HEADER BAR ================= */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-[#181818] rounded-2xl border border-[#2A2A2A] shadow-2xl">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#E64A19] to-[#FF7043] flex items-center justify-center shadow-lg shadow-orange-950/60">
            <Flame className="w-8 h-8 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-[#E5A93C] font-mono font-bold">
                The Original Berlin Kebab 🇩🇪
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              MY GERMAN <span className="text-[#FF5722]">DÖNER</span>
            </h1>
          </div>
        </div>

        {/* Center: Live Serving Status */}
        <div className="flex items-center gap-4 bg-[#202020] px-8 py-3 rounded-full border border-[#333333] shadow-inner">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-black uppercase tracking-wider text-white">
              NOW SERVING
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              AKTUELLE BESTELLUNGEN
            </div>
          </div>
        </div>

        {/* Right: Live Clock & Location */}
        <div className="flex items-center space-x-6 text-right">
          <button 
            onClick={() => {
              setIsAudioActive(!isAudioActive);
              if (!isAudioActive) playPickupChime();
            }}
            className="p-2.5 rounded-xl bg-[#222222] border border-[#3A3A3A] text-neutral-400 hover:text-white transition-colors"
            title={isAudioActive ? 'Sound notifications ON' : 'Sound notifications OFF'}
          >
            {isAudioActive ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <div>
            <div className="text-3xl lg:text-4xl font-mono font-extrabold tracking-wider text-white">
              {currentTime || '14:23:45'}
            </div>
            <div className="flex items-center justify-end space-x-1 text-xs font-mono uppercase tracking-widest text-[#E5A93C]">
              <MapPin className="w-3.5 h-3.5 text-[#FF5722] inline" />
              <span>{storeLocation}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN 50/50 SPLIT COLUMNS ================= */}
      <main className="flex-1 grid grid-cols-2 gap-8 my-5 min-h-0">
        
        {/* LEFT: PREPARING / IN ARBEIT (50% Column) */}
        <section className="flex flex-col bg-[#161616] rounded-3xl p-6 border border-[#2B2B2B] shadow-2xl relative overflow-hidden">
          
          {/* Amber Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black/20 rounded-lg">
                <ChefHat className="w-7 h-7 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-black">
                  PREPARING / IN ARBEIT
                </h2>
                <p className="text-xs font-bold text-black/80 tracking-wide">
                  Orders handcrafted on fresh Berlin rotisserie
                </p>
              </div>
            </div>
            <span className="bg-black/30 backdrop-blur-sm text-black font-mono font-extrabold px-3.5 py-1.5 rounded-xl text-sm border border-black/10">
              {preparingOrders.length} IN QUEUE
            </span>
          </div>

          {/* Preparing Orders 2x3 Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr">
            <AnimatePresence>
              {preparingOrders.map((order) => (
                <motion.div
                  key={order.orderNumber}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="bg-[#242424] border border-[#3A3A3A] rounded-2xl p-5 flex flex-col justify-between items-center transition-all duration-200 hover:border-amber-500/50 shadow-md"
                >
                  <div className="w-full flex justify-between items-center text-xs font-mono text-neutral-400">
                    <span className="uppercase">{order.station || 'Kitchen'}</span>
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      ~{order.estimatedMinutes || 3} min
                    </span>
                  </div>

                  <div className="text-4xl 2xl:text-5xl font-mono font-extrabold tracking-wider text-white py-2">
                    {order.orderNumber}
                  </div>

                  <div className="w-full text-center text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                    In Preparation
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT: READY FOR PICKUP / ABHOLBEREIT (50% Column) */}
        <section className="flex flex-col bg-[#161616] rounded-3xl p-6 border-2 border-[#FF5722]/50 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#FF5722]/5 to-transparent">
          
          {/* Signal Orange / Green Header */}
          <div className="bg-gradient-to-r from-[#FF5722] via-[#F4511E] to-[#E64A19] px-6 py-4 rounded-2xl shadow-xl shadow-orange-950/50 flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black/25 rounded-lg">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-white">
                  READY FOR PICKUP / ABHOLBEREIT
                </h2>
                <p className="text-xs font-bold text-white/90 tracking-wide">
                  Please proceed to the designated pickup counter
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono font-extrabold px-3.5 py-1.5 rounded-xl text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{readyOrders.length} READY</span>
            </div>
          </div>

          {/* Ready Orders Giant Stack */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            <AnimatePresence>
              {readyOrders.map((order) => (
                <motion.div
                  key={order.orderNumber}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 bg-[#1F1F1F] rounded-2xl px-8 py-5 flex items-center justify-between relative overflow-hidden border-2 border-[#FF5722] shadow-[0_0_25px_rgba(255,87,34,0.45)] transition-all"
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-5xl 2xl:text-6xl font-mono font-extrabold tracking-wider text-[#FF5722] drop-shadow-[0_0_16px_rgba(255,87,34,0.6)]">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                        Freshly Packed · Ready Now
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5722] text-white font-extrabold text-lg shadow-lg shadow-orange-950/60 uppercase tracking-wide">
                      <span>{order.pickupCounter || 'Pickup Counter 1'}</span>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 mt-1">
                      Main Counter Front
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* ================= BOTTOM TICKER / NOTICES ================= */}
      <footer className="w-full bg-[#141414] border border-[#2A2A2A] rounded-2xl py-3 px-6 overflow-hidden flex items-center shadow-xl">
        <div className="flex items-center gap-2 bg-[#222222] px-4 py-1.5 rounded-xl mr-6 border border-[#333333] shrink-0">
          <Radio className="w-4 h-4 text-[#FF5722] animate-pulse" />
          <span className="text-[#FF5722] font-bold text-sm">NOTICE:</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap relative flex-1">
          <div className="inline-block animate-[ticker_28s_linear_infinite] text-sm lg:text-base font-medium text-neutral-300 tracking-wide">
            Please have your receipt order number ready · Guten Appetit! · Fresh Berlin Rotisserie & Authentic German Döner · 100% Certified Halal Meat & Fresh Cyprus Produce · Free Customer WiFi: <span className="text-[#E5A93C] font-mono font-bold">MYGD-Guest</span> · Thank you for dining with MY GERMAN DÖNER!
          </div>
        </div>
      </footer>

    </div>
  );
};

export default CustomerOrderTVBoard;
