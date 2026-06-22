export const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

export const dateTime = (value: unknown) => value ? new Date(String(value)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export const titleCase = (value: string) =>
  value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (match) => match.toUpperCase());
