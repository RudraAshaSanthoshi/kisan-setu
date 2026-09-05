import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names cleanly without duplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency amount into Indian Rupees (INR) format.
 * Example: 113750 -> ₹1,13,750
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats weight in quintals with precision.
 */
export function formatQuintals(quintals: number): string {
  return `${quintals.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Qtl`;
}
