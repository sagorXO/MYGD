'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  MapPin, 
  Printer, 
  Users, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Server, 
  Monitor, 
  Lock, 
  Bell, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight,
  ShieldCheck,
  Check,
  Percent,
  RefreshCw,
  Power
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
  quantityRemaining: string;
  lowStockAlert: boolean;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  marginPercent: number;
  demandStatus: 'High Demand' | 'Steady' | 'Normal' | 'Low';
  icon: string;
}

export interface HardwareStatus {
  id: string;
  name: string;
  type: 'printer' | 'kiosk' | 'pos';
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  detail: string;
}

export interface StoreManagerAdminDashboardProps {
  initialStoreName?: string;
  initialManagerName?: string;
  grossSales?: number;
  totalOrders?: number;
  vatCollected?: number;
  avgPrepTimeSeconds?: number;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Beef Skewer (Rotisserie A)', category: 'Meat', inStock: true, quantityRemaining: '14.2 kg', lowStockAlert: false },
  { id: 'inv-2', name: 'Chicken Skewer (Rotisserie B)', category: 'Meat', inStock: true, quantityRemaining: '8.5 kg', lowStockAlert: false },
  { id: 'inv-3', name: 'Falafel Mix', category: 'Vegetarian', inStock: true, quantityRemaining: '45 portions', lowStockAlert: false },
  { id: 'inv-4', name: 'Halloumi Slices', category: 'Cheese', inStock: true, quantityRemaining: '6 portions left', lowStockAlert: true },
  { id: 'inv-5', name: 'House Garlic Kräuter Sauce', category: 'Sauces', inStock: true, quantityRemaining: '12.0 L', lowStockAlert: false },
  { id: 'inv-6', name: 'Fresh Red Cabbage & Tomatoes', category: 'Salad', inStock: true, quantityRemaining: '18.5 kg', lowStockAlert: false },
];

const TOP_PRODUCTS: TopProduct[] = [
  { id: 'p-1', name: 'Classic Döner (Bread)', category: 'Döner & Kebaps', unitsSold: 88, revenue: 704.00, marginPercent: 72, demandStatus: 'High Demand', icon: '🥙' },
  { id: 'p-2', name: 'Döner Spezial (Extra Sauce)', category: 'Döner & Kebaps', unitsSold: 54, revenue: 513.00, marginPercent: 68, demandStatus: 'High Demand', icon: '🌯' },
  { id: 'p-3', name: 'Berlin Fries (Curry Sauce)', category: 'Sides', unitsSold: 92, revenue: 322.00, marginPercent: 81, demandStatus: 'Steady', icon: '🍟' },
  { id: 'p-4', name: 'Ayran (250ml)', category: 'Drinks', unitsSold: 65, revenue: 130.00, marginPercent: 78, demandStatus: 'Normal', icon: '🥛' },
];

const HARDWARE_DEVICES: HardwareStatus[] = [
  { id: 'hw-1', name: 'Star Micronics Kitchen CloudPRNT', type: 'printer', ipAddress: '192.168.1.104', status: 'ONLINE', detail: 'Paper Roll 85% · Latency 12ms' },
  { id: 'hw-2', name: 'Front POS Receipt Printer', type: 'printer', ipAddress: '192.168.1.105', status: 'ONLINE', detail: 'Paper Roll 92% · USB Connected' },
  { id: 'hw-3', name: 'Kiosk Terminal 01 (Lobby Touch)', type: 'kiosk', ipAddress: '192.168.1.110', status: 'ONLINE', detail: 'Verifone P400 Connected' },
  { id: 'hw-4', name: 'Kiosk Terminal 02 (Lobby Express)', type: 'kiosk', ipAddress: '192.168.1.111', status: 'ONLINE', detail: 'Verifone P400 Connected' },
  { id: 'hw-5', name: 'Kiosk Terminal 03 (Drive-thru)', type: 'kiosk', ipAddress: '192.168.1.112', status: 'ONLINE', detail: 'Verifone P400 Connected' },
];

