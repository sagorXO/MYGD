'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Printer, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderConfirmationScreenProps {
  orderNumber?: string;
  estimatedWaitMinutes?: number;
  onStartNewOrder?: () => void;
  autoResetSeconds?: number;
}

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  orderNumber = 'EMBA-20260815-1423-047',
  estimatedWaitMinutes = 8,
  onStartNewOrder = () => window.location.href = '/',
  autoResetSeconds = 12,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(autoResetSeconds);
  const circumference = 2 * Math.PI * 46; // radius = 46

  useEffect(() => {
    if (timeLeft <= 0) {
      onStartNewOrder();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStartNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onStartNewOrder]);

  const progressOffset = circumference - (timeLeft / autoResetSeconds) * circumference;

  return (
    <div className="w-full min-h-screen bg-[#121212] flex items-center justify-center p-4">
      {/* Portrait Kiosk Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] min-h-[820px] bg-[#1A1A1A] rounded-[36px] border border-[#2D2D2D] p-8 flex flex-col justify-between relative shadow-2xl overflow-hidden font-sans text-white select-none"
      >
        {/* Subtle Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#4CAF50]/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header with Glowing Checkmark */}
        <header className="flex flex-col items-center text-center mt-2 z-10">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full bg-[#172E1B] border-2 border-[#4CAF50] flex items-center justify-center shadow-[0_0_30px_rgba(76,175,80,0.5)] mb-5"
          >
            <CheckCircle2 className="w-10 h-10 text-[#4CAF50] stroke-[2.5]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[28px] font-black tracking-tight uppercase text-white font-['Space_Grotesk']"
          >
            ORDER CONFIRMED!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm font-medium text-[#9E9E9E] mt-1 font-['Inter']"
          >
            Thank you for ordering with <span className="text-white font-semibold">MY GERMAN DÖNER</span>
          </motion.p>
        </header>

        {/* 2. Order Ticket Badge & Wait Estimation */}
        <section className="flex flex-col gap-3 my-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative bg-[#242424] border border-[#333333] rounded-2xl p-6 flex flex-col items-center text-center shadow-lg"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-2 font-['Inter']">
              Your Order Number
            </span>

            <div className="font-['JetBrains_Mono'] text-[34px] sm:text-[38px] font-extrabold text-[#FF5722] tracking-wider leading-none py-1 drop-shadow-md">
              {orderNumber}
            </div>

            <div className="w-full h-px border-t border-dashed border-[#3A3A3A] my-4" />

            <div className="flex items-center gap-2 text-white/90 text-base font-semibold font-['Inter']">
              <Clock className="w-5 h-5 text-[#FF5722]" />
              <span>
                Estimated wait: <strong className="text-white font-bold">~{estimatedWaitMinutes} minutes</strong>
              </span>
            </div>
          </motion.div>

          {/* Receipt Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-[#242424]/90 border border-[#333333] rounded-xl py-3 px-4 flex items-center justify-center gap-3 text-[#9E9E9E] text-sm font-medium"
          >
            <Printer className="w-4 h-4 text-[#9E9E9E]" />
            <span className="flex items-center gap-1.5 font-['Inter']">
              Receipt printing...
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722] animate-ping" />
              </span>
            </span>
          </motion.div>
        </section>

        {/* 3. Circular Countdown Progress Ring */}
        <section className="flex flex-col items-center justify-center my-2 z-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#333333"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#FF5722"
                strokeWidth="7"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={(1 - timeLeft / autoResetSeconds) * (2 * Math.PI * 44)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">New order</span>
              <span className="text-xl font-black text-white font-['JetBrains_Mono']">{timeLeft}s</span>
            </div>
          </div>
        </section>

        {/* 4. Start New Order CTA */}
        <footer className="mt-2 z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartNewOrder}
            className="w-full py-4 px-6 bg-[#FF5722] hover:bg-[#E64A19] active:bg-[#D84315] rounded-2xl font-black text-white text-lg tracking-wider uppercase shadow-[0_8px_24px_rgba(255,87,34,0.35)] flex items-center justify-center gap-3 transition-colors font-['Space_Grotesk']"
          >
            <span>START NEW ORDER</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        </footer>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationScreen;
