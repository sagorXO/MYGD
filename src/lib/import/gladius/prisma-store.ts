// CatalogStore backed by Prisma (used inside one transaction by scripts/import-gladius.ts).
import type { Prisma } from "@prisma/client";
import type { CatalogStore } from "./apply";

export function prismaCatalogStore(tx: Prisma.TransactionClient): CatalogStore {
  return {
    async upsertCategory(c) {
      const cur = await tx.category.findUnique({ where: { slug: c.slug } });
      if (!cur) {
        // nameDE/nameGR are required columns; translations don't exist in Gladius.
        const created = await tx.category.create({ data: { slug: c.slug, name: c.name, nameDE: "", nameGR: "", sortOrder: c.sortOrder } });
        return { id: created.id, change: "created" };
      }
      if (cur.name === c.name && cur.sortOrder === c.sortOrder) return { id: cur.id, change: "unchanged" };
      await tx.category.update({ where: { id: cur.id }, data: { name: c.name, sortOrder: c.sortOrder } });
      return { id: cur.id, change: "updated" };
    },
    async upsertProduct(p, categoryId) {
      const cur = await tx.product.findUnique({ where: { sku: p.sku } });
      if (!cur) {
        const created = await tx.product.create({
          data: { sku: p.sku, name: p.name, basePrice: p.basePrice, vatCategory: p.vatCategory, categoryId, sortOrder: p.sortOrder },
        });
        return { id: created.id, change: "created", previousPrice: null };
      }
      const curBasePrice = Number(cur.basePrice);
      const same = cur.name === p.name && curBasePrice === p.basePrice && cur.vatCategory === p.vatCategory && cur.categoryId === categoryId;
      if (same) return { id: cur.id, change: "unchanged", previousPrice: curBasePrice };
      // isAvailable (sold-out state) is operational data: never overwritten by an import.
      await tx.product.update({ where: { id: cur.id }, data: { name: p.name, basePrice: p.basePrice, vatCategory: p.vatCategory, categoryId } });
      return { id: cur.id, change: "updated", previousPrice: curBasePrice };
    },
    async upsertModifierGroup(g) {
      const cur = await tx.modifierGroup.findUnique({ where: { slug: g.slug } });
      const data = { name: g.name, minSelected: g.minSelected, maxSelected: g.maxSelected, isRequired: g.isRequired, sortOrder: g.sortOrder };
      if (!cur) return { id: (await tx.modifierGroup.create({ data: { slug: g.slug, ...data } })).id, change: "created" };
      const same = (Object.keys(data) as (keyof typeof data)[]).every((k) => cur[k] === data[k]);
      if (same) return { id: cur.id, change: "unchanged" };
      await tx.modifierGroup.update({ where: { id: cur.id }, data });
      return { id: cur.id, change: "updated" };
    },
    async upsertModifier(m, modifierGroupId) {
      const cur = await tx.modifier.findUnique({ where: { modifierGroupId_slug: { modifierGroupId, slug: m.slug } } });
      const data = { name: m.name, priceAdjustment: m.priceAdjustment, sortOrder: m.sortOrder };
      if (!cur) return { id: (await tx.modifier.create({ data: { modifierGroupId, slug: m.slug, ...data } })).id, change: "created" };
      if (cur.name === data.name && Number(cur.priceAdjustment) === data.priceAdjustment && cur.sortOrder === data.sortOrder) {
        return { id: cur.id, change: "unchanged" };
      }
      await tx.modifier.update({ where: { id: cur.id }, data });
      return { id: cur.id, change: "updated" };
    },
    async linkProductModifierGroup(productId, modifierGroupId, sortOrder) {
      const cur = await tx.productModifierGroup.findUnique({ where: { productId_modifierGroupId: { productId, modifierGroupId } } });
      if (cur) return { change: "unchanged" };
      await tx.productModifierGroup.create({ data: { productId, modifierGroupId, sortOrder } });
      return { change: "created" };
    },
    async audit(entry) {
      await tx.auditLog.create({ data: { action: entry.action, details: JSON.stringify(entry.details), severity: "INFO" } });
    },
  };
}
