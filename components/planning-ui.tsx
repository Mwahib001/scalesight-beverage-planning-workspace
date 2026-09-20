"use client";
import Link from "next/link";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";
import { dateLabel, skus, units } from "@/data/planning";
import { skuPlan } from "@/lib/calculations";
import type { Sku } from "@/lib/types";

export function Panel({ title, children, className = "", id }: { title?: string; children: React.ReactNode; className?: string; id?: string }) { return <section id={id} className={`panel ${className}`}>{title && <h2>{title}</h2>}{children}</section>; }
export function Title({ title, purpose, children }: { title: string; purpose: string; children?: React.ReactNode }) { return <div className="page-title"><div><span className="eyebrow">SCALESIGHT / BEVERAGE PLANNING</span><h1>{title}</h1><p>{purpose}</p></div>{children}</div>; }
export function Strip({ children }: { children: React.ReactNode }) { return <section className="action-strip"><span className="eyebrow">THE DECISION THIS CYCLE</span><div>{children}</div></section>; }
export function Badge({ risk }: { risk: string }) { const labels: Record<string, string> = { high: "High risk", healthy: "Healthy", watch: "Watch", overstock: "Overstock" }; return <span className={`risk-badge ${risk}`}>{labels[risk] ?? risk}</span>; }
export function Selector({ value, onChange, portfolio = false }: { value: string; onChange: (v: string) => void; portfolio?: boolean }) { return <label className="field selector">SKU<select value={value} onChange={e => onChange(e.target.value)}>{portfolio && <option value="all">All SKUs</option>}{skus.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>; }
export function Tabs({ values, value, onChange, suffix }: { values: number[]; value: number; onChange: (v: number) => void; suffix: string }) { return <div className="segmented" aria-label={`Select horizon in ${suffix}`}>{values.map(v => <button key={v} aria-pressed={v === value} onClick={() => onChange(v)}>{v} {suffix}</button>)}</div>; }
export function Metrics({ items }: { items: [string, string, string?][] }) { return <div className="metrics">{items.map(([label, value, detail]) => <div key={label}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>)}</div>; }
export function PlanCard({ sku, compact = false }: { sku: Sku; compact?: boolean }) {
  const p = skuPlan(sku);
  return <article className={`decision-card ${p.risk}`} id={`priority-${p.priority}`} data-sku={sku.id} data-action={p.action} data-recommended={p.recommended}>
    <div className="decision-heading"><span className="priority-number">{p.priority ? `0${p.priority}` : "—"}</span><div><div className="inline"><Badge risk={p.risk}/><span className="eyebrow">{p.action}</span></div><h3>{sku.name}</h3></div><Link className="icon-link" aria-label={`Open ${sku.name} planning`} href={`/sku-planning/${sku.id}`}><ArrowUpRight size={20}/></Link></div>
    <p className="decision-copy">{p.explanation}</p>
    {!compact && <div className="evidence-line"><span>{units(sku.onHand)} units on hand</span><span>{p.base.cover.toFixed(1)}w baseline cover</span><span>{units(sku.weeklyDemand)} units/week</span><span>{sku.leadWeeks}w lead time</span></div>}
    <div className="decision-footer"><span>{sku.owner} · Due {dateLabel(p.deadlineDay)}</span><Link href={`/sku-planning/${sku.id}#inventory-position`}>Review supply →</Link></div>
  </article>;
}
export type ChartRow = { label: string; [key: string]: number | string | number[] | undefined };
export function Chart({ title, rows, lines, summary, range = false, markers = [], safety, lead }: { title: string; rows: ChartRow[]; lines: { key: string; label: string; color: string; dashed?: boolean }[]; summary: string; range?: boolean; markers?: string[]; safety?: number; lead?: string }) {
  return <figure className="chart-figure" aria-label={`${title}. ${summary}`}><figcaption>{title}</figcaption><div className="chart-box"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 700, height: 290 }}><ComposedChart data={rows} margin={{ top: 20, right: 16, left: 0, bottom: 8 }} accessibilityLayer><CartesianGrid vertical={false} stroke="#e5e9ef"/><XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={35}/><YAxis width={52} tick={{ fontSize: 10 }} tickFormatter={v => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(1)}k` : units(v)}/><Tooltip formatter={v => Array.isArray(v) ? v.map(n => units(Number(n))).join(" – ") : units(Number(v))}/><Legend wrapperStyle={{ fontSize: 11 }}/>{range && <Area dataKey="range" name="Planning range" fill="#dbe7f6" stroke="none" isAnimationActive={false}/ >}{lines.map(l => <Line key={l.key} dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2.4} dot={false} strokeDasharray={l.dashed ? "5 4" : undefined} isAnimationActive={false}/>)}{markers.filter(m => rows.some(r => r.label === m)).map(m => <ReferenceLine key={m} x={m} stroke="#9a6910" strokeDasharray="4 4" label={{ value: m, position: "insideTopRight", fontSize: 10 }}/ >)}{safety !== undefined && <ReferenceLine y={safety} stroke="#b54f50" strokeDasharray="4 4" label={{ value: "Safety", position: "insideTopLeft", fontSize: 10 }}/ >}{lead && <ReferenceLine x={lead} stroke="#9a6910" label={{ value: "Lead time", position: "insideTopRight", fontSize: 10 }}/ >}</ComposedChart></ResponsiveContainer></div><p className="chart-summary">{summary}</p></figure>;
}
