/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Package, ArrowLeftRight, ClipboardList, 
  CheckCircle, PlusCircle, AlertTriangle, ChevronRight, User
} from "lucide-react";
import { useERPStore } from "../store";

export function InventoryManager() {
  const { 
    products, stockMovements, adjustStock, branches, currentBranch, currentUser 
  } = useERPStore();

  // Mode Selection
  const [activeSubTab, setActiveSubTab] = useState<"balances" | "transfer" | "adjust" | "ledger" | "batches">("balances");

  // State for Adjustment Form
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState<"STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT">("STOCK_IN");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // State for Transfer Form
  const [transferProductId, setTransferProductId] = useState("");
  const [transferFromBranch, setTransferFromBranch] = useState("br-1");
  const [transferToBranch, setTransferToBranch] = useState("br-2");
  const [transferQty, setTransferQty] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustQty) {
      alert("Please select a Product and a valid Quantity.");
      return;
    }

    const qty = adjustType === "STOCK_OUT" ? -Math.abs(Number(adjustQty)) : Math.abs(Number(adjustQty));
    const success = await adjustStock(adjustProductId, "ADJUSTMENT", qty, adjustNote);
    if (success) {
      alert("Stock adjustment saved successfully in database ledger.");
      setAdjustProductId("");
      setAdjustQty("");
      setAdjustNote("");
    } else {
      alert("Error logging manual stock adjustment.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferQty) {
      alert("Please specify product and quantity.");
      return;
    }
    if (transferFromBranch === transferToBranch) {
      alert("Source and Target branch cannot be identical.");
      return;
    }

    const success = await adjustStock(
      transferProductId, 
      "TRANSFER", 
      Number(transferQty), 
      transferNote || `Interbranch stock transfers.`, 
      transferToBranch
    );

    if (success) {
      alert("Inter-branch stock transfer posted successfully!");
      setTransferProductId("");
      setTransferQty("");
      setTransferNote("");
    } else {
      alert("Transfer request rejected by database server.");
    }
  };

  // Compile batch info from products
  const productBatches = products.flatMap(p => {
    if (!p.batches) return [];
    return p.batches.map(b => ({
      productId: p.id,
      productName: p.name,
      barcode: p.barcode,
      unit: p.unit,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      stockQuantity: b.stockQuantity
    }));
  });

  return (
    <div className="space-y-6">
      {/* HEADER CONTROL */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900">Inventory Warehouse Controller</h2>
          <p className="text-sm text-gray-500 font-sans">Supervise batching expiration dates, inter-branch movements, and balance adjustments.</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button 
            onClick={() => setActiveSubTab("balances")}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${activeSubTab === 'balances' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Balances Sheet
          </button>
          <button 
            onClick={() => setActiveSubTab("adjust")}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${activeSubTab === 'adjust' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Manual Adjust
          </button>
          <button 
            onClick={() => setActiveSubTab("transfer")}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${activeSubTab === 'transfer' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Inter-Branch Route
          </button>
          <button 
            onClick={() => setActiveSubTab("batches")}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${activeSubTab === 'batches' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Batch Expiries
          </button>
          <button 
            onClick={() => setActiveSubTab("ledger")}
            className={`text-xs py-1.5 px-3 rounded-lg font-bold transition-all ${activeSubTab === 'ledger' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            History Ledgers
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE VIEWS */}
      {activeSubTab === "balances" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">Multi-Branch Inventory Balances</h3>
            <span className="text-xs text-gray-500 font-mono">Whitefield (Hub) & Indiranagar (Express) stocks mapped</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                  <th className="p-4 pl-6">BARCODE</th>
                  <th className="p-4">PRODUCT LABEL DESCRIPTION</th>
                  <th className="p-4">CATEGORY</th>
                  <th className="p-4 text-center">WHITEFIELD STOCK (MAIN)</th>
                  <th className="p-4 text-center">INDIRANAGAR STOCK (EXPRESS)</th>
                  <th className="p-4 text-center">TOTAL METRICS BALANCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-800">
                {products.map((p) => {
                  const wfd = p.branchStocks["br-1"] || 0;
                  const ind = p.branchStocks["br-2"] || 0;
                  const maxTotal = wfd + ind;
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-55/20 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-gray-700">{p.barcode}</td>
                      <td className="p-4 font-bold text-gray-900">{p.name} <p className="text-[10px] text-gray-400 font-normal">HSN Ref: {p.hsnCode} | Unit: {p.unit}</p></td>
                      <td className="p-4 text-gray-500 font-medium">{p.category}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block font-mono font-bold px-3 py-1 rounded-sm w-20 text-center ${wfd <= p.minStockLevel ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-850'}`}>
                          {wfd} {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block font-mono font-bold px-3 py-1 rounded-sm w-20 text-center ${ind <= p.minStockLevel ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-850'}`}>
                          {ind} {p.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-extrabold text-brand-700">{maxTotal} {p.unit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "adjust" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ADJUSTMENT CONTROLLER FORM */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <PlusCircle className="h-4.5 w-4.5 text-brand-600" /> Stock Balances Modifier
            </h3>
            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Select Barcode Product</label>
                <select 
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-semibold text-gray-850 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} [{p.barcode}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Adjustment Class</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    type="button" 
                    onClick={() => setAdjustType("STOCK_IN")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${adjustType === 'STOCK_IN' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                  >
                    📈 Stock Addition
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAdjustType("STOCK_OUT")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${adjustType === 'STOCK_OUT' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                  >
                    📉 Deficit/Write-Off
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Quantity Units</label>
                <input 
                  type="number" 
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Count units. e.g. 50"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Justification Remark</label>
                <textarea 
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Broken packages or audit replenishment"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none min-h-[80px]"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs shadow-xs text-center"
              >
                Log Ledger Entries
              </button>
            </form>
          </div>

          {/* DOCUMENTATION PANEL */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">Audit ledger verification policy</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                As a GST-compliant supermarket, every manual stock ingress or deficit write-off is logged in standard double-entry transaction ledgers under internal security audit trails.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="h-6 w-6 shrink-0 bg-brand-50 text-brand-600 font-bold uppercase rounded-full flex items-center justify-center text-xs">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">GST Compliance Tax Tracking</h4>
                    <p className="text-[11px] text-gray-400">Stock reduction audits must have associated reasons to account for ITC tax claims.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="h-6 w-6 shrink-0 bg-brand-50 text-brand-600 font-bold uppercase rounded-full flex items-center justify-center text-xs">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Role-Based Access Limit</h4>
                    <p className="text-[11px] text-gray-400">Only Store Managers and Admin logs have permission to adjust inventory manually.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/40 text-amber-800 font-medium text-xs flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Current Auditor Session: <span className="font-bold underline">{currentUser?.name}</span> ({currentUser?.role}) has permissions active.</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "transfer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <ArrowLeftRight className="h-4.5 w-4.5 text-brand-600" /> Inter-Branch Transfer Dispatch
            </h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Product Profile</label>
                <select 
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-semibold text-gray-850 focus:outline-none"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Source Center</label>
                  <select 
                    value={transferFromBranch} 
                    onChange={(e) => setTransferFromBranch(e.target.value)}
                    className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-800 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.split("-")[1]?.trim() || b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Target Center</label>
                  <select 
                    value={transferToBranch} 
                    onChange={(e) => setTransferToBranch(e.target.value)}
                    className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 p-2 rounded-xl text-gray-800 focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.split("-")[1]?.trim() || b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Dispatch Quantity</label>
                <input 
                  type="number" 
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Bill Of Lading / Manifest Notes</label>
                <input 
                  type="text" 
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Delivery Challan #DC-32049"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs"
              >
                Post Delivery Challan
              </button>
            </form>
          </div>

          {/* ACTIVE DISPATCH LOGS */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5 border-b border-gray-50 pb-2">
              🚚 Pending Inter-branch Transits
            </h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] bg-brand-200 text-brand-800 font-mono font-bold px-2 py-0.5 rounded-sm">TRANSIT LOG</span>
                  <h4 className="text-xs font-bold text-gray-800">Marie Gold Biscuit Pack Interbranch Transit</h4>
                  <p className="text-[10px] text-gray-400">Dispatch DC-2210 | Outbound: 100 Pcs</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2.5 py-1 rounded">COMPLETED</span>
                    <p className="text-[9px] text-gray-400 mt-1">Confirmed Whitefield Arrival</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "batches" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Batch Code Expiration Watchdog</h3>
              <p className="text-xs text-gray-400">Supervise food spoil levels, pharmacy/perishable limits</p>
            </div>
            <span className="text-xs bg-rose-50 text-rose-600 px-3 py-1 rounded-sm font-bold font-mono uppercase tracking-wide">30 Day Warnings</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                  <th className="p-4 pl-6">BATCH CODE</th>
                  <th className="p-4">PRODUCT FAMILY NAME</th>
                  <th className="p-4">EXPIRATION CALENDAR</th>
                  <th className="p-4 text-center">BATCH RETENTION (QTY)</th>
                  <th className="p-4 text-right pr-6">SAFETY STATUS STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {productBatches.map((b, idx) => {
                  const daysToExpiry = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 365)) * 10; // Scaled mock days
                  const isSoon = daysToExpiry <= 90;
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-55/20 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-brand-700">{b.batchNumber}</td>
                      <td className="p-4 font-bold text-gray-950">{b.productName} <p className="text-[10px] text-gray-400 font-mono">Barcode: {b.barcode}</p></td>
                      <td className="p-4 font-mono font-semibold text-gray-600">{b.expiryDate}</td>
                      <td className="p-4 text-center font-mono font-bold">{b.stockQuantity} {b.unit}</td>
                      <td className="p-4 text-right pr-6">
                        {isSoon ? (
                          <span className="inline-block bg-rose-50 text-rose-700 text-[9px] font-bold px-2 py-1 rounded border border-rose-100 uppercase tracking-wider font-mono">⚠️ Expiration Warning Near</span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-1 rounded border border-emerald-100 uppercase tracking-wider font-mono">✅ Fully Stable & Safe</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "ledger" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-600" /> Complete Stock Movement double-entry Ledger
            </h3>
            <p className="text-xs text-gray-400 mt-1">Chronological history registry tracking barcode guns activity profiles</p>
          </div>

          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {stockMovements.map((mov, index) => (
              <div key={mov.id || index} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-55/10 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${mov.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' : mov.type === 'STOCK_OUT' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-indigo-105 text-indigo-805'}`}>
                      {mov.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Challenge ID: {mov.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">{mov.productName}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">Barcode: {mov.barcode} | Audited Reason: <span className="text-gray-600 italic">"{mov.note}"</span></p>
                </div>

                <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono text-gray-900 ${mov.type === 'STOCK_IN' ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {mov.type === 'STOCK_IN' || (mov.type === 'ADJUSTMENT' && mov.quantity > 0) ? "+" : "-"} {Math.abs(mov.quantity)} Units
                    </span>
                    <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5 justify-end">
                      <User className="h-3 w-3 inline text-gray-300" /> {mov.user}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    {new Date(mov.timestamp).toLocaleDateString()} {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
