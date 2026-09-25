"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Search,
  Check,
  X,
  Flame,
  Leaf,
  RefreshCw,
  MessageSquare,
  Phone,
  Mail,
  Scale,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  whatsApp: string;
  email?: string;
}

interface MasterIngredient {
  id: string;
  sku: string;
  name: string;
  unit: string;
  costPerUnitEUR: number;
  supplier?: Supplier | null;
}

interface RecipeBOMItem {
  id: string;
  productId: string;
  ingredientId: string;
  amountGrams: number;
  isOptional: boolean;
  ingredient: MasterIngredient;
}

interface ProductItem {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  nameDE?: string | null;
  description?: string | null;
  basePrice: number;
  vatCategory: "FOOD_BEV" | "ALCOHOL_TOBACCO";
  badge?: string | null;
  calories?: number | null;
  allergens?: string | null;
  imageUrl?: string | null;
  isVeggie: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  recipeBoms?: RecipeBOMItem[];
}

interface CategoryGroup {
  id: string;
  name: string;
  products: ProductItem[];
}

export const MenuRecipeManager: React.FC = () => {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [allIngredients, setAllIngredients] = useState<MasterIngredient[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Product Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);

  // Recipe (BOM) Management Modal
  const [recipeProduct, setRecipeProduct] = useState<ProductItem | null>(null);
  const [currentBOMs, setCurrentBOMs] = useState<RecipeBOMItem[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState<boolean>(false);
  const [newIngredientId, setNewIngredientId] = useState<string>("");
  const [newIngredientAmount, setNewIngredientAmount] = useState<number>(100);
  const [editingBOMId, setEditingBOMId] = useState<string | null>(null);
  const [editBOMAmount, setEditBOMAmount] = useState<number>(100);

  // Supplier Contact Modal
  const [contactSupplier, setContactSupplier] = useState<Supplier | null>(null);

  // Form State for Add / Edit Product
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    nameDE: "",
    description: "",
    basePrice: 7.5,
    vatCategory: "FOOD_BEV" as "FOOD_BEV" | "ALCOHOL_TOBACCO",
    badge: "",
    calories: 550,
    allergens: "Gluten, Dairy, Sesame",
    imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
    isVeggie: false,
    isSpicy: false,
  });

  const fetchMenuData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/menu");
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
        if (data.categories.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }

      // Also fetch master ingredients
      const ingRes = await fetch("/api/admin/recipes");
      const ingData = await ingRes.json();
      if (ingData.success && Array.isArray(ingData.ingredients)) {
        setAllIngredients(ingData.ingredients);
        if (ingData.ingredients.length > 0) {
          setNewIngredientId(ingData.ingredients[0].id);
        }
      }
    } catch (err) {
      console.error("[MenuRecipeManager] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Open Recipe Modal for a Product
  const handleOpenRecipeModal = async (product: ProductItem) => {
    setRecipeProduct(product);
    setIsRecipeLoading(true);
    try {
      const res = await fetch(`/api/admin/recipes?productId=${product.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.bom)) {
        setCurrentBOMs(data.bom);
      } else {
        setCurrentBOMs([]);
      }
      if (data.allIngredients && Array.isArray(data.allIngredients)) {
        setAllIngredients(data.allIngredients);
        if (data.allIngredients.length > 0) {
          setNewIngredientId(data.allIngredients[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load recipe:", err);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // Add Ingredient to Recipe
  const handleAddIngredientToRecipe = async () => {
    if (!recipeProduct || !newIngredientId || newIngredientAmount <= 0) return;
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: recipeProduct.id,
          ingredientId: newIngredientId,
          amountGrams: newIngredientAmount,
        }),
      });
      const data = await res.json();
      if (data.success && data.bomItem) {
        // Refresh recipe list
        handleOpenRecipeModal(recipeProduct);
      } else {
        alert(data.error || "Failed to add ingredient to recipe");
      }
    } catch (err) {
      console.error("Add ingredient error:", err);
    }
  };

  // Update Ingredient Portion
  const handleUpdateBOMAmount = async (bom: RecipeBOMItem) => {
    if (!recipeProduct || editBOMAmount <= 0) return;
    try {
      const res = await fetch("/api/admin/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: recipeProduct.id,
          ingredientId: bom.ingredientId,
          amountGrams: editBOMAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingBOMId(null);
        handleOpenRecipeModal(recipeProduct);
      } else {
        alert(data.error || "Failed to update portion");
      }
    } catch (err) {
      console.error("Update portion error:", err);
    }
  };

  // Remove Ingredient from Recipe
  const handleRemoveIngredientFromRecipe = async (ingredientId: string) => {
    if (!recipeProduct) return;
    if (!confirm("Are you sure you want to remove this ingredient from this recipe?")) return;
    try {
      const res = await fetch(`/api/admin/recipes?productId=${recipeProduct.id}&ingredientId=${ingredientId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        handleOpenRecipeModal(recipeProduct);
      } else {
        alert(data.error || "Failed to remove ingredient");
      }
    } catch (err) {
      console.error("Remove ingredient error:", err);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (product: ProductItem) => {
    try {
      const newStatus = !product.isAvailable;
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "PRODUCT",
          targetId: product.id,
          isAvailable: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMenuData();
      }
    } catch (err) {
      console.error("Toggle availability error:", err);
    }
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchMenuData();
        // Reset form
        setFormData({
          categoryId: categories[0]?.id || "",
          name: "",
          nameDE: "",
          description: "",
          basePrice: 7.5,
          vatCategory: "FOOD_BEV",
          badge: "",
          calories: 550,
          allergens: "Gluten, Dairy, Sesame",
          imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
          isVeggie: false,
          isSpicy: false,
        });
      } else {
        alert(data.error || "Failed to create product");
      }
    } catch (err) {
      console.error("Create product error:", err);
    }
  };

  // Edit Product Submit
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingProduct(null);
        fetchMenuData();
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch (err) {
      console.error("Update product error:", err);
    }
  };

  // Open Edit Modal
  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      categoryId: product.categoryId,
      name: product.name,
      nameDE: product.nameDE || "",
      description: product.description || "",
      basePrice: product.basePrice,
      vatCategory: product.vatCategory,
      badge: product.badge || "",
      calories: product.calories || 500,
      allergens: product.allergens || "",
      imageUrl: product.imageUrl || "",
      isVeggie: product.isVeggie,
      isSpicy: product.isSpicy,
    });
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeletingProduct(null);
        fetchMenuData();
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  // Filter products
  const allProducts: ProductItem[] = categories.flatMap((c) => c.products);
  const filteredProducts = allProducts.filter((p) => {
    const matchesCategory = selectedCategoryId === "ALL" || p.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1F1F21] border border-[#3A3A3E] p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed size={22} className="text-[#E50D7E]" />
            <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">
              MASTER MENU & RECIPE BOM CONTROL (M2/M10)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Authoritative catalog • Gram-level portion BOMs • Live screen & POS synchronization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData({
                categoryId: categories[0]?.id || "",
                name: "",
                nameDE: "",
                description: "",
                basePrice: 7.5,
                vatCategory: "FOOD_BEV",
                badge: "",
                calories: 550,
                allergens: "Gluten, Dairy, Sesame",
                imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
                isVeggie: false,
                isSpicy: false,
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#E50D7E] hover:bg-[#c90a6e] text-white font-display font-black text-xs uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-pink-950/40 transition-all hover:scale-105"
          >
            <Plus size={16} />
            <span>Add New Menu Item</span>
          </button>

          <button
            onClick={fetchMenuData}
            className="p-2.5 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-300 hover:text-white transition-all"
            title="Refresh Catalog"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#1F1F21] border border-[#3A3A3E] p-4 rounded-2xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs font-mono">
          <button
            onClick={() => setSelectedCategoryId("ALL")}
            className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
              selectedCategoryId === "ALL"
                ? "bg-[#E50D7E] border-[#E50D7E] text-white font-black"
                : "bg-[#2B2B2E] border-[#3A3A3E] text-zinc-400 hover:text-white"
            }`}
          >
            ALL ITEMS ({allProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                selectedCategoryId === c.id
                  ? "bg-[#E50D7E] border-[#E50D7E] text-white font-black"
                  : "bg-[#2B2B2E] border-[#3A3A3E] text-zinc-400 hover:text-white"
              }`}
            >
              {c.name.split(":")[0]} ({c.products.length})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]"
          />
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-[#1F1F21] border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all shadow-xl ${
              !product.isAvailable ? "border-red-900/60 opacity-75" : "border-[#3A3A3E] hover:border-zinc-500"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-zinc-400 bg-[#2B2B2E] px-2 py-0.5 rounded">
                      {product.sku}
                    </span>
                    {product.badge && (
                      <span className="font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#E5A93C] text-black">
                        {product.badge}
                      </span>
                    )}
                    {product.isVeggie && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                        <Leaf size={10} /> VEG
                      </span>
                    )}
                    {product.isSpicy && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono text-red-400 bg-red-950/60 border border-red-800 px-1.5 py-0.5 rounded">
                        <Flame size={10} /> SPICY
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-tight mt-1.5">
                    {product.name}
                  </h3>
                  {product.nameDE && (
                    <span className="text-xs text-zinc-400 italic block">{product.nameDE}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-display font-black text-xl text-[#00FCED] block">
                    {formatEuro(product.basePrice)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    VAT: {product.vatCategory === "FOOD_BEV" ? "9%" : "19%"}
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{product.description}</p>
              )}

              {/* Status and Allergens */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2B2B2E] text-xs font-mono">
                <span className="text-zinc-500 text-[11px] truncate max-w-[170px]">
                  {product.allergens || "No listed allergens"}
                </span>

                <button
                  onClick={() => handleToggleAvailability(product)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                    product.isAvailable
                      ? "bg-emerald-950 border border-emerald-700 text-emerald-400 hover:bg-emerald-900"
                      : "bg-red-950 border border-red-700 text-red-400 hover:bg-red-900"
                  }`}
                >
                  {product.isAvailable ? "IN STOCK" : "SOLD OUT"}
                </button>
              </div>
            </div>

            {/* Action Buttons: Recipe BOM, Edit, Delete */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#3A3A3E]">
              <button
                onClick={() => handleOpenRecipeModal(product)}
                className="py-2 px-1 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-zinc-300 hover:text-[#00FCED] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                title="Manage Recipe Ingredients & BOM"
              >
                <Scale size={13} />
                <span>Recipe BOM</span>
              </button>

              <button
                onClick={() => openEditModal(product)}
                className="py-2 px-1 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-zinc-300 hover:text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                title="Edit Product Details"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setDeletingProduct(product)}
                className="py-2 px-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/60 text-red-400 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                title="Delete Product"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl p-12 text-center text-zinc-500 font-mono text-sm">
          No menu items match your search criteria.
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: MANAGE RECIPE BILL OF MATERIALS (BOM)                */}
      {/* ============================================================ */}
      {recipeProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setRecipeProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-mono text-[#00FCED] uppercase tracking-widest font-black">
                RECIPE BILL OF MATERIALS (BOM)
              </span>
              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                {recipeProduct.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure ingredient portion amounts deducted automatically per order (M3 Engine).
              </p>
            </div>

            {/* Current Recipe Ingredients List */}
            <div className="space-y-3">
              <h4 className="font-mono text-xs text-zinc-400 uppercase tracking-wider font-bold">
                Assigned Ingredients ({currentBOMs.length})
              </h4>

              {isRecipeLoading ? (
                <div className="text-center py-6 text-zinc-500 font-mono text-xs animate-pulse">
                  Loading recipe ingredients...
                </div>
              ) : currentBOMs.length === 0 ? (
                <div className="bg-[#2B2B2E] border border-dashed border-[#3A3A3E] p-6 rounded-2xl text-center text-zinc-500 text-xs font-mono">
                  No ingredients assigned yet. Add one below to enable automated inventory deductions.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentBOMs.map((bom) => (
                    <div
                      key={bom.id}
                      className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-white text-sm block">
                          {bom.ingredient.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-zinc-400 text-[11px]">
                          <span>SKU: {bom.ingredient.sku}</span>
                          <span>•</span>
                          <span>Unit: {bom.ingredient.unit}</span>
                          {bom.ingredient.supplier && (
                            <>
                              <span>•</span>
                              <span className="text-[#E5A93C]">
                                Supplier: {bom.ingredient.supplier.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Portion Amount & Edit controls */}
                      <div className="flex items-center gap-2">
                        {editingBOMId === bom.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editBOMAmount}
                              onChange={(e) => setEditBOMAmount(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 bg-[#1F1F21] border border-[#E50D7E] rounded-lg text-white text-center font-bold text-xs"
                            />
                            <button
                              onClick={() => handleUpdateBOMAmount(bom)}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Save Portion"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingBOMId(null)}
                              className="p-1 rounded-lg bg-[#3A3A3E] text-zinc-400 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#1F1F21] border border-[#3A3A3E] text-[#00FCED] font-black text-sm">
                              {bom.amountGrams} {bom.ingredient.unit}
                            </span>
                            <button
                              onClick={() => {
                                setEditingBOMId(bom.id);
                                setEditBOMAmount(bom.amountGrams);
                              }}
                              className="p-1.5 rounded-lg bg-[#3A3A3E] hover:bg-[#4A4A50] text-zinc-300 hover:text-white transition-all"
                              title="Edit Portion Weight"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}

                        {bom.ingredient.supplier && (
                          <button
                            onClick={() => setContactSupplier(bom.ingredient.supplier!)}
                            className="p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 transition-all"
                            title="Contact Ingredient Supplier"
                          >
                            <MessageSquare size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveIngredientFromRecipe(bom.ingredientId)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-white transition-all"
                          title="Remove from Recipe"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Ingredient to this Recipe */}
            <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl p-4 space-y-3">
              <h5 className="font-display font-black text-sm uppercase text-white tracking-wide flex items-center gap-1.5">
                <Plus size={16} className="text-[#00FCED]" />
                <span>Add Ingredient to Recipe</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                    Select Master Ingredient
                  </label>
                  <select
                    value={newIngredientId}
                    onChange={(e) => setNewIngredientId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1F1F21] border border-[#3A3A3E] rounded-xl text-xs text-white focus:outline-none focus:border-[#00FCED]"
                  >
                    {allIngredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) — {ing.supplier?.name || "No supplier"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                    Portion Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newIngredientAmount}
                      onChange={(e) => setNewIngredientAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#1F1F21] border border-[#3A3A3E] rounded-xl text-xs text-white focus:outline-none focus:border-[#00FCED]"
                    />
                    <button
                      onClick={handleAddIngredientToRecipe}
                      className="px-4 py-2 bg-[#00FCED] hover:bg-[#00d8cb] text-black font-display font-black text-xs uppercase rounded-xl transition-all shadow"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRecipeProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-white font-mono text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ADD / EDIT MENU ITEM                                */}
      {/* ============================================================ */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <span className="text-[10px] font-mono text-[#E50D7E] uppercase tracking-widest font-black">
                {editingProduct ? "EDIT MENU PRODUCT" : "CREATE NEW MENU PRODUCT"}
              </span>
              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                {editingProduct ? `Edit: ${editingProduct.name}` : "Add Item to Menu"}
              </h3>
            </div>

            <form
              onSubmit={editingProduct ? handleEditProductSubmit : handleCreateProduct}
              className="space-y-4 text-xs font-mono"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Category (Signage Board) *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Base Price (EUR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Product Name (EN) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Classic Berlin Döner"
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    German Name (DE)
                  </label>
                  <input
                    type="text"
                    value={formData.nameDE}
                    onChange={(e) => setFormData({ ...formData, nameDE: e.target.value })}
                    placeholder="e.g. Klassischer Berliner Döner"
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients and serving details..."
                  className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    VAT Rate (Cyprus Law)
                  </label>
                  <select
                    value={formData.vatCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, vatCategory: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  >
                    <option value="FOOD_BEV">9% Food & Soft Drink</option>
                    <option value="ALCOHOL_TOBACCO">19% Alcohol & Tobacco</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Badge / Tag
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  >
                    <option value="">None</option>
                    <option value="POPULAR">POPULAR</option>
                    <option value="NEW">NEW</option>
                    <option value="CHEF_CHOICE">CHEF CHOICE</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Allergen Tags
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="Gluten, Dairy, Sesame"
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl text-white focus:outline-none focus:border-[#E50D7E]"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVeggie}
                    onChange={(e) => setFormData({ ...formData, isVeggie: e.target.checked })}
                    className="rounded bg-[#2B2B2E] border-[#3A3A3E] text-[#10B981] focus:ring-0"
                  />
                  <span className="text-zinc-300 font-bold">Vegetarian / Vegan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                    className="rounded bg-[#2B2B2E] border-[#3A3A3E] text-red-500 focus:ring-0"
                  />
                  <span className="text-zinc-300 font-bold">Spicy Kick</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#3A3A3E]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#E50D7E] hover:bg-[#c90a6e] text-white font-display font-black text-xs uppercase tracking-wide shadow-lg shadow-pink-950/40"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: DELETE PRODUCT CONFIRMATION                         */}
      {/* ============================================================ */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1F1F21] border-2 border-red-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-700 flex items-center justify-center text-red-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                  Delete Menu Item?
                </h3>
                <span className="text-xs font-mono text-zinc-400 block">
                  {deletingProduct.name} ({deletingProduct.sku})
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              Are you sure you want to permanently delete this product? All linked recipes and BOM portions will be cleanly cascaded.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-300 font-mono text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-xs uppercase tracking-wide shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: CONTACT SUPPLIER MODAL                              */}
      {/* ============================================================ */}
      {contactSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1F1F21] border-2 border-[#25D366] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setContactSupplier(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366] flex items-center justify-center text-[#25D366]">
                <MessageSquare size={24} className="fill-[#25D366]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#25D366] uppercase tracking-widest font-black">
                  OFFICIAL SUPPLIER CONTACT
                </span>
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  {contactSupplier.name}
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#2B2B2E] p-3 rounded-xl border border-[#3A3A3E] space-y-1">
                <span className="text-zinc-400 text-[11px] block">Contact Representative:</span>
                <span className="text-white font-bold text-sm block">
                  {contactSupplier.contactName || "Commercial Orders Desk"}
                </span>
              </div>

              {/* 1-Tap WhatsApp Button */}
              <a
                href={`https://wa.me/${contactSupplier.whatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${contactSupplier.name}, this is MY GERMAN DÖNER Store 01 (Emba). We need an urgent delivery restock. Please confirm availability and ETA.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
              >
                <MessageSquare size={18} className="fill-black" />
                <span>WhatsApp: {contactSupplier.whatsApp}</span>
              </a>

              {/* Direct Phone Call Button */}
              <a
                href={`tel:${contactSupplier.whatsApp}`}
                className="w-full py-3 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-white font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <Phone size={16} className="text-[#00FCED]" />
                <span>Call Phone: {contactSupplier.whatsApp}</span>
              </a>

              {/* Email Button */}
              {contactSupplier.email && (
                <a
                  href={`mailto:${contactSupplier.email}?subject=${encodeURIComponent(
                    "MY GERMAN DÖNER - Urgent Inventory Restock Purchase Order"
                  )}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-zinc-300 font-mono text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Mail size={14} className="text-zinc-400" />
                  <span>Email: {contactSupplier.email}</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setContactSupplier(null)}
                className="w-full py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white font-mono text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
