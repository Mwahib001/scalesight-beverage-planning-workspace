import { WorkspacePage } from "@/components/workspace-page";
import { skus } from "@/data/planning";
export const metadata = { title: "Scenario Planning" };
export default async function Page({ searchParams }: { searchParams: Promise<{sku?:string}> }) { const {sku} = await searchParams; return <WorkspacePage key={sku} view="scenario" initialSku={skus.find(s=>s.id===sku)?.id}/>; }
