import type { Product } from "./types";

export function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "-";
  return price.toLocaleString("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function badgeClass(type: Product["origin"] | Product["availability_status"]) {
  switch (type) {
    case "Ukraine":
      return "bg-emerald-100 text-emerald-800";
    case "Abroad":
      return "bg-amber-100 text-amber-800";
    case "available":
      return "bg-emerald-100 text-emerald-800";
    case "unavailable":
      return "bg-rose-100 text-rose-800";
    case "pending":
      return "bg-blue-100 text-blue-800";
    case "unknown":
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export function statusLabel(type: Product["availability_status"]) {
  switch (type) {
    case "available":
      return "Available";
    case "unavailable":
      return "Not found";
    case "pending":
      return "Checking...";
    case "unknown":
    default:
      return "Not checked";
  }
}

export function originLabel(type: Product["origin"]) {
  switch (type) {
    case "Ukraine":
      return "Ukraine";
    case "Abroad":
      return "Abroad";
    case "Unknown":
    default:
      return "Unknown";
  }
}
