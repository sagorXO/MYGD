"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { CategoryDTO, ProductDTO, CreateOrderResponse } from "@/types";
import { useKioskStore } from "@/store/kioskStore";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import { KioskHeader } from "@/components/kiosk/KioskHeader";
import { CategoryBar } from "@/components/kiosk/CategoryBar";
import { ProductGrid } from "@/components/kiosk/ProductGrid";
import { CustomizationModal } from "@/components/kiosk/CustomizationModal";
import { CartReviewScreen } from "@/components/kiosk/CartReviewScreen";
import { PaymentScreen } from "@/components/kiosk/PaymentScreen";
import { OrderConfirmationScreen } from "@/components/kiosk/OrderConfirmationScreen";
import { AttractScreen } from "@/components/kiosk/AttractScreen";
import { InactivityModal } from "@/components/kiosk/InactivityModal";
import { AdminModal } from "@/components/admin/AdminModal";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ScreenState = "ATTRACT" | "MENU" | "CART" | "PAYMENT" | "CONFIRMATION";

export default function KioskPage() {
  const { locationSlug, resetKioskSession, recordInteraction } = useKioskStore();
  const { items, addItem, getItemCount, getTotal, clearCart } = useCartStore();
  const { locale } = useLocaleStore();
  const dict = getDictionary(locale);

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("ATTRACT");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);

  // Customization & Admin Modals
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [latestOrderResponse, setLatestOrderResponse] = useState<CreateOrderResponse | null>(null);

  // Fetch Menu from Local SQLite Database
  const fetchMenuCatalog = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch(`/api/menu?location=${locationSlug}`);
      const data = await res.json();
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories);
        setActiveCategoryId((prev) => prev || data.categories[0].id);
      }
    } catch (err) {
      console.error("Failed to load menu catalog:", err);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [locationSlug]);

  useEffect(() => {
    fetchMenuCatalog();
  }, [fetchMenuCatalog]);

  // Global touch listener to keep activity timer fresh
  useEffect(() => {
    const handleUserActivity = () => {
      recordInteraction();
    };

    window.addEventListener("pointerdown", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [recordInteraction]);

  // Dietary Filter State (ALL, POPULAR, VEGGIE, SPICY)
  const [activeDietFilter, setActiveDietFilter] = useState<string>("ALL");

  // Active Category Products filtered by dietary choice
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const baseProducts = activeCategory?.products || [];
  const currentProducts = baseProducts.filter((p) => {
    if (activeDietFilter === "ALL") return true;
    if (activeDietFilter === "POPULAR") return p.badge === "POPULAR" || p.badge === "CHEF_CHOICE";
    if (activeDietFilter === "VEGGIE") return p.badge === "VEGGIE" || p.name.toLowerCase().includes("falafel") || p.name.toLowerCase().includes("veggie");
    if (activeDietFilter === "SPICY") return p.badge === "SPICY" || (p.description?.toLowerCase().includes("chili") ?? false);
    return true;
  });

  const handleOpenCustomize = (product: ProductDTO) => {
    recordInteraction();
    setSelectedProduct(product);
    setIsCustomizationOpen(true);
  };

  const handleAddToCart = (configuredItem: Parameters<typeof addItem>[0]) => {
    recordInteraction();
    addItem(configuredItem);
  };

  const totalItems = getItemCount();
  const totalPrice = getTotal();

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A1A] text-white">
      {/* Screen 1: Attract / Welcome Screen */}
      {currentScreen === "ATTRACT" && (
        <AttractScreen
          onStartOrder={() => {
            setCurrentScreen("MENU");
          }}
        />
      )}

      {/* Screens 2-5: Main Kiosk Application Flow */}
      {currentScreen !== "ATTRACT" && (
        <>
          {/* Top Sticky Header */}
          <KioskHeader
            currentScreen={currentScreen}
            onOpenCart={() => setCurrentScreen("CART")}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onNavigateHome={() => {
              if (items.length === 0) {
                resetKioskSession();
                setCurrentScreen("ATTRACT");
              } else {
                setCurrentScreen("MENU");
              }
            }}
          />

          {/* Screen 2: Menu Catalog Screen */}
          {currentScreen === "MENU" && (
            <main className="flex-1 flex flex-col">
              {/* Category Pills Navigation & Dietary Filter Matrix */}
              <CategoryBar
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                activeDietFilter={activeDietFilter}
                onSelectDietFilter={setActiveDietFilter}
              />

              {/* 2-Column Responsive Product Grid */}
              <ProductGrid
                products={currentProducts}
                onCustomize={handleOpenCustomize}
                isLoading={isLoadingMenu}
              />

              {/* Persistent Bottom Cart Bar (if items exist) */}
              {totalItems > 0 && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="fixed bottom-0 left-0 right-0 z-30 bg-[#1F1F21]/95 backdrop-blur-md border-t border-[#333336] p-4 flex justify-center shadow-2xl"
                >
                  <div className="max-w-3xl w-full flex items-center justify-between gap-4">
                    {/* Cart Summary */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#2B2B2E] border border-[#3A3A3E] flex items-center justify-center text-[#E50D7E] shadow">
                        <ShoppingBag size={22} />
                      </div>
                      <div>
                        <span className="font-display font-black text-base text-white block leading-tight">
                          {totalItems} {totalItems === 1 ? dict.menu.itemInCart : dict.menu.itemsInCart}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {formatEuro(totalPrice, locale)}
                        </span>
                      </div>
                    </div>

                    {/* View Cart Button */}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        recordInteraction();
                        setCurrentScreen("CART");
                      }}
                      className="py-3.5 px-6 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-base flex items-center gap-2 shadow-xl glow-magenta transition-all"
                    >
                      <span>{dict.menu.viewCart}</span>
                      <ChevronRight size={18} className="stroke-[3]" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </main>
          )}

          {/* Screen 3: Cart Review Screen */}
          {currentScreen === "CART" && (
            <CartReviewScreen
              onBackToMenu={() => setCurrentScreen("MENU")}
              onProceedToPayment={() => setCurrentScreen("PAYMENT")}
            />
          )}

          {/* Screen 4: Payment Method Selection */}
          {currentScreen === "PAYMENT" && (
            <PaymentScreen
              onBackToCart={() => setCurrentScreen("CART")}
              onPaymentSuccess={(orderRes) => {
                setLatestOrderResponse(orderRes);
                setCurrentScreen("CONFIRMATION");
              }}
            />
          )}

          {/* Screen 5: Order Confirmation Screen */}
          {currentScreen === "CONFIRMATION" && latestOrderResponse && (
            <OrderConfirmationScreen
              orderResponse={latestOrderResponse}
              onStartNewOrder={() => {
                clearCart();
                resetKioskSession();
                setCurrentScreen("ATTRACT");
              }}
            />
          )}
        </>
      )}

      {/* Product Customization Bottom Sheet Modal */}
      <CustomizationModal
        product={selectedProduct}
        isOpen={isCustomizationOpen}
        onClose={() => {
          setIsCustomizationOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />

      {/* Inactivity Auto-Reset Watchdog Modal (only active during active ordering sessions) */}
      {currentScreen !== "ATTRACT" && (
        <InactivityModal
          onSessionReset={() => {
            setCurrentScreen("ATTRACT");
          }}
        />
      )}

      {/* Staff & Manager PIN Gate Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshMenu={fetchMenuCatalog}
      />
    </div>
  );
}
