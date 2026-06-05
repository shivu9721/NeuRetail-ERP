/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, Briefcase, FileText, IndianRupee, Plus, 
  Mail, MessageSquare, ShieldAlert, CheckCircle, Smartphone
} from "lucide-react";
import { useERPStore } from "../store";

export function AuditExpensesCRM() {
  const { 
    customers, suppliers, expenses, auditLogs, createCustomer, createSupplier, 
    createExpense 
  } = useERPStore();

  const [activeSegment, setActiveSegment] = useState<"crm" | "suppliers" | "expenses" | "audit">("crm");

  // CRM addition state
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [showCRMForm, setShowCRMForm] = useState(false);

  // Supplier addition state
  const [suppName, setSuppName] = useState("");
  const [suppPerson, setSuppPerson] = useState("");
  const [suppPhone, setSuppPhone] = useState("");
  const [suppGstin, setSuppGstin] = useState("");

  // Expense addition state
  const [expCategory, setExpCategory] = useState<"Salary" | "Electricity" | "Rent" | "Maintenance" | "Miscellaneous">("Salary");
  const [expAmt, setExpAmt] = useState("");
  const [expDescr, setExpDescr] = useState("");

  // Communication message simulation state
  const [promoMessage, setPromoMessage] = useState("");
  const [communicationStatus, setCommunicationStatus] = useState("");

  const handleCRMDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;
    const success = await createCustomer(custName, custPhone, custEmail || undefined);
    if (success) {
      alert("VIP Loyalty Profile registered successfully!");
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setShowCRMForm(false);
    }
  };

  const handleSupplierOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName || !suppPhone) return;
    const success = await createSupplier({
      name: suppName,
      contactPerson: suppPerson,
      phone: suppPhone,
      gstin: suppGstin || undefined,
      outstandingBalance: 0
    });

    if (success) {
      alert("Supplier on-boarded successfully on local network.");
      setSuppName("");
      setSuppPerson("");
      setSuppPhone("");
      setSuppGstin("");
    }
  };

  const handleExpenseCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmt) return;
    const success = await createExpense({
      category: expCategory,
      amount: Number(expAmt),
      description: expDescr
    });

    if (success) {
      alert("Store expense logged. Trade profit calculators updated.");
      setExpAmt("");
      setExpDescr("");
    }
  };

  // Simulated Campaigns
  const triggerCampaign = (mode: "sms" | "whatsapp") => {
    if (!promoMessage) {
      alert("Please compose promotional text first.");
      return;
    }
    setCommunicationStatus(`🚀 Broad Casting Campaign via offline LAN SMS server to ${customers.length} registered loyalists...`);
    setTimeout(() => {
      setCommunicationStatus(`✅ Successfully piped packet! Delivery status confirmed on local network gateway.`);
      setPromoMessage("");
      setTimeout(() => setCommunicationStatus(""), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* SELECTION RADIAL HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900">CRM Operations & Expense Registers</h2>
          <p className="text-sm text-gray-500 font-sans">Supervise loyalty points distribution, supplier payouts ledger, and electricity / utility expense bills.</p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 self-start md:self-auto uppercase font-mono text-[10px] tracking-wider">
          <button 
            onClick={() => setActiveSegment("crm")}
            className={`py-1.5 px-3.5 rounded-lg font-bold transition-all ${activeSegment === 'crm' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Loyalty CRM
          </button>
          <button 
            onClick={() => setActiveSegment("suppliers")}
            className={`py-1.5 px-3.5 rounded-lg font-bold transition-all ${activeSegment === 'suppliers' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Suppliers Credit
          </button>
          <button 
            onClick={() => setActiveSegment("expenses")}
            className={`py-1.5 px-3.5 rounded-lg font-bold transition-all ${activeSegment === 'expenses' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            Expenses Log
          </button>
          <button 
            onClick={() => setActiveSegment("audit")}
            className={`py-1.5 px-3.5 rounded-lg font-bold transition-all ${activeSegment === 'audit' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            System Audits
          </button>
        </div>
      </div>

      {communicationStatus && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 p-4 rounded-r-lg text-xs font-mono font-bold animate-pulse">
          {communicationStatus}
        </div>
      )}

      {/* RENDER CHOSEN SEGMENTS */}
      {activeSegment === "crm" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CRM VIP LISTS TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">VIP Customer Database ({customers.length} profiles)</h3>
              <button 
                onClick={() => setShowCRMForm(true)}
                className="text-[11px] bg-brand-50 hover:bg-brand-100/80 text-brand-700 font-bold py-1.5 px-3 rounded-lg border border-brand-100/50 flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" /> Quick Add VIP
              </button>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                    <th className="p-4 pl-6">VIP CUSTOMER NAME</th>
                    <th className="p-4">REGISTERED CONTACTS</th>
                    <th className="p-4 text-center">LOYALTY BALANCE (POINTS)</th>
                    <th className="p-4 text-center">CHECKOUTS LOGGED</th>
                    <th className="p-4 pr-6 text-right">MEMBERSHIP CALENDAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-55/25 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-brand-50 text-brand-600 font-display font-medium text-xs flex items-center justify-center">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.name}</p>
                            <span className="text-[9px] text-brand-600 font-bold tracking-wide uppercase">REWARDS CUSTOMER</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-gray-500">
                        <p>{c.phone}</p>
                        <p className="text-[10px] text-gray-400">{c.email || "N/A"}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-block bg-brand-50 text-brand-705 font-mono font-extrabold text-xs py-1 px-3 rounded-full border border-brand-100/70">
                          🌟 {c.loyaltyPoints} Pts
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-gray-700 font-semibold">{c.purchaseCount || 0}</td>
                      <td className="p-4 pr-6 text-right font-mono text-gray-400">{c.membershipDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CRM BROADCAST SMS CAMPAIGNS PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-gray-50 pb-2">
                <h3 className="text-sm font-bold text-gray-800">Promotional SMS / WhatsApp Engine</h3>
                <p className="text-xs text-gray-400">Dispatch loyalty reward coupons over local gateways</p>
              </div>

              <div className="p-3 bg-brand-50/50 rounded-xl space-y-2 text-xs text-brand-850">
                <p>💡 <span className="font-bold text-brand-950">Active campaign stats:</span> Selecting "Broad Cast" will automatically pipe simulated SMS coupons to all <span className="font-bold underline">{customers.length}</span> verified store loyalty members.</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Compose Broadcast text</label>
                <textarea 
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  placeholder="e.g. Namaste Customer, get 10% cash discounts today at NeuRetail Whitefield! Use code SPECIAL10 on checkout."
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 p-2.5 rounded-xl focus:outline-none min-h-[110px]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => triggerCampaign("sms")}
                className="flex-1 text-center font-bold text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-705 py-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <Smartphone className="h-4 w-4" /> Pipe SMS
              </button>
              <button 
                onClick={() => triggerCampaign("whatsapp")}
                className="flex-1 text-center font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSegment === "suppliers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* REGISTERED SUPPLIERS TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">Wholesale Suppliers Directory</h3>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                    <th className="p-4 pl-6">SUPPIER BUSINESS NAME</th>
                    <th className="p-4">CONTACT TEAM DETAILS</th>
                    <th className="p-4 text-center">GSTIN REFERENCE</th>
                    <th className="p-4 text-right pr-6">CREDIT OUTSTANDING BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-55/25 transition-colors">
                      <td className="p-4 pl-6 font-bold text-gray-950">
                        {s.name}
                        <p className="text-[10px] text-gray-400 font-mono font-normal">Internal Code: {s.code}</p>
                      </td>
                      <td className="p-4 font-mono font-medium text-gray-500">
                        <p className="font-sans font-bold text-gray-700">{s.contactPerson}</p>
                        <p>{s.phone} | {s.email || "N/A"}</p>
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-gray-400">{s.gstin || "N/A"}</td>
                      <td className="p-4 text-right pr-6">
                        <span className={`inline-block font-mono font-extrabold text-xs px-2.5 py-1 rounded ${s.outstandingBalance > 0 ? 'bg-amber-50 text-amber-70s font-extrabold' : 'bg-emerald-50 text-emerald-800'}`}>
                          ₹{s.outstandingBalance.toLocaleString("en-IN")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ONBOARD SUPPLIER CONTROLLERS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans border-b border-gray-50 pb-2">
              Onboard wholesale Supplier Profile
            </h3>
            <form onSubmit={handleSupplierOnboarding} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Supermarket Supplier Name</label>
                <input 
                  type="text" 
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  placeholder="e.g. ITC Wholesale Dist."
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Contact Dispatch Agent name</label>
                <input 
                  type="text" 
                  value={suppPerson}
                  onChange={(e) => setSuppPerson(e.target.value)}
                  placeholder="e.g. Rajat Verma"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Rep Phone Contacts</label>
                <input 
                  type="text" 
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  placeholder="e.g. 9420019283"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">TAX CODES GSTIN ID</label>
                <input 
                  type="text" 
                  value={suppGstin}
                  onChange={(e) => setSuppGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 29AAAAA1111A1Z1"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-transform hover:scale-[1.01] cursor-pointer text-center"
              >
                Onboard supplier ledger
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSegment === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* EXPENSES HISTORIES TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">Store Operational Expenses Sheets</h3>
              <span className="text-xs font-bold text-rose-600 font-mono">Outflow total: ₹{expenses.reduce((acc,curr)=>acc+curr.amount, 0).toLocaleString("en-IN")}</span>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                    <th className="p-4 pl-6">REFERENCE NO</th>
                    <th className="p-4">CATEGORY TYPE</th>
                    <th className="p-4">Description notes</th>
                    <th className="p-4 text-center">Remitted calendar</th>
                    <th className="p-4 pr-6 text-right">PAYOUT VALUE AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-55/25 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-stone-500">{e.referenceNo}</td>
                      <td className="p-4">
                        <span className="inline-block bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-sm">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium italic">"{e.description}"</td>
                      <td className="p-4 text-center font-mono text-gray-400">{e.date}</td>
                      <td className="p-4 pr-6 text-right font-mono font-extrabold text-gray-900">₹{e.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOGGER EXPENSE FORM */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans border-b border-gray-50 pb-2 flex items-center gap-1.5">
              <DailyBudgetIconIcon className="h-4.5 w-4.5" /> Log Store Expenditure
            </h3>
            <form onSubmit={handleExpenseCommit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Expenditure Category Allocation</label>
                <select 
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-semibold text-gray-800 focus:outline-none"
                >
                  <option value="Salary">Salary (Employee Payroll)</option>
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Rent">Rent (Store leases)</option>
                  <option value="Maintenance">Maintenance & Replacements</option>
                  <option value="Miscellaneous">Miscellaneous petty cash</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Wages / Voucher Value Amount (₹)</label>
                <input 
                  type="number"
                  value={expAmt}
                  onChange={(e) => setExpAmt(e.target.value)}
                  placeholder="e.g. ₹18500"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none font-extrabold text-gray-900"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Invoice reference Description</label>
                <textarea 
                  value={expDescr}
                  onChange={(e) => setExpDescr(e.target.value)}
                  placeholder="Provide reference logs, bill numbers, month details"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 p-2.5 rounded-xl focus:outline-none min-h-[90px]"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Accrue operational expense
              </button>
            </form>
          </div>
        </div>
      )}

      {activeSegment === "audit" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <ShieldAlert className="h-5 w-5 text-rose-500" /> Security Audit Log registers trail
              </h3>
              <p className="text-xs text-gray-400 mt-1">Immutable ledger logs mapping all mutations and cash counter activity trails</p>
            </div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded font-mono font-bold">LAN LEVEL SECURE AUDITS</span>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                  <th className="p-4 pl-6 w-1/4">CHRONOLOGY METRICS</th>
                  <th className="p-4">USER ACTOR ID</th>
                  <th className="p-4">MODULE</th>
                  <th className="p-4">Mutating Action Log</th>
                  <th className="p-4 pr-6 text-right">LEDBER LOG DETAIL VERIFICATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-55/15 hover:text-gray-900 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-gray-500">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-gray-800">{log.userName}</p>
                        <span className="text-[9px] text-brand-600 font-mono font-bold uppercase tracking-wider">{log.role}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-650">{log.module}</td>
                    <td className="p-4 font-semibold text-gray-750">{log.action}</td>
                    <td className="p-4 pr-6 text-right text-gray-400 italic">"{log.details || 'N/A'}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK POPUP VIP ADDITION CONTAINER */}
      {showCRMForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-800 font-display">Log VIP CRM Membership</h4>
              <button onClick={() => setShowCRMForm(false)} className="text-gray-400 font-bold hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCRMDiscountSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Vip customer string name</label>
                <input 
                  type="text" 
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">10 Digit Phone number</label>
                <input 
                  type="text" 
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. 9884501239"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-405 font-mono">Email contact (Optional)</label>
                <input 
                  type="email" 
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCRMForm(false)} className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl">Cancel</button>
                <button type="submit" className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Basic graphic representations helper
function DailyBudgetIconIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
