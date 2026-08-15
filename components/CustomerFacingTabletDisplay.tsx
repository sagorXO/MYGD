'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  Receipt, 
  Check, 
  Flame,
  Percent
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
  spiceLevel?: string;
}

interface CustomerFacingTabletDisplayProps {
  storeName?: string;
  terminalId?: string;
  items?: OrderItem[];
  currencySymbol?: string;
  vatRate?: number;
  onTipSelect?: (tipAmount: number, tipLabel: string) => void;
}

const DEFAULT_ITEMS: OrderItem[] = [
  {
    id: 'item-1',
    name: 'Classic Döner Kebap',
    price: 7.50,
    quantity: 1,
    modifiers: ['Garlic Herb Sauce', 'Mild Spice', 'Extra Halloumi (+€1.50)'],
    spiceLevel: 'Mild',
  },
  {
    id: 'item-2',
    name: 'Crispy Fries (Large)',
    price: 3.50,
    quantity: 1,
    modifiers: ['Berlin Paprika Salt', 'Curry Mayo Dip'],
  },
  {
    id: 'item-3',
    name: 'Ayran 250ml',
    price: 2.50,
    quantity: 1,
    modifiers: ['Chilled Traditional Yogurt Drink'],
  },
];

export const CustomerFacingTabletDisplay: React.FC<CustomerFacingTabletDisplayProps> = ({
  storeName = 'MY GERMAN DÖNER · THE ORIGINAL BERLIN KEBAB',
  terminalId = 'POS-01 · EMBA',
  items = DEFAULT_ITEMS,
  currencySymbol = '€',
  vatRate = 0.19, // 19% Cyprus VAT
  onTipSelect,
}) => {
  const [selectedTip, setSelectedTip] = useState<{ rate: number; label: string; amount: number }>({
    rate: 0.15,
    label: '15%',
    amount: 2.02,
  });

  // Calculate Subtotal & Taxes
  const grossTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const netSubtotal = grossTotal / (1 + vatRate);
  const vatAmount = grossTotal - netSubtotal;
  const finalTotalWithTip = grossTotal + selectedTip.amount;

  const tipOptions = [
    { label: 'No Tip', rate: 0, amount: 0 },
    { label: '10%', rate: 0.10, amount: Number((grossTotal * 0.10).toFixed(2)) },
    { label: '15%', rate: 0.15, amount: Number((grossTotal * 0.15).toFixed(2)) },
    { label: '20%', rate: 0.20, amount: Number((grossTotal * 0.20).toFixed(2)) },
    { label: 'Custom', rate: -1, amount: 0 },
  ];

  const handleTipClick = (opt: typeof tipOptions[0]) => {
    setSelectedTip({
      rate: opt.rate,
      label: opt.label,
      amount: opt.amount,
    });
    if (onTipSelect) {
      onTipSelect(opt.amount, opt.label);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#101010] p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans antialiased select-none">
      {/* Tablet Landscape Frame (16:10 / 16:9 Aspect) */}
      <div className="w-full max-w-[1240px] bg-[#1A1A1A] rounded-[28px] border border-[#2D2D2D] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Ambient Backlight Highlights */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#FF5722]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#E5A93C]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ------------------------------------------------------------- */}
        {/* LEFT PANEL: 60% Width Live Itemized Bill                      */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full md:w-[60%] p-6 lg:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#2A2A2A] relative z-10">
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5722] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,87,34,0.4)]">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h1 className="text-white text-base lg:text-lg font-black tracking-wider uppercase font-['Space_Grotesk'] flex items-center gap-2">
                    {storeName}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#2D2D2D] text-[#E5A93C] font-mono font-normal">
                      🇩🇪
                    </span>
                  </h1>
                  <p className="text-xs text-[#8E8E8E] font-['Inter'] flex items-center gap-2">
                    <span>Customer Display</span>
                    <span>•</span>
                    <span className="text-[#4CAF50] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
                      Live Sync ({terminalId})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Live Itemized Bill Header */}
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#737373] mt-5 mb-3 px-1 font-['Inter']">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Live Order Items ({items.length})
              </span>
              <span>Amount</span>
            </div>

            {/* Scrollable / Live Item List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="p-3.5 rounded-2xl bg-[#222222] border border-[#2E2E2E] flex items-start justify-between gap-4 hover:border-[#3E3E3E] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#2A2A2A] text-white font-bold text-xs flex items-center justify-center font-mono">
                          {item.quantity}×
                        </span>
                        <span className="text-white font-bold text-sm lg:text-base font-['Space_Grotesk']">
                          {item.name}
                        </span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-[#9E9E9E] font-['Inter'] pl-8 leading-relaxed">
                          {item.modifiers.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-white font-black text-sm lg:text-base font-['JetBrains_Mono']">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Financial Breakdown */}
          <div className="mt-6 pt-5 border-t border-[#2A2A2A] space-y-3">
            <div className="flex justify-between text-xs lg:text-sm text-[#8E8E8E] font-['Inter']">
              <span>Subtotal (Net Excl. VAT)</span>
              <span className="font-mono text-white/90">{currencySymbol}{netSubtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-xs lg:text-sm text-[#8E8E8E] font-['Inter']">
              <span className="flex items-center gap-1">
                19% Cyprus VAT (Included)
                <span className="text-[10px] px-1.5 py-0.2 bg-[#2D2D2D] text-[#4CAF50] rounded font-semibold">
                  CY TAX
                </span>
              </span>
              <span className="font-mono text-white/90">{currencySymbol}{vatAmount.toFixed(2)}</span>
            </div>

            {selectedTip.amount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex justify-between text-xs lg:text-sm text-[#E5A93C] font-['Inter'] font-medium"
              >
                <span>Gratuity Tip ({selectedTip.label})</span>
                <span className="font-mono">+{currencySymbol}{selectedTip.amount.toFixed(2)}</span>
              </motion.div>
            )}

            {/* Big Signal Orange Total Due */}
            <div className="pt-3 border-t border-[#333333] flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#888888] font-['Inter'] block">
                  Total Due
                </span>
                <span className="text-[11px] text-[#5A5A5A] font-medium font-['Inter']">
                  All taxes & fees included
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl lg:text-4xl xl:text-5xl font-black text-[#FF5722] font-['JetBrains_Mono'] tracking-tight drop-shadow-[0_2px_12px_rgba(255,87,34,0.35)]">
                  {currencySymbol}{finalTotalWithTip.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT PANEL: 40% Width Payment, Tip & Loyalty                 */}
        {/* ------------------------------------------------------------- */}
        <div className="w-full md:w-[40%] bg-[#151515] p-6 lg:p-8 flex flex-col justify-between relative z-10">
          
          {/* Payment Terminal Animation Block */}
          <div className="space-y-4">
            <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-2xl p-5 text-center relative overflow-hidden shadow-inner">
              {/* Radar Wave Pulse */}
              <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#FF5722]/20 animate-ping" />
                <div className="relative w-14 h-14 rounded-full bg-[#2A2A2A] border border-[#FF5722] flex items-center justify-center text-[#FF5722] shadow-[0_0_20px_rgba(255,87,34,0.4)]">
                  <CreditCard className="w-7 h-7" />
                </div>
              </div>

              <h2 className="text-white font-extrabold text-sm lg:text-base tracking-wide uppercase font-['Space_Grotesk']">
                TAP OR INSERT CARD / PHONE
              </h2>
              <p className="text-xs text-[#8E8E8E] mt-1 font-['Inter']">
                Contactless NFC • Apple Pay • Google Pay • Chip & PIN
              </p>

              {/* Supported Badges */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#2A2A2A]">
                <span className="px-2 py-1 bg-[#121212] border border-[#333333] rounded-md text-[11px] text-[#D4D4D4] font-semibold flex items-center gap-1">
                   Pay
                </span>
                <span className="px-2 py-1 bg-[#121212] border border-[#333333] rounded-md text-[11px] text-[#D4D4D4] font-semibold flex items-center gap-1">
                  G Pay
                </span>
                <span className="px-2 py-1 bg-[#121212] border border-[#333333] rounded-md text-[11px] text-[#D4D4D4] font-semibold flex items-center gap-1">
                  VISA
                </span>
                <span className="px-2 py-1 bg-[#121212] border border-[#333333] rounded-md text-[11px] text-[#D4D4D4] font-semibold flex items-center gap-1">
                  Mastercard
                </span>
              </div>
            </div>

            {/* Quick Tip Selection Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#737373] px-1 font-['Inter']">
                <span className="flex items-center gap-1 text-[#D4D4D4]">
                  <Sparkles className="w-3.5 h-3.5 text-[#E5A93C]" />
                  Add a Gratuity Tip
                </span>
                <span className="text-[11px] text-[#888888] lowercase">optional</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {tipOptions.map((opt) => {
                  const isSelected = selectedTip.label === opt.label;
                  return (
                    <motion.button
                      key={opt.label}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleTipClick(opt)}
                      className={`py-2 px-2 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#FF5722] text-white font-bold border-2 border-[#FF5722] shadow-[0_0_16px_rgba(255,87,34,0.4)]'
                          : 'bg-[#222222] text-[#A0A0A0] hover:text-white border border-[#333333] hover:border-[#444444]'
                      }`}
                    >
                      <span className="text-xs font-extrabold font-['Space_Grotesk'] leading-tight">
                        {opt.label}
                      </span>
                      {opt.amount > 0 && (
                        <span className={`text-[10px] font-mono leading-tight ${isSelected ? 'text-white/90' : 'text-[#777777]'}`}>
                          €{opt.amount.toFixed(2)}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Loyalty QR Code Box */}
            <div className="bg-[#1F1F1F] border border-[#2E2E2E] rounded-2xl p-4 flex items-center gap-4">
              {/* QR Code Container */}
              <div className="w-18 h-18 bg-white p-2 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md">
                <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
                  {/* Outer Frame QR simulation */}
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="25" height="25" fill="#1A1A1A" />
                  <rect x="15" y="15" width="15" height="15" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="#FF5722" />

                  <rect x="65" y="10" width="25" height="25" fill="#1A1A1A" />
                  <rect x="70" y="15" width="15" height="15" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="#FF5722" />

                  <rect x="10" y="65" width="25" height="25" fill="#1A1A1A" />
                  <rect x="15" y="70" width="15" height="15" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="#FF5722" />

                  {/* QR Pattern dots */}
                  <rect x="42" y="15" width="6" height="6" fill="#1A1A1A" />
                  <rect x="52" y="20" width="6" height="6" fill="#1A1A1A" />
                  <rect x="42" y="32" width="16" height="6" fill="#1A1A1A" />
                  <rect x="20" y="45" width="60" height="6" fill="#1A1A1A" />
                  <rect x="65" y="55" width="25" height="6" fill="#1A1A1A" />
                  <rect x="45" y="65" width="10" height="25" fill="#1A1A1A" />
                  <rect x="65" y="75" width="20" height="10" fill="#1A1A1A" />
                </svg>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E5A93C] flex items-center gap-1 font-['Inter']">
                  <Percent className="w-3 h-3" />
                  MYGD Döner Club
                </span>
                <h4 className="text-white font-extrabold text-sm font-['Space_Grotesk'] leading-tight">
                  Scan for 10% Points
                </h4>
                <p className="text-xs text-[#8E8E8E] font-['Inter'] leading-tight">
                  Earn <strong className="text-white font-bold">14 pts</strong> on this meal towards free döner.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Offline Guarantee Footer */}
          <div className="pt-4 mt-4 border-t border-[#242424] flex items-center justify-between text-[11px] text-[#666666]">
            <span className="flex items-center gap-1.5 text-[#4CAF50] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              EMV Level 2 Certified Terminal
            </span>
            <span>CY-POS M4</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerFacingTabletDisplay;
