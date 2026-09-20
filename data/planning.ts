import historyData from "./history.json";
import type { BusinessEvent, HistoryRow, ProductionOrder, ScenarioInput, Sku } from "../lib/types";

export const AS_OF = "2026-09-07";
export const settings = { shrink: 0.02, unitCost: 4.5, historyMonths: 18, historyWeeks: 78, horizonWeeks: 13, reviewDay: 2, promotionLow: .25, promotionHigh: .35, seasonalFadePerWeek: .025, contactEmail: "" };
export const account = "Harbor Coast Beverages";
export const disclaimer = "DEMO DATA / Synthetic Example. Harbor Coast Beverages is a fictional company; all figures are illustrative and do not represent any real customer. Forecasts are planning ranges, not guarantees.";
export const skus: Sku[] = [
  { id: "citrus-vodka-soda", name: "Citrus Vodka Soda", onHand: 4800, weeklyDemand: 1140, leadWeeks: 5, safetyWeeks: 1.2, netPrice: 8.5, yoy: .12, nextRunHeadroom: 1800, owner: "Operations lead" },
  { id: "lime-vodka-soda", name: "Lime Vodka Soda", onHand: 7200, weeklyDemand: 920, leadWeeks: 5, safetyWeeks: 1.2, netPrice: 8.25, yoy: 0, nextRunHeadroom: null, owner: "Operations lead" },
  { id: "berry-vodka-soda", name: "Berry Vodka Soda", onHand: 10300, weeklyDemand: 930, leadWeeks: 5, safetyWeeks: 1.2, netPrice: 8.5, yoy: -.05, nextRunHeadroom: null, owner: "Sales lead" },
  { id: "variety-8-pack", name: "Variety 8-Pack", onHand: 3700, weeklyDemand: 1030, leadWeeks: 6, safetyWeeks: 1.2, netPrice: 9, yoy: 0, nextRunHeadroom: null, owner: "Supply chain lead" },
  { id: "variety-12-pack", name: "Variety 12-Pack", onHand: 8100, weeklyDemand: 1050, leadWeeks: 5, safetyWeeks: 1.2, netPrice: 9.5, yoy: 0, nextRunHeadroom: null, owner: "Operations lead" },
  { id: "seasonal-summer-pack", name: "Seasonal Summer Pack", onHand: 6900, weeklyDemand: 650, leadWeeks: 5, safetyWeeks: 1.2, netPrice: 8, yoy: 0, nextRunHeadroom: null, owner: "Commercial lead" },
];
export const events: BusinessEvent[] = [
  { id: "citrus-momentum", skuId: skus[0].id, kind: "momentum", label: "Demand above prior plan for three consecutive weeks", day: -21, durationDays: 21, uplift: .18, confirmed: true },
  { id: "berry-softening", skuId: skus[2].id, kind: "softening", label: "Recent demand below prior plan", day: -28, durationDays: 28, uplift: -.17, confirmed: true },
  { id: "berry-launch", skuId: skus[2].id, kind: "launch", label: "Distributor launch", day: 35, durationDays: 91, uplift: .30, confirmed: true },
  { id: "variety-promotion", skuId: skus[3].id, kind: "promotion", label: "Confirmed promotion", day: 21, durationDays: 28, uplift: .30, confirmed: true },
  { id: "variety-lead", skuId: skus[3].id, kind: "lead-time", label: "Co-packer lead time increased", day: 0, durationDays: 0, uplift: 0, confirmed: true },
  { id: "seasonal-fade", skuId: skus[5].id, kind: "seasonality", label: "Seasonal tail-off; no upcoming demand event", day: 0, durationDays: 91, uplift: -settings.seasonalFadePerWeek, confirmed: true },
];
export const orders: ProductionOrder[] = [
  { id: "PO-101", skuId: skus[3].id, units: 1000, etaDay: 14, originalEtaDay: 14, status: "Confirmed" },
  { id: "PO-102", skuId: skus[1].id, units: 1500, etaDay: 21, originalEtaDay: 14, status: "Delayed" },
  { id: "PO-103", skuId: skus[4].id, units: 1200, etaDay: 21, originalEtaDay: 21, status: "Confirmed" },
];
export const history = historyData as HistoryRow[];
export const priorityIds = [skus[0].id, skus[2].id, skus[3].id, skus[5].id];
export const monitoringRules = ["Demand variance", "Inventory coverage", "Event readiness", "Production lead time", "Incoming order timing", "Forecast review"];
export const routes = [
  ["/", "Weekly Planning Brief"], ["/revenue-forecast", "Revenue Forecast"], ["/demand-forecast", "Demand Forecast"], ["/inventory-production", "Inventory & Production"], ["/sku-planning", "SKU Planning"], ["/scenario-planning", "Scenario Planning"], ["/forecast-vs-actual", "Forecast vs Actual"], ["/intelligence-center", "Intelligence Center"], ["/assumptions", "Assumptions"], ["/executive-brief", "Executive Planning Brief"], ["/managed-intelligence", "Managed Intelligence"],
] as const;
export const dateAt = (days: number) => new Date(Date.parse(`${AS_OF}T00:00:00Z`) + Math.round(days) * 86400000).toISOString().slice(0, 10);
export const dayOffset = (date: string) => Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${AS_OF}T00:00:00Z`)) / 86400000);
export const dateLabel = (days: number, year = false) => new Date(`${dateAt(days)}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" as const } : {}), timeZone: "UTC" });
export const planningWeek = `${dateLabel(0)}–${new Date(`${dateAt(6)}T00:00:00Z`).getUTCDate()}, ${new Date(`${AS_OF}T00:00:00Z`).getUTCFullYear()}`;
export const units = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
export const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const percent = (n: number) => `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n * 100)}%`;
export const pct = (n: number) => `${n > 0 ? "+" : ""}${percent(n)}`;
export const incomingFor = (sku: Sku) => orders.filter(o => o.skuId === sku.id).reduce((n, o) => n + o.units, 0);
export function defaultScenario(sku: Sku): ScenarioInput {
  const promo = events.find(e => e.kind === "promotion")!;
  const launch = events.find(e => e.kind === "launch")!;
  return { uplift: .25, leadWeeks: sku.leadWeeks, shrink: settings.shrink, incomingUnits: incomingFor(sku), plannedUnits: 0, promotionEnabled: false, promotionDay: promo.day, promotionDuration: promo.durationDays / 7, promotionUplift: promo.uplift, distributorEnabled: sku.id === launch.skuId, distributorDay: launch.day, distributorUplift: launch.uplift };
}
