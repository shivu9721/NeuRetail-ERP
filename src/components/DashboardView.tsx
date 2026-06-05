/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  DollarSign, ShoppingCart, TrendingUp, AlertTriangle, 
  Package, Store, Users, FileText, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";
import { useERPStore } from "../store";
import { UserRole } from "../types";

export function DashboardView() {
  const { 
    sales, expenses, products, purchases, currentBranch, currentUser, 
    notifications, auditLogs 
  } = useERPStore();

  const [dateFilter, setDateFilter] = useState("Today");

  // Calculations based on seeded in-memory databases
  const totalSalesCount = sales.length;
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const totalCost = sales.reduce((acc, curr) => {
    return acc + curr.items.reduce((itemAcc, item) => {
      // Find cost price from product catalog
      const p = products.find(prod => prod.id === item.productId);
      const cp = p ? p.costPrice : item.sellingPrice * 0.7; // default 30% margin
      return itemAcc + (cp * item.quantity);
    }, 0);
  }, 0);

  const grossProfit = totalRevenue - totalCost;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // High stock alerts
  const lowStockItems = products.filter(p => {
    const branchStock = p.branchStocks[currentBranch?.id || "br-1"] || 0;
    return branchStock <= p.minStockLevel;
  });

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netEarnings = grossProfit - totalExpenseAmount;

  // Render high-fidelity realistic SVG Charts
  // Simple SVG Line graph for daily sales trend
  const salesTrendValues = [450, 720, 1100, 950, 1400, 1850, totalRevenue];
  const maxTrend = Math.max(...salesTrendValues);
  const points = salesTrendValues.map((val, idx) => {
    const x = (idx / (salesTrendValues.length - 1)) * 100;
    const y = 80 - (val / maxTrend) * 60; // scale between 20 and 80
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900">Enterprise Administration Control</h2>
          <p className="text-sm text-gray-500">Live operational metrics for <span className="font-semibold text-brand-600">{currentBranch?.name || "Main Hub"}</span></p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-medium text-gray-400 font-mono">LAN STATUS: ONLINE</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-xs transition-shadow flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Today's Store Revenue</span>
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-gray-900 font-display">₹{(totalRevenue).toLocaleString("en-IN") || "0"}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% from yesterday</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-xs transition-shadow flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Gross Trade Margin</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-gray-900 font-display">₹{grossProfit.toLocaleString("en-IN")}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-mono">
              <span>Avg Margin: {grossProfitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-xs transition-shadow flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">POS Sales Checkout Counter</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-gray-900 font-display">{totalSalesCount}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 font-medium font-mono">
              <span>Average Basket Value: ₹{totalSalesCount > 0 ? Math.round(totalRevenue / totalSalesCount) : 0}</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-xs transition-shadow flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Inventory Alert Warning</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-gray-900 font-display">{lowStockItems.length}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-rose-600 font-semibold">
              <span>{lowStockItems.filter(p => !p.branchStocks[currentBranch?.id || "br-1"]).length} items out of stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Side Notifications Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Hourly Revenue Stream Profile</h3>
              <p className="text-xs text-gray-400 font-mono">LAN Connection Live Data Streams</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-sm">INR ₹ / Hour</span>
          </div>

          {/* SVG Custom High-fidelity Graph */}
          <div className="w-full h-64 bg-gray-50/50 rounded-lg p-2 relative flex flex-col justify-between border border-gray-100">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none p-4 opacity-30">
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
              <div className="border-b border-gray-300 w-full h-0"></div>
            </div>
            
            <svg viewBox="0 0 100 80" className="w-full h-48 overflow-visible mt-2" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              
              {/* Area Layer */}
              <path 
                d={`M 0,80 L ${points} L 100,80 Z`} 
                fill="url(#chartGrad)" 
              />
              
              {/* Line Layer */}
              <polyline 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="2.5" 
                points={points} 
                strokeLinecap="round"
              />
              
              {/* Interactive Points */}
              {salesTrendValues.map((val, idx) => {
                const x = (idx / (salesTrendValues.length - 1)) * 100;
                const y = 80 - (val / maxTrend) * 60;
                return (
                  <circle 
                    key={idx} 
                    cx={x} 
                    cy={y} 
                    r="2.5" 
                    fill="#fff" 
                    stroke="#7c3aed" 
                    strokeWidth="2"
                    className="cursor-pointer hover:r-4 transition-all"
                  />
                );
              })}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-2 px-2 border-t border-gray-100 capitalize">
              <span>08:00 AM</span>
              <span>10:00 AM</span>
              <span>12:00 PM</span>
              <span>02:00 PM</span>
              <span>04:00 PM</span>
              <span>06:00 PM</span>
              <span>08:00 PM (Live)</span>
            </div>
          </div>
        </div>

        {/* Real-Time Warehouse Stock Warning Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Inventory Alert Ledger</h3>
                <p className="text-xs text-gray-400">Warehouse limits exceeded</p>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-sm font-bold uppercase tracking-wider font-mono">Immediate Stocking</span>
            </div>

            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="h-8 w-8 text-emerald-200 mx-auto stroke-1" />
                  <p className="text-xs text-gray-400 mt-2">All product inventory buffers are filled.</p>
                </div>
              ) : (
                lowStockItems.map((prod) => {
                  const qty = prod.branchStocks[currentBranch?.id || "br-1"] || 0;
                  return (
                    <div key={prod.id} className="flex p-3 bg-rose-50/50 rounded-xl border border-rose-100/70 items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-800">{prod.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">Barcode: {prod.barcode} | HSN: {prod.hsnCode}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-rose-600 font-mono">{qty} {prod.unit}</span>
                        <p className="text-[9px] text-gray-400">Min: {prod.minStockLevel}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span>Seeded database records:</span>
              <span className="text-gray-800 font-semibold">{products.length} Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit logs & Profit Margins Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Ledger Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">Net Profit calculation Ledger</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Gross Trade Margin</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">+₹{grossProfit.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Accumulated Sales GST</span>
                <span className="text-xs font-bold text-brand-600 font-mono">₹{sales.reduce((acc, curr) => acc + curr.gstTotal, 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Store Expense</span>
                <span className="text-xs font-bold text-rose-600 font-mono">-₹{totalExpenseAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-100">
                <span className="text-sm font-bold text-brand-900 font-display">Net ERP Earnings</span>
                <span className={`text-sm font-mono font-extrabold ${netEarnings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹{netEarnings.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Counter Cashiers Registers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-display">Active Cash Counter State</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8.5 w-8.5 rounded-full bg-emerald-50 text-emerald-600 font-display font-extrabold text-xs flex items-center justify-center">C1</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Counter 01 - Main Bill Desk</h4>
                    <p className="text-[10px] text-emerald-600 font-semibold">CASHIER ACTIVE: David Miller</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono">₹{sales.filter(s => s.counterId === "CTR-01").reduce((a,c) => a + c.grandTotal, 0).toLocaleString("en-IN")}</span>
                  <p className="text-[9px] text-gray-400 font-mono">Today's transactions</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8.5 w-8.5 rounded-full bg-indigo-50 text-indigo-600 font-display font-extrabold text-xs flex items-center justify-center">C2</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Counter 02 - Grocery Express</h4>
                    <p className="text-[10px] text-indigo-500 font-semibold">CASHIER ACTIVE: David Miller</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-mono">₹{sales.filter(s => s.counterId === "CTR-02").reduce((a,c) => a + c.grandTotal, 0).toLocaleString("en-IN")}</span>
                  <p className="text-[9px] text-gray-400 font-mono">Today's transactions</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="flex items-center gap-3 opacity-60">
                  <div className="h-8.5 w-8.5 rounded-full bg-gray-100 text-gray-500 font-display font-extrabold text-xs flex items-center justify-center">C3</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Counter 03 - Bulk Standby</h4>
                    <p className="text-[10px] text-gray-400">Offline counter</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">CLOSED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Audit Log Stream */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Security Audit Logs</h3>
                <p className="text-xs text-gray-400">LAN operational trails</p>
              </div>
              <Clock className="h-4 w-4 text-brand-400" />
            </div>

            <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors border-l-2 border-brand-500 pl-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">{log.action}</span>
                    <span className="text-[9px] text-gray-400 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{log.details}</p>
                  <div className="flex mt-1 text-[9px] text-brand-600 font-semibold font-mono uppercase tracking-wider gap-2">
                    <span>{log.userName}</span>
                    <span className="text-gray-300">|</span>
                    <span>{log.module}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
