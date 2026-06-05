/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Database, Sparkles, ShoppingBag, 
  Package, LayoutDashboard, FileText, ClipboardList, LogOut, Menu, X, Landmark, RefreshCw
} from "lucide-react";
import { useERPStore } from "./store";

// Import modules
import { DashboardView } from "./components/DashboardView";
import { POSBilling } from "./components/POSBilling";
import { ProductManagement } from "./components/ProductManagement";
import { InventoryManager } from "./components/InventoryManager";
import { PurchaseOCR } from "./components/PurchaseOCR";
import { AuditExpensesCRM } from "./components/AuditExpensesCRM";

export default function App() {
  const { 
    currentUser, currentBranch, branches, changeBranch, changeUserRole, fetchInitialData 
  } = useERPStore();

  const [activeModule, setActiveModule] = useState<"dashboard" | "pos" | "products" | "inventory" | "ocr" | "crm">("pos");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("LAN Database Active (Whitefield Server Master No. 1)");

  // Seed baseline offline data on first load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const triggerManualSync = () => {
    setSyncing(true);
    setSyncMessage("🔄 Re-indexing product inventory balances and CRM records...");
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage("✅ Local DB Sync Completed! IND-CTR01 terminal synced successfully over LAN.");
      setTimeout(() => {
        setSyncMessage("LAN Database Active (Whitefield Server Master No. 1)");
      }, 4000);
    }, 1500);
  };

  const navItems = [
    { id: "dashboard", label: "Analytics Dashboard", icon: LayoutDashboard },
    { id: "pos", label: "POS Billing Desk", icon: ShoppingBag },
    { id: "products", label: "Product Directory", icon: ClipboardList },
    { id: "inventory", label: "Warehouse stock", icon: Package },
    { id: "ocr", label: "AI Purchase OCR", icon: Sparkles },
    { id: "crm", label: "Secondary CRM / Expense", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      
      {/* TOP COMPONENT: ENTERPRISE UTILITY BAR (LAN & BRANCH INDICATORS, ROLE LOCKS) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md shrink-0 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Trademark banner */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="h-8.5 w-8.5 bg-brand-600 rounded-lg flex items-center justify-center font-bold font-display text-white shadow-xs">
              N
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider font-display uppercase flex items-center gap-1.5 leading-none">
                NeuRetail ERP <span className="text-[9px] bg-brand-500 text-white font-mono font-extrabold px-1.5 py-0.5 rounded uppercase">LAN SERVER</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-tight mt-0.5">Offline-First Supermarket Software by NeuNet Tech</p>
            </div>
          </div>

          {/* Core registers controls */}
          <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
            
            {/* LAN sync status */}
            <div 
              onClick={triggerManualSync}
              className="hidden sm:flex items-center gap-2 cursor-pointer bg-slate-800/80 hover:bg-slate-800/100 border border-slate-700/60 py-1.5 px-3 rounded-lg text-slate-350 select-none transition-all hover:scale-[1.01]"
              title="Manually synchronize register ledger entries with localized center server"
            >
              <Database className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-brand-400' : 'text-slate-400'}`} />
              <span className="text-[10px] font-mono leading-none tracking-tight font-medium text-slate-300">{syncMessage}</span>
            </div>

            {/* Branch office chooser */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-800 p-1 rounded-lg">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase pl-1.5 font-mono">Store:</span>
              <select 
                value={currentBranch?.id} 
                onChange={(e) => changeBranch(e.target.value)}
                className="text-[11px] font-bold text-brand-300 focus:outline-none cursor-pointer bg-slate-900 border border-slate-800 py-1 px-2.5 rounded hover:text-white"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Role based fast switch widget */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-800 p-1 rounded-lg">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase pl-1.5 font-mono">Role Limit:</span>
              <select 
                value={currentUser?.role} 
                onChange={(e) => changeUserRole(e.target.value as "ADMIN" | "CASHIER")}
                className="text-[11px] font-bold text-brand-300 focus:outline-none cursor-pointer bg-slate-900 border border-slate-800 py-1 px-2.5 rounded hover:text-white uppercase"
              >
                <option value="ADMIN">MANAGER/ADMIN</option>
                <option value="CASHIER">CTR-CASHIER</option>
              </select>
            </div>

          </div>

        </div>
      </header>

      {/* BODY CONTEXT: SIDEBAR NAV + CONTENT SHEET */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto self-stretch relative">
        
        {/* SIDEBAR NAVIGATION PANEL (DESKTOP GRID) */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 shadow-xs flex flex-col justify-between shrink-0 p-5 space-y-6">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider font-mono">Operations modules</span>
              <hr className="border-gray-100" />
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id as any)}
                    className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                  >
                    <IconComp className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Outflow footer details */}
          <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
            <span className="text-[9px] uppercase font-mono font-bold text-gray-400 block pb-1 border-b border-gray-200">Terminal Metadata</span>
            <div className="space-y-0.5 text-[10px] text-gray-500 font-mono">
              <p>LAN Server: <span className="font-semibold text-gray-800">192.168.1.100</span></p>
              <p>Postgres URL: <span className="font-semibold text-gray-800">local_neunet</span></p>
              <p>Node Port: <span className="font-semibold text-gray-800">3000</span></p>
              <p>Terminal No: <span className="font-semibold text-gray-800">IND-CTR-01</span></p>
            </div>
            <div className="pt-2 text-center text-xs">
              <span className="inline-block h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-bold text-emerald-800 font-mono ml-1.5 uppercase">Local Connection</span>
            </div>
          </div>
        </aside>

        {/* MOBILE SIDEBAR MODAL DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs lg:hidden z-40">
            <aside className="w-64 max-w-xs bg-white h-screen shadow-2xl p-5 flex flex-col justify-between absolute left-0 top-0 z-50">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">ERP Navigation</h3>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 font-bold">✕</button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveModule(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <IconComp className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-[10px] text-gray-400 font-mono">
                Port 3000 LAN Active.
              </div>
            </aside>
          </div>
        )}

        {/* COMPREHENSIVE MOUNT FLUID CONTAINER */}
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          {activeModule === "dashboard" && <DashboardView />}
          {activeModule === "pos" && <POSBilling />}
          {activeModule === "products" && <ProductManagement />}
          {activeModule === "inventory" && <InventoryManager />}
          {activeModule === "ocr" && <PurchaseOCR />}
          {activeModule === "crm" && <AuditExpensesCRM />}
        </main>

      </div>

    </div>
  );
}
