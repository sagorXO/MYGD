'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Banknote, 
  CreditCard, 
  Wifi, 
  QrCode, 
  Check, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from 'lucide-react';

export type PaymentMethodType = 'cash' | 'card' | 'contactless' | 'qr';

export interface PaymentOption {
  id: PaymentMethodType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface PaymentMethodScreenProps {
  totalAmount?: number;
  currencySymbol?: string;
  itemCount?: number;
  vatRatePercent?: number;
  initialMethod?: PaymentMethodType;
  onBack?: () => void;
  onConfirmPayment?: (selectedMethod: PaymentMethodType, amount: number) => Promise<void> | void;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'cash',
    title: 'CASH',
    subtitle: 'Pay at Counter',
    icon: Banknote,
    description: 'Pay with coins/notes at counter'
  },
  {
    id: 'card',
    title: 'CARD',
    subtitle: 'Credit / Debit',
    icon: CreditCard,
    description: 'Insert or swipe chip card'
  },
  {
    id: 'contactless',
    title: 'CONTACTLESS',
    subtitle: 'Apple / Google Pay',
    icon: Wifi,
    description: 'Tap phone, watch, or contactless card'
  },
  {
    id: 'qr',
    title: 'QR CODE',
    subtitle: 'PayPal / TWINT',
    icon: QrCode,
    description: 'Scan dynamic QR on kiosk'
  }
];

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({
  totalAmount = 25.59,
  currencySymbol = '€',
  itemCount = 3,
  vatRatePercent = 19,
  initialMethod = 'card',
  onBack = () => window.history.back(),
  onConfirmPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(initialMethod);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const formattedAmount = `${currencySymbol}${totalAmount.toFixed(2)}`;
  const vatAmount = (totalAmount * (vatRatePercent / (100 + vatRatePercent))).toFixed(2);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (onConfirmPayment) {
        await onConfirmPayment(selectedMethod, totalAmount);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Fallback default transition
        window.location.href = '/order-confirmation';
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#121212] flex items-center justify-center p-4">
      {/* Portrait Kiosk Canvas */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[440px] min-h-[860px] bg-[#1A1A1A] rounded-[36px] border border-[#2D2D2D] p-7 flex flex-col justify-between relative shadow-2xl overflow-hidden font-sans text-white select-none"
      >
        {/* Subtle Ambient Brand Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-72 bg-[#FF5722]/12 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Section */}
        <header className="relative z-10 flex items-center justify-between pt-1 pb-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            className="w-12 h-12 rounded-full bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center text-white hover:bg-[#333333] transition-colors shadow-md"
            aria-label="Back to Cart Review"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </motion.button>

          <h1 className="text-xl font-bold tracking-wide uppercase text-white font-['Space_Grotesk']">
            CHOOSE PAYMENT
          </h1>

          <div className="px-3 py-1.5 rounded-full bg-[#242424] border border-[#333333] text-xs font-mono text-[#9E9E9E] font-bold">
            STEP 4/4
          </div>
        </header>

        {/* 2. Total Amount Display Card */}
        <section className="relative z-10 my-2">
          <div className="w-full bg-[#242424] rounded-[24px] border border-[#333333] py-6 px-4 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9E9E9E] mb-1 font-['Space_Grotesk']">
              TOTAL AMOUNT
            </p>
            <div className="text-[52px] leading-tight font-extrabold text-[#FF5722] tracking-tight drop-shadow-[0_2px_14px_rgba(255,87,34,0.35)] font-['Space_Grotesk']">
              {formattedAmount}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#4CAF50]" />
              <p className="text-xs text-[#9E9E9E] font-medium">
                {itemCount} items • Incl. {vatRatePercent}% Cyprus VAT ({currencySymbol}{vatAmount})
              </p>
            </div>
          </div>
        </section>

        {/* 3. 2x2 Payment Method Grid */}
        <section className="relative z-10 my-3 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = selectedMethod === option.id;
              const Icon = option.icon;

              return (
                <motion.button
                  key={option.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedMethod(option.id)}
                  className={`
                    relative rounded-[20px] p-5 flex flex-col items-center justify-center min-h-[155px] text-center transition-all duration-200
                    ${isSelected 
                      ? 'bg-[#2A2A2A] border-2 border-[#FF5722] shadow-[0_0_25px_rgba(255,87,34,0.45),inset_0_0_12px_rgba(255,87,34,0.12)]' 
                      : 'bg-[#2A2A2A] border-2 border-[#3A3A3A] hover:border-[#555555]'
                    }
                  `}
                >
                  {/* Selected Active Check Badge */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FF5722] flex items-center justify-center shadow-md"
                      >
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Icon Container */}
                  <div className="w-14 h-14 rounded-2xl bg-[#1F1F1F] flex items-center justify-center mb-3 text-white">
                    <Icon className="w-8 h-8 stroke-[1.8]" />
                  </div>

                  {/* Label */}
                  <span className="text-base font-extrabold uppercase text-white tracking-wide font-['Space_Grotesk']">
                    {option.title}
                  </span>
                  
                  {/* Subtitle */}
                  <span className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-[#FF8A65] font-semibold' : 'text-[#9E9E9E]'}`}>
                    {option.subtitle}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* 4. Bottom Action Button */}
        <footer className="relative z-10 pt-2 pb-1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isProcessing}
            onClick={handleConfirm}
            className="w-full bg-[#FF5722] hover:bg-[#F4511E] disabled:opacity-75 active:scale-[0.98] text-white font-extrabold text-lg py-5 px-6 rounded-2xl shadow-[0_8px_30px_rgba(255,87,34,0.35)] flex items-center justify-center gap-3 transition-all uppercase tracking-wider font-['Space_Grotesk'] cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-white" />
                <span>CONNECTING PINPAD...</span>
              </>
            ) : (
              <>
                <span>CONFIRM PAYMENT</span>
                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
              </>
            )}
          </motion.button>

          {/* Security Indicator */}
          <div className="mt-4 flex items-center justify-between text-xs text-[#757575] font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4CAF50]" />
              <span>TERMINAL SECURE</span>
            </div>
            <button 
              type="button" 
              onClick={onBack} 
              className="text-[#9E9E9E] hover:text-white underline cursor-pointer"
            >
              Modify Order
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
