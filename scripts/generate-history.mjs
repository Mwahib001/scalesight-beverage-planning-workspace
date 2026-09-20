// Re-run explicitly only when changing the synthetic fixture. Dates are offsets from AS_OF.
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../data/planning.ts', import.meta.url), 'utf8');
const rows = [...source.matchAll(/id: "([^"]+)", name: "[^"]+", onHand: \d+, weeklyDemand: (\d+)/g)];
let seed = 73921;
function random() { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const result = rows.flatMap(([ , skuId, demand]) => Array.from({length:78}, (_, i) => {
  const weekOffset = i - 78;
  const summer = 1 + .14 * Math.cos((weekOffset + 9) * 2 * Math.PI / 52);
  let priorForecast = Math.round(Number(demand) * summer * (.90 + i / 780));
  let actual = Math.round(priorForecast * (1 + (random() - .5) * .10));
  if (weekOffset >= -13) {
    priorForecast = Math.round(Number(demand) * (1 + .025 * Math.sin(i)));
    actual = Math.round(priorForecast * (1 + (random() - .5) * .07));
    if (skuId === 'citrus-vodka-soda') { priorForecast = Math.round(Number(demand) / 1.18); actual = weekOffset >= -3 ? Number(demand) : Math.round(priorForecast * (1 + (random() - .5) * .10)); }
    if (skuId === 'berry-vodka-soda') { priorForecast = Math.round(Number(demand) / .83); actual = weekOffset >= -4 ? Number(demand) : Math.round(priorForecast * (1 + (random() - .5) * .10)); }
  }
  return { skuId, weekOffset, actual, priorForecast };
}));
fs.writeFileSync(new URL('../data/history.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(`Wrote ${result.length} deterministic weekly observations.`);
