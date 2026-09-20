/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks transpile TS fixtures in memory without a build. */
/* Offline consistency checks: no application build, server, network or new dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
let renderedPath = "/";
const originalLoad = Module._load;
Module._load = function(request, ...args) {
  const loaded = originalLoad.call(this, request, ...args);
  return request === 'next/navigation' ? {...loaded, usePathname: () => renderedPath, useRouter: () => ({push() { throw new Error('Navigation must not run during static rendering'); }})} : loaded;
};
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) { return resolve.call(this, request.startsWith('@/') ? path.join(root,request.slice(2)) : request,parent,...rest); };
for (const ext of ['.ts','.tsx']) require.extensions[ext] = (module, file) => {
  const output = ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText;
  module._compile(output,file);
};
const d = require('../data/planning.ts');
const c = require('../lib/calculations.ts');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { WorkspacePage } = require('../components/workspace-page.tsx');
const { PlanCard } = require('../components/planning-ui.tsx');
let checks = 0;
function equal(a,b,message) { assert.deepEqual(a,b,message); checks++; }
function ok(a,message) { assert.ok(a,message); checks++; }
function near(a,b,message) { ok(Math.abs(a-b)<1e-7,`${message}: ${a} vs ${b}`); }
const citrus=d.skus[0];
const expected = [
 [0,1140,'4.1','Sep 27','Oct 6',2364],
 [.15,1311,'3.6','Sep 24','Oct 2',3424],
 [.25,1425,'3.3','Sep 22','Sep 30',4131],
 [.40,1596,'2.9','Sep 19','Sep 28',5191],
];
for (const [uplift,demand,cover,safety,stockout,required] of expected) {
 const m=c.baseline(citrus,uplift);
 equal(Math.round(m.demand),demand,'Sensitivity demand'); equal(m.usableCover.toFixed(1),cover,'Usable cover');equal(d.dateLabel(m.safetyDay),safety,'Safety date');equal(d.dateLabel(m.stockoutDay),stockout,'Stockout date');equal(Math.round(m.required),required,'Required production');ok(m.required>0,'High risk');
 const input={...d.defaultScenario(citrus),uplift}; const projected=c.projection(citrus,input);
 near(projected.required,m.required,'Projection reduces to formula without events'); equal(projected.stockoutDay,m.stockoutDay,'Projection stockout matches formula');equal(projected.safetyDay,m.safetyDay,'Projection safety matches formula');
}
equal(c.baseline(citrus).cover.toFixed(1),'4.2');equal(c.projection(citrus,d.defaultScenario(citrus)).capital,18600);
equal(c.portfolio.inventory,41000);equal(c.portfolio.weeklyDemand,5720);equal(c.portfolio.incoming,3700);equal(d.orders.length,3);equal(c.portfolio.statuses,{high:2,healthy:2,watch:1,overstock:1});
equal(d.skus.map(s=>c.baseline(s).cover.toFixed(1)),['4.2','7.8','11.1','3.6','7.7','10.6']);
equal(d.skus.map(s=>Math.round(c.baseline(s).required)),[2364,0,0,2790,0,0]);equal(c.priorities[0].recommended,1800);near(c.priorities[0].remaining,564);equal(c.priorities.length,4);
equal(d.dateAt(35),'2026-10-12');equal(d.dateAt(21),'2026-09-28');equal(d.dateAt(-13*7),'2026-06-08');equal(d.dateAt(-1),'2026-09-06');equal(d.history.length,d.skus.length*d.settings.historyWeeks);
for (const s of d.skus) {
 const rows=d.history.filter(h=>h.skuId===s.id);equal(rows.length,78);equal(rows.at(-1).weekOffset,-1);
 const f=c.forecast(s);equal(f.length,13);ok(f.every((p,i)=>p.low<p.base&&p.high>p.base&&(i===0||p.width>f[i-1].width)),'Widening planning range');
 for(const w of [4,8,13]) near(c.sum(f.slice(0,w).map(p=>p.base)),c.sum(c.projection(s).daily.slice(0,w*7).map(p=>p.demand)),'Demand and inventory share series');
 const recommendation=c.skuPlan(s);const html=renderToStaticMarkup(React.createElement(PlanCard,{sku:s}));ok(html.includes(recommendation.action));ok(html.includes(d.units(s.onHand)));ok(html.includes(d.units(s.weeklyDemand)));ok(html.includes(recommendation.base.cover.toFixed(1)+'w'));
}
for (const days of [30,60,90]) {
 const r=c.revenue(days);near(r.base,c.sum(d.skus.map(s=>c.demandTotal(s,days)*s.netPrice)),'Revenue equals demand × net price');ok(r.low<r.base&&r.base<r.high);ok(r.constrained<=r.base);
 const prev=c.sum(d.skus.map(s=>c.sum(d.history.filter(h=>h.skuId===s.id).flatMap(h=>Array.from({length:7},(_,i)=>({day:h.weekOffset*7+i,value:h.actual/7*s.netPrice}))).filter(v=>v.day>=-days).map(v=>v.value))));near(r.previous,prev,'Previous revenue exact day proration');
}
const promo=d.events.find(e=>e.kind==='promotion');const variety=d.skus[3];near(c.projection(variety).required,c.baseline(variety).required+variety.weeklyDemand*promo.uplift*promo.durationDays/7,'Promotion layers onto baseline need');
const input=d.defaultScenario(citrus);const original=c.projection(citrus,input);const planned=c.projection(citrus,{...input,plannedUnits:5000});equal(planned.required,0);equal(planned.stockoutDay,original.stockoutDay,'Late production does not prevent earlier stockout');ok(planned.capital>0,'Funded planned quantity remains in capital');ok(c.projection(citrus,{...input,promotionEnabled:true,promotionDay:0}).required>original.required);ok(c.projection(citrus,{...input,distributorEnabled:true,distributorDay:0}).required>original.required);near(c.projection(citrus,{...input,promotionEnabled:true,promotionDay:80}).required,original.required,'Late promotion outside operating window');ok(c.projection(citrus,{...input,incomingUnits:5000}).stockoutDay>original.stockoutDay,'Early incoming delays stockout');
equal(c.performance(citrus).status,'Review');equal(c.performance(d.skus[2]).status,'Review');equal(c.performance(d.skus[1]).status,'On track');equal(c.performance(d.skus[4]).status,'On track');
equal(c.signals.filter(s=>s.priority).map(s=>s.skuId),c.priorities.map(p=>p.sku.id));equal(d.monitoringRules.length*d.skus.length,36);
for (const p of c.priorities) { const signal=c.signals.find(s=>s.priority===p.priority);equal(signal.action,p.action);ok(p.deadlineDay>=0&&p.deadlineDay<=6); }
const { AppShell } = require('../components/app-shell.tsx');
const views=['weekly','revenue','demand','inventory','sku','scenario','actual','intelligence','assumptions','executive','managed'];
const rendered={};
for(let i=0;i<views.length;i++) {
 const view=views[i]; renderedPath=d.routes[i][0]; const shell=renderToStaticMarkup(React.createElement(AppShell,null,'Route content')); ok(shell.includes('DEMO DATA - Synthetic Example')); ok(shell.includes(d.disclaimer)); ok(shell.includes(`aria-current="page" href="${renderedPath}"`) || shell.includes(`href="${renderedPath}" aria-current="page"`), 'Active navigation matches current route'); const html=renderToStaticMarkup(React.createElement(WorkspacePage,{view}));rendered[view]=html;
 ok(html.includes('action-strip'),`${view}: decision first`);ok(html.indexOf('action-strip')<html.indexOf('chart-figure')||!html.includes('chart-figure'),`${view}: decisions precede charts`);
 ok(!/alias|advisor|advisory|advising/i.test(html),`${view}: branding`);
 const file=path.join(root,'app',d.routes[i][0],'page.tsx');ok(fs.existsSync(file),`${view}: route exists`);ok(fs.readFileSync(file,'utf8').includes(`view="${view}"`),`${view}: actual route wired`);
}
for(const view of ['weekly','inventory','executive']) for(const p of c.priorities){ok(rendered[view].includes(`data-sku="${p.sku.id}" data-action="${p.action.replaceAll('&','&amp;')}" data-recommended="${p.recommended}"`),`${view}: recommendation identity`);ok(rendered[view].includes(d.units(p.recommended)),`${view}: visible recommended units`);}
for(const s of d.skus){const p=c.skuPlan(s);const html=renderToStaticMarkup(React.createElement(WorkspacePage,{view:'sku',initialSku:s.id}));ok(html.includes(p.action));ok(html.includes(d.units(s.onHand)));ok(html.includes(d.units(s.weeklyDemand)));ok(html.includes(d.units(p.projected.required)));ok(rendered.inventory.includes(d.units(p.projected.required)));ok(rendered.assumptions.includes(s.netPrice.toFixed(2)));ok(rendered.intelligence.includes(s.name)||!c.signals.some(sig=>sig.skuId===s.id));}
for(const p of c.priorities)ok(rendered.intelligence.includes(`data-action="${p.action}" data-priority="${p.priority}"`),'Intelligence matches brief action');
for(const html of Object.values(rendered))for(const [,href] of html.matchAll(/href="(\/[^"#?]*)/g)){ok(href==='/'||d.routes.some(r=>r[0]===href)||d.skus.some(s=>href===`/sku-planning/${s.id}`),`Valid internal link ${href}`);}
const shellSource=fs.readFileSync(path.join(root,'components/app-shell.tsx'),'utf8');ok(shellSource.includes('DEMO DATA - Synthetic Example'));ok(shellSource.includes('{disclaimer}'));ok(shellSource.includes('aria-expanded'));ok(shellSource.includes('e.key === "Escape"'));
for(const [old,current] of [['inventory','inventory-production'],['scenario','scenario-planning'],['forecast','demand-forecast'],['advisor-brief','executive-brief']])ok(fs.readFileSync(path.join(root,'app',old,'page.tsx'),'utf8').includes(`redirect("/${current}")`));
equal(d.settings.contactEmail,'');ok(rendered.managed.includes('Demo only - contact form not connected'));ok(!rendered.managed.includes('mailto:'));ok(rendered.executive.includes('print-footer'));ok(rendered.executive.includes(d.disclaimer));
const originalAsOf = d.AS_OF;
d.AS_OF = "2027-01-04";
equal(d.dateAt(35), "2027-02-08", "Changing AS_OF re-dates the distributor launch");
equal(d.dateLabel(c.baseline(citrus).stockoutDay), "Feb 2", "Changing AS_OF re-dates stockout");
equal(c.forecast(citrus)[0].label, "Jan 4", "Changing AS_OF re-dates charts");
d.AS_OF = originalAsOf;
console.log(`PASS: ${checks} assertions; canonical outputs, forecasts, event timing, capital, history, all 11 rendered views, recommendations, links, route wiring and export labels.`);

if (process.argv.includes('--snapshots')) {
 const output = '/tmp/scalesight-static-review'; fs.mkdirSync(output,{recursive:true});
 const css = fs.readFileSync(path.join(root,'app/globals.css'),'utf8').replace(/@import[^;]+;/g,'').replace(/@theme inline \{[^}]+\}/g,'');
 const {AppShell} = require('../components/app-shell.tsx');
 for (const view of views) {
  renderedPath=d.routes[views.indexOf(view)][0];
  const markup=renderToStaticMarkup(React.createElement(AppShell,null,React.createElement(WorkspacePage,{view})));
  fs.writeFileSync(path.join(output,view+'.html'),`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${markup}<script>function measure(){document.documentElement.dataset.overflow=String(document.documentElement.scrollWidth>innerWidth);document.documentElement.dataset.viewport=String(innerWidth);}addEventListener("resize",measure);setTimeout(measure,500);</script></body></html>`);
 }
 console.log('Static review fixtures written to '+output+' (not an application build).');
}
