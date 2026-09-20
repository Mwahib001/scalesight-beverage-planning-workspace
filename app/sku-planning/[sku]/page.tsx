import { notFound } from "next/navigation";
import { skus } from "@/data/planning";
import { WorkspacePage } from "@/components/workspace-page";
export function generateStaticParams() { return skus.map(s => ({ sku: s.id })); }
export async function generateMetadata({ params }: { params: Promise<{sku:string}> }) { const {sku} = await params; return { title: `${skus.find(s => s.id === sku)?.name ?? "SKU"} Planning` }; }
export default async function Page({ params }: { params: Promise<{sku:string}> }) { const {sku} = await params; if (!skus.some(s => s.id === sku)) notFound(); return <WorkspacePage view="sku" initialSku={sku} />; }
