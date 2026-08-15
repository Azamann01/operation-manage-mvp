import type { Prisma } from "@prisma/client";

export const UK_VAT_RATE = 0.2;

type MoneyInput = number | string | Prisma.Decimal | null | undefined;

export function formatGBP(amount: MoneyInput): string {
  const value = amount == null ? 0 : Number(amount);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export function calculateVat(price: MoneyInput, vatExempt = false): number {
  if (vatExempt || price == null) return 0;
  return Number(price) * UK_VAT_RATE;
}

export function calculateTotal(price: MoneyInput, vatExempt = false): number {
  const base = price == null ? 0 : Number(price);
  return base + calculateVat(base, vatExempt);
}
