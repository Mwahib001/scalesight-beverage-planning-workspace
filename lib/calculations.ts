import { dateLabel, events, history, incomingFor, orders, priorityIds, settings, skus, units, pct } from "../data/planning";
import type { Action, ScenarioInput, Sku } from "./types";

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
export function performance(sku: Sku, weeks = 13) {
  const rows = history.filter(h => h.skuId === sku.id && h.weekOffset >= -weeks);
  const actual = sum(rows.map(r => r.actual));
  const forecast = sum(rows.map(r => r.priorForecast));
  const error = actual ? sum(rows.map(r => Math.abs(r.actual - r.priorForecast))) / actual : 0;
  const bias = actual ? (forecast - actual) / actual : 0;
  const last = rows.slice(-3);
  const review = last.length === 3 && (last.every(r => (r.priorForecast-r.actual)/r.actual >= .10) || last.every(r => (r.priorForecast-r.actual)/r.actual <= -.10));
  return { rows, actual, forecast, error, bias, status: review ? "Review" : Math.abs(bias) <= .05 ? "On track" : "Watch" };
}
export function baseline(sku: Sku, uplift = 0, leadWeeks = sku.leadWeeks, shrink = settings.shrink, incoming = incomingFor(sku)) {
  const demand = sku.weeklyDemand * (1 + uplift);
  const usable = sku.onHand * (1 - shrink);
  const usableCover = usable / demand;
  const required = Math.max(0, demand * (leadWeeks + sku.safetyWeeks) - usable - incoming);
  return { demand, usable, cover: sku.onHand / demand, usableCover, safety: demand * sku.safetyWeeks, safetyDay: Math.round((usableCover - sku.safetyWeeks) * 7), stockoutDay: Math.round(usableCover * 7), required, capital: Math.round(required * settings.unitCost / 100) * 100 };
}
export function demandAt(sku: Sku, day: number, input?: ScenarioInput, includeEvents = true) {
  let demand = sku.weeklyDemand * (1 + (input?.uplift ?? 0));
  if (!includeEvents) return demand / 7;
  if (input) {
    if (input.promotionEnabled && day >= input.promotionDay && day < input.promotionDay + input.promotionDuration * 7) demand *= 1 + input.promotionUplift;
    if (input.distributorEnabled && day >= input.distributorDay) demand *= 1 + input.distributorUplift;
  } else {
    for (const event of events.filter(e => e.skuId === sku.id && (e.kind === "promotion" || e.kind === "launch"))) {
      if (day >= event.day && day < event.day + event.durationDays) demand *= 1 + event.uplift;
    }
    if (events.some(e => e.skuId === sku.id && e.kind === "seasonality")) demand *= Math.max(.5, 1 - Math.floor(day / 7) * settings.seasonalFadePerWeek);
  }
  return demand / 7;
}
export function demandTotal(sku: Sku, days: number, input?: ScenarioInput, includeEvents = true) {
  return sum(Array.from({ length: Math.ceil(days) }, (_, day) => demandAt(sku, day, input, includeEvents) * Math.min(1, days - day)));
}
export function forecast(sku: Sku) {
  const error = performance(sku, 13).error;
  return Array.from({ length: settings.horizonWeeks }, (_, week) => {
    const base = sum(Array.from({ length: 7 }, (_, d) => demandAt(sku, week * 7 + d)));
    const width = Math.max(.06, error) + week * .012;
    return { day: week * 7, label: dateLabel(week * 7), baseline: sku.weeklyDemand, base, low: base * (1 - width), high: base * (1 + width), range: [base * (1 - width), base * (1 + width)], width };
  });
}
// Daily integration of weekly demand gives exact fractional crossings; display dates round once.
// Incoming goods are available at the start of their ETA day. Unmet demand is lost, not backlogged.
export function projection(sku: Sku, input?: ScenarioInput, includeEvents = true, days = settings.horizonWeeks * 7) {
  const shrink = input?.shrink ?? settings.shrink;
  let inventory = sku.onHand * (1 - shrink);
  let firstStockout: number | null = null;
  let firstSafety: number | null = null;
  const receipts = input ? [
    { etaDay: orders.find(o => o.skuId === sku.id)?.etaDay ?? 14, units: Math.max(0, input.incomingUnits) },
    { etaDay: input.leadWeeks * 7, units: Math.max(0, input.plannedUnits) },
  ] : orders.filter(o => o.skuId === sku.id);
  const daily = Array.from({ length: Math.ceil(days) }, (_, day) => {
    inventory += sum(receipts.filter(o => o.etaDay === day).map(o => o.units));
    const demand = demandAt(sku, day, input, includeEvents);
    const safety = demand * 7 * sku.safetyWeeks;
    if (firstSafety === null && inventory - demand <= safety) firstSafety = day + Math.max(0, (inventory - safety) / demand);
    if (firstStockout === null && inventory <= demand) firstStockout = day + inventory / demand;
    const served = Math.min(demand, inventory);
    const shortage = demand - served;
    inventory = Math.max(0, inventory - demand);
    return { day, demand, served, shortage, inventory, safety, revenue: served * sku.netPrice };
  });
  const lead = input?.leadWeeks ?? sku.leadWeeks;
  const horizon = (lead + sku.safetyWeeks) * 7;
  const funded = sum(receipts.filter(r => r.etaDay <= horizon).map(r => r.units));
  const required = Math.max(0, demandTotal(sku, horizon, input, includeEvents) - sku.onHand * (1-shrink) - funded);
  return { daily, stockoutDay: firstStockout === null ? null : Math.round(firstStockout), safetyDay: firstSafety === null ? null : Math.round(firstSafety), required, capital: Math.round((required + (input?.plannedUnits ?? 0)) * settings.unitCost / 100) * 100, shortage: sum(daily.map(d => d.shortage)) };
}
export function skuPlan(sku: Sku) {
  const base = baseline(sku);
  const projected = projection(sku);
  const pending = events.some(e => e.skuId === sku.id && e.day >= 0 && ["launch", "promotion"].includes(e.kind) && e.confirmed);
  const risk = base.required > 0 ? "high" : base.cover > 10 ? pending ? "watch" : "overstock" : "healthy";
  const action: Action = risk === "high" ? sku.nextRunHeadroom !== null ? "Increase production" : "Secure components" : risk === "watch" ? "Maintain / reassess" : risk === "overstock" ? "Reduce future production" : "Hold production";
  const recommended = Math.round(Math.min(projected.required, sku.nextRunHeadroom ?? Infinity) / 100) * 100;
  const remaining = Math.max(0, projected.required - recommended);
  const priority = priorityIds.indexOf(sku.id) + 1;
  const deadlineDay = priority > 0 ? Math.min(priority + 1, 4) : 6;
  const launch = events.find(e => e.skuId === sku.id && e.kind === "launch");
  const promo = events.find(e => e.skuId === sku.id && e.kind === "promotion");
  const explanation = sku.nextRunHeadroom !== null
    ? `Recommend +${units(recommended)} units on the next run, pending co-packer capacity and can/component confirmation. Total requirement ${units(projected.required)}; remaining ~${units(remaining)} units to plan on the following run or once capacity is confirmed.`
    : launch ? `Hold production and reassess before the distributor launch on ${dateLabel(launch.day)} (in ${launch.day / 7} weeks), with ${pct(launch.uplift)} launch uplift. Recent weakness alone is not a reason to cut the baseline.`
    : promo ? `Secure cartons and cans before full promotion spend on ${dateLabel(promo.day)}. Event-adjusted need ${units(projected.required)} units; next run approximately ${units(recommended)}. Cover ${base.cover.toFixed(1)}w versus ${sku.leadWeeks}w co-packer lead time. Review campaign timing if supply cannot arrive sooner.`
    : risk === "overstock" ? `Reduce future production. ${base.cover.toFixed(1)} weeks of baseline cover and seasonal tail-off tie up finished-goods capital; no confirmed upcoming demand event.`
    : `Hold production. Existing finished goods and confirmed incoming orders cover the lead-time and safety horizon. Monitor the next order ETA.`;
  const signal = events.find(e => e.skuId === sku.id && ["momentum", "softening", "promotion", "seasonality"].includes(e.kind));
  return { sku, base, projected, risk, action, recommended, remaining, priority, deadlineDay, explanation, evidenceStrength: risk === "high" ? "Needs review" : pending ? "Moderate" : "Strong", signal: signal ? `${signal.label}${signal.kind === "momentum" || signal.kind === "softening" ? ` (${pct(signal.uplift)} vs plan)` : ` • ${dateLabel(signal.day)}`}` : "Wholesale orders on track; monitor incoming production" };
}
export const plans = skus.map(skuPlan);
export const priorities = priorityIds.map(id => plans.find(p => p.sku.id === id)!);
export const portfolio = { inventory: sum(skus.map(s => s.onHand)), weeklyDemand: sum(skus.map(s => s.weeklyDemand)), incoming: sum(orders.map(o => o.units)), statuses: { high: plans.filter(p => p.risk === "high").length, healthy: plans.filter(p => p.risk === "healthy").length, watch: plans.filter(p => p.risk === "watch").length, overstock: plans.filter(p => p.risk === "overstock").length } };
export function revenue(days: number) {
  const series = Array.from({ length: Math.ceil(days/7) }, (_, week) => {
    const fraction = Math.min(7, days - week * 7) / 7;
    const values = skus.map(s => ({ s, f: forecast(s)[week] }));
    return { label: dateLabel(week*7), base: sum(values.map(v => v.f.base*v.s.netPrice))*fraction, low: sum(values.map(v => v.f.low*v.s.netPrice))*fraction, high: sum(values.map(v => v.f.high*v.s.netPrice))*fraction };
  });
  const previous = sum(skus.map(s => sum(history.filter(h => h.skuId === s.id && h.weekOffset >= -Math.ceil(days/7)).map(h => h.actual * s.netPrice * Math.min(1, Math.max(0, days / 7 + h.weekOffset + 1))))));
  return { series, base: sum(series.map(s => s.base)), low: sum(series.map(s => s.low)), high: sum(series.map(s => s.high)), previous, constrained: sum(skus.map(s => sum(projection(s).daily.slice(0, days).map(d => d.revenue)))) };
}
export const componentsFor = (sku: Sku) => {
  const p = skuPlan(sku);
  return { materials: "Cans, liquid/base, cartons and labels", status: p.risk === "high" ? "Unconfirmed" : "Covered", owner: "Supply chain lead", next: p.risk === "high" ? p.explanation : "Monitor confirmed component coverage; no new component commitment required." };
};
export const signals = [
  ...priorities.map(p => ({ id: `priority-${p.priority}`, skuId: p.sku.id, group: "Needs decision", signal: p.signal, threshold: p.risk === "high" ? "Required production > 0" : p.risk === "watch" ? "Cover > 10w with confirmed event" : "Cover > 10w without confirmed event", status: "Open", detectedDay: 0, priority: p.priority, action: p.action, why: p.explanation })),
  ...events.filter(e => ["launch", "lead-time"].includes(e.kind)).map(e => ({ id: e.id, skuId: e.skuId, group: "Watch", signal: `${e.label}: ${e.kind === "lead-time" ? `${skus[0].leadWeeks}w → ${skus[3].leadWeeks}w` : `${dateLabel(e.day)}, ${pct(e.uplift)}`}`, threshold: "Confirmed business event changes the baseline interpretation", status: "Watching", detectedDay: 0, priority: 0, action: "Monitor" as Action, why: "Recheck event timing and co-packer capacity with the client before the next cycle." })),
  ...plans.filter(p => performance(p.sku).status === "Review").map(p => ({ id: `review-${p.sku.id}`, skuId: p.sku.id, group: "Watch", signal: "Forecast requires review", threshold: "Same-direction forecast bias ≥ 10% for three consecutive weeks", status: "Watching", detectedDay: 0, priority: 0, action: "Maintain / reassess" as Action, why: "Explain the variance, refresh the baseline, and check the next weekly actuals." })),
  ...orders.filter(o => o.status === "Delayed").map(o => ({ id: o.id, skuId: o.skuId, group: "Monitored - no action", signal: `Incoming production delayed ${(o.etaDay-o.originalEtaDay)/7} week; ETA ${dateLabel(o.etaDay)}`, threshold: "ETA moved; remains before projected safety breach", status: "Monitored", detectedDay: 0, priority: 0, action: "Monitor" as Action, why: "Low impact: existing finished goods cover the revised arrival date." })),
];
export const updateLog = [
  { day: 0, text: `${skus[0].name} baseline raised to ${units(skus[0].weeklyDemand)}/week after three consecutive weeks about ${pct(events[0].uplift)} above prior plan.`, state: "Applied" },
  { day: settings.reviewDay, text: `${skus[3].name} promotion overlay ${pct(events[3].uplift)} for ${dateLabel(events[3].day)}; analyst validation scheduled.`, state: "Scheduled review" },
  { day: 0, text: `${skus[2].name} distributor launch overlay starts ${dateLabel(events[2].day)}.`, state: "Applied" },
];
