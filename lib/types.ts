export type Risk = "high" | "watch" | "healthy" | "overstock";
export type Action = "Increase production" | "Hold production" | "Maintain / reassess" | "Reduce future production" | "Expedite components" | "Secure components" | "Delay promotion" | "Increase distributor allocation" | "Monitor";
export interface Sku { id: string; name: string; onHand: number; weeklyDemand: number; leadWeeks: number; safetyWeeks: number; netPrice: number; yoy: number; nextRunHeadroom: number | null; owner: string; }
export interface BusinessEvent { id: string; skuId: string; kind: "promotion" | "launch" | "momentum" | "softening" | "seasonality" | "lead-time"; label: string; day: number; durationDays: number; uplift: number; confirmed: boolean; }
export interface ProductionOrder { id: string; skuId: string; units: number; etaDay: number; originalEtaDay: number; status: "Confirmed" | "Delayed"; }
export interface HistoryRow { skuId: string; weekOffset: number; actual: number; priorForecast: number; }
export interface ScenarioInput { uplift: number; leadWeeks: number; shrink: number; incomingUnits: number; plannedUnits: number; promotionEnabled: boolean; promotionDay: number; promotionDuration: number; promotionUplift: number; distributorEnabled: boolean; distributorDay: number; distributorUplift: number; }