const HOURLY_METRICS = [
  { hour: '10:00', sales: 120, orders: 9 },
  { hour: '11:00', sales: 210, orders: 16 },
  { hour: '12:00', sales: 480, orders: 38 },
  { hour: '13:00', sales: 520, orders: 41 },
  { hour: '14:00', sales: 390, orders: 30 },
  { hour: '15:00', sales: 180, orders: 14 },
  { hour: '16:00', sales: 220, orders: 17 },
  { hour: '17:00', sales: 310, orders: 24 },
  { hour: '18:00', sales: 490, orders: 39 },
  { hour: '19:00', sales: 560, orders: 44 },
  { hour: '20:00', sales: 380, orders: 29 },
  { hour: '21:00', sales: 210, orders: 16 },
  { hour: '22:00', sales: 95, orders: 7 },
];

export const StoreManagerAdminDashboard: React.FC<StoreManagerAdminDashboardProps> = ({
  initialStoreName = 'Emba Store #01',
  initialManagerName = 'Marco S.',
  grossSales = 2845.50,
  totalOrders = 218,
  vatCollected = 454.33,
  avgPrepTimeSeconds = 312,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'hardware'>('overview');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleInventory = (id: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.inStock;
          showToast(`${item.name} is now ${nextState ? 'IN STOCK' : '86 / OUT OF STOCK (Synced to Kiosks)'}`);
          return { ...item, inStock: nextState };
        }
        return item;
      })
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const maxSalesVal = Math.max(...HOURLY_METRICS.map((d) => d.sales));

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white flex flex-col items-center justify-start p-4 font-sans select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-50 bg-[#242424] border border-[#FF5722] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5722] animate-ping" />
            <span className="text-xs font-mono font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container 1440x900 Style Card */}
      <div className="w-full max-w-[1440px] bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] shadow-2xl flex flex-row overflow-hidden min-h-[860px]">
        
        {/* LEFT SIDEBAR (240px) */}
        <aside className="w-[240px] shrink-0 bg-[#161616] border-r border-[#2A2A2A] flex flex-col justify-between p-4">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 px-2 py-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5722] to-[#FF8A65] flex items-center justify-center shadow-lg shadow-[#FF5722]/30">
                <Flame className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wider text-white uppercase leading-none">MY GERMAN</h1>
                <p className="font-extrabold text-sm text-[#FF5722] tracking-wider leading-none mt-1">DÖNER HQ</p>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30 shadow-lg shadow-[#FF5722]/10'
                    : 'text-[#9E9E9E] hover:text-white hover:bg-[#222222]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Live Orders</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#EF4444] text-white rounded-full">12</span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Menu & Inventory</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all">
                <MapPin className="w-4 h-4" />
                <span>Pricing & Locations</span>
              </button>

              <button
                onClick={() => setActiveTab('hardware')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Hardware & Printers</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all">
                <Users className="w-4 h-4" />
                <span>Staff & Security</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9E9E9E] hover:text-white hover:bg-[#222222] font-medium text-sm transition-all">
                <BarChart3 className="w-4 h-4" />
                <span>Reports & VAT</span>
              </button>
            </nav>
          </div>

          {/* Shift Profile Box */}
          <div className="bg-[#1F1F1F] p-3 rounded-xl border border-[#2E2E2E]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-medium text-[#9E9E9E]">Shift Active</span>
              </div>
              <span className="text-xs font-mono text-[#E5A93C] font-semibold">06h 42m</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF5722]/20 border border-[#FF5722]/40 text-[#FF5722] font-bold text-xs flex items-center justify-center">
                  MS
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{initialManagerName}</p>
                  <p className="text-[10px] text-[#9E9E9E] leading-tight">Store Manager</p>
                </div>
              </div>
              <button title="Lock Terminal" className="text-[#9E9E9E] hover:text-white p-1 rounded hover:bg-[#2A2A2A]">
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN VIEW */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          {/* TOP HEADER BAR */}
          <header className="h-[72px] bg-[#1A1A1A] border-b border-[#2A2A2A] px-6 flex items-center justify-between shrink-0">
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#242424] px-3.5 py-1.5 rounded-xl border border-[#333333] cursor-pointer hover:border-[#FF5722] transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="text-sm font-semibold text-white">{initialStoreName}</span>
                <ChevronDown className="w-4 h-4 text-[#9E9E9E]" />
              </div>

              <div className="flex items-center gap-2 bg-[#242424] px-3.5 py-1.5 rounded-xl border border-[#333333] text-sm text-[#CCCCCC]">
                <Calendar className="w-4 h-4 text-[#E5A93C]" />
                <span className="font-medium">Today: 15 Aug 2026</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9E9E9E]" />
              </div>
            </div>

            {/* Telemetry Status */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 bg-[#1F2922] border border-[#10B981]/30 rounded-full text-xs font-medium text-[#10B981]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </span>
              <span>3 Kiosks Online · 2 POS Online · Printers OK (Star Micronics)</span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#242424] px-3 py-1.5 rounded-xl border border-[#333333]">
                <span className="text-[11px] font-mono text-[#E5A93C] font-bold">CY VAT 19%</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </div>

              <button className="relative p-2 rounded-xl bg-[#242424] border border-[#333333] text-[#9E9E9E] hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
              </button>

              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5722] to-[#E5A93C] flex items-center justify-center font-bold text-xs text-white border border-[#FF5722]">
                  MS
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-white">{initialManagerName}</p>
                  <p className="text-[10px] text-[#9E9E9E]">Store Manager</p>
                </div>
              </div>
            </div>
          </header>

          {/* DASHBOARD CONTENT BODY */}
          <main className="p-6 space-y-6 flex-1">
            
            {/* 4 TOP KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* KPI 1: Gross Sales */}
              <div className="bg-[#242424] rounded-2xl p-5 border-2 border-[#FF5722] relative overflow-hidden shadow-lg shadow-[#FF5722]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wider text-[#9E9E9E] uppercase">Today's Gross Sales</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#10B981]/20 text-[#10B981] text-xs font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +14%
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-[#FF5722] font-mono tracking-tight">€{grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                <p className="text-xs text-[#9E9E9E] mt-1.5 font-medium">+€352.10 vs last week same time</p>
              </div>

              {/* KPI 2: Total Orders */}
              <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333] hover:border-[#444444] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wider text-[#9E9E9E] uppercase">Total Orders</span>
                  <span className="text-xs font-mono text-[#CCCCCC] bg-[#1E1E1E] px-2 py-0.5 rounded">Avg: €{(grossSales / totalOrders).toFixed(2)}</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white font-mono tracking-tight">{totalOrders} Orders</h2>
                <p className="text-xs text-[#9E9E9E] mt-1.5 font-medium">124 Dine-in · 94 Takeaway / Delivery</p>
              </div>

              {/* KPI 3: Cyprus VAT */}
              <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333] hover:border-[#444444] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wider text-[#9E9E9E] uppercase">Cyprus VAT (19%)</span>
                  <span className="text-xs font-mono text-[#E5A93C] bg-[#E5A93C]/15 px-2 py-0.5 rounded font-semibold">CY Tax Sync</span>
                </div>
                <h2 className="text-3xl font-extrabold text-white font-mono tracking-tight">€{vatCollected.toFixed(2)}</h2>
                <p className="text-xs text-[#9E9E9E] mt-1.5 font-medium">Net Sales: €{(grossSales - vatCollected).toFixed(2)} · Auto-reconciled</p>
              </div>

              {/* KPI 4: Avg Prep Time */}
              <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333] hover:border-[#444444] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wider text-[#9E9E9E] uppercase">Avg Kitchen Prep</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#10B981]/20 text-[#10B981] text-xs font-bold">Optimal</span>
                </div>
                <h2 className="text-3xl font-extrabold text-[#10B981] font-mono tracking-tight">
                  {Math.floor(avgPrepTimeSeconds / 60)}m {avgPrepTimeSeconds % 60}s
                </h2>
                <p className="text-xs text-[#9E9E9E] mt-1.5 font-medium">Target &lt; 6m 00s · Kitchen Display Sync</p>
              </div>

            </div>

            {/* MAIN 2-COLUMN SECTION (60% / 40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT SECTION (60% -> 7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Hourly Sales Visualizer Card */}
                <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white">Live Hourly Sales & Order Flow</h3>
                      <p className="text-xs text-[#9E9E9E]">Real-time POS and Kiosk throughput comparison</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-[#FF5722]" />
                        <span className="text-[#CCCCCC]">Revenue (€)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full bg-[#E5A93C]" />
                        <span className="text-[#CCCCCC]">Orders</span>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Bars Visualization */}
                  <div className="h-[200px] flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-[#333333]">
                    {HOURLY_METRICS.map((metric, i) => {
                      const heightPercent = (metric.sales / maxSalesVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                          <div 
                            style={{ height: `${heightPercent}%` }} 
                            className="w-full bg-gradient-to-t from-[#FF5722]/70 to-[#FF5722] rounded-t group-hover:brightness-125 transition-all relative"
                          >
                            {/* Hover Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-[#161616] border border-[#FF5722] text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap z-20">
                              €{metric.sales} ({metric.orders} ord)
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[#888888] mt-1">{metric.hour.slice(0, 2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Selling Items Table */}
                <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-white">Top Selling Menu Items</h3>
                      <p className="text-xs text-[#9E9E9E]">Best performing products by revenue & velocity</p>
                    </div>
                    <button className="text-xs text-[#FF5722] hover:underline font-semibold">View Full Menu &rarr;</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[#9E9E9E] border-b border-[#333333]">
                          <th className="pb-2.5 font-semibold uppercase tracking-wider">Item Name</th>
                          <th className="pb-2.5 font-semibold uppercase tracking-wider">Category</th>
                          <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Units Sold</th>
                          <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Revenue</th>
                          <th className="pb-2.5 font-semibold uppercase tracking-wider text-right">Margin</th>
                          <th className="pb-2.5 font-semibold uppercase tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2E2E2E]">
                        {TOP_PRODUCTS.map((prod) => (
                          <tr key={prod.id} className="hover:bg-[#2A2A2A]/60 transition-colors">
                            <td className="py-3 flex items-center gap-2.5 font-medium text-white">
                              <span className="text-base">{prod.icon}</span>
                              <span>{prod.name}</span>
                            </td>
                            <td className="py-3 text-[#9E9E9E]">{prod.category}</td>
                            <td className="py-3 text-right font-mono font-semibold text-white">{prod.unitsSold}</td>
                            <td className="py-3 text-right font-mono font-bold text-[#FF5722]">€{prod.revenue.toFixed(2)}</td>
                            <td className="py-3 text-right font-mono text-[#10B981]">{prod.marginPercent}%</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                prod.demandStatus === 'High Demand'
                                  ? 'bg-[#FF5722]/15 text-[#FF5722]'
                                  : 'bg-[#10B981]/15 text-[#10B981]'
                              }`}>
                                {prod.demandStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT SECTION (40% -> 5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Quick Inventory 86 / Out-of-Stock Toggles */}
                <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">Quick Inventory (86 Toggles)</h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded font-bold uppercase">Live POS Sync</span>
                  </div>
                  <p className="text-xs text-[#9E9E9E] mb-4">Toggle items OFF to immediately 86 them on all Kiosks & Online Menu.</p>

                  <div className="space-y-3">
                    {inventory.map((item) => (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          item.lowStockAlert 
                            ? 'bg-[#292215] border-[#E5A93C]/40' 
                            : item.inStock 
                              ? 'bg-[#1E1E1E] border-[#2E2E2E]' 
                              : 'bg-[#2A1E1E] border-[#EF4444]/40 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{item.name}</span>
                            <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                              !item.inStock
                                ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                : item.lowStockAlert
                                  ? 'bg-[#E5A93C]/20 text-[#E5A93C]'
                                  : 'bg-[#10B981]/20 text-[#10B981]'
                            }`}>
                              {!item.inStock ? '86 OUT OF STOCK' : item.lowStockAlert ? 'LOW STOCK' : 'IN STOCK'}
                            </span>
                          </div>
                          <p className={`text-[11px] mt-0.5 font-mono ${item.lowStockAlert ? 'text-[#E5A93C] font-medium' : 'text-[#9E9E9E]'}`}>
                            {item.quantityRemaining}
                          </p>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleInventory(item.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                            item.inStock ? 'bg-[#FF5722]' : 'bg-[#3A3A3A]'
                          }`}
                        >
                          <motion.div
                            animate={{ x: item.inStock ? 20 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                          >
                            {item.inStock && <Check className="w-3 h-3 text-[#FF5722]" />}
                          </motion.div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hardware & Peripheral Monitor */}
                <div className="bg-[#242424] rounded-2xl p-5 border border-[#333333]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-white">Hardware Telemetry Monitor</h3>
                    <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      All Online
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {HARDWARE_DEVICES.map((dev) => (
                      <div key={dev.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E1E1E] border border-[#2E2E2E]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] flex items-center justify-center text-[#FF5722]">
                            {dev.type === 'printer' ? <Printer className="w-4 h-4 text-[#E5A93C]" /> : <Monitor className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{dev.name}</p>
                            <p className="text-[11px] text-[#9E9E9E]">{dev.detail}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold text-[10px]">
                          100% ONLINE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    </div>
  );
};

export default StoreManagerAdminDashboard;
