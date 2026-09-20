"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BarChart3, CalendarDays, ChevronRight, Menu, X } from "lucide-react";
import { account, disclaimer, planningWeek, routes } from "@/data/planning";

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLElement>("button, a")?.focus();
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (e.key === "Tab") {
        const nodes = drawer.current?.querySelectorAll<HTMLElement>("a, button");
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keys);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keys); };
  }, [open]);
  return <div className="workspace">
    <a className="skip-link" href="#main">Skip to content</a>
    {open && <button className="drawer-backdrop" aria-label="Close navigation" onClick={() => { setOpen(false); toggle.current?.focus(); }} />}
    <aside id="workspace-navigation" className={`sidebar ${open ? "is-open" : ""}`} ref={drawer} aria-label="Workspace navigation" role={open ? "dialog" : undefined} aria-modal={open || undefined}>
      <div className="brand"><BarChart3 size={27}/><div><Link href="/" onClick={() => setOpen(false)}>ScaleSight<span className="brand-dot">.</span></Link><p>Managed Beverage Intelligence</p></div><button className="mobile-only icon-button" aria-label="Close navigation" onClick={() => { setOpen(false); toggle.current?.focus(); }}><X size={20}/></button></div>
      <div className="nav-caption">PLANNING WORKSPACE</div>
      <nav aria-label="Main navigation">{routes.map(([href, label], i) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={path === href || (href === "/sku-planning" && path.startsWith(`${href}/`)) ? "page" : undefined}><span className="nav-number">{String(i+1).padStart(2, "0")}</span>{label}<ChevronRight className="nav-chevron" size={14}/></Link>)}</nav>
      <div className="sidebar-service"><span className="eyebrow">YOUR PLANNING TEAM</span><strong>Clear priorities.<br/>A recurring review.</strong><p>Analysis maintained by ScaleSight. Decisions made with you.</p><Link href="/managed-intelligence" onClick={() => setOpen(false)}>Explore the service <ArrowUpRight size={15}/></Link></div>
    </aside>
    <div className="workspace-body">
      <header className="workspace-header"><div className="mobile-wordmark"><strong>ScaleSight<span className="brand-dot">.</span></strong><span>Managed Beverage Intelligence</span></div><div className="account-row"><button ref={toggle} className="mobile-only icon-button" aria-label="Open navigation" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(true)}><Menu size={23}/></button><div><strong>{account}</strong><p>RTD Beverage | Demo Account</p></div><span className="analyst-tag">ScaleSight Analyst View</span></div><div className="context-row"><span><CalendarDays size={15}/> Planning Week: {planningWeek}</span><span className="demo-badge">DEMO DATA - Synthetic Example</span></div></header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="workspace-footer">{disclaimer}</footer>
    </div>
  </div>;
}
