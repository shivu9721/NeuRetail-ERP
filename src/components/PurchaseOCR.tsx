/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, UploadCloud, Cpu, Table, Edit3, Check, CheckCircle, 
  ArrowRight, Sparkles, RefreshCw, Layers, DollarSign, Calendar
} from "lucide-react";
import { useERPStore } from "../store";

export function PurchaseOCR() {
  const { 
    purchases, suppliers, products, processInvoiceOCR, createPurchaseReceipt, 
    currentBranch, fetchInitialData 
  } = useERPStore();

  const [activeSubView, setActiveSubView] = useState<"history" | "ocr">("ocr");

  // OCR state
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // High-fidelity parsed Verification Form States
  const [ocrPayload, setOcrPayload] = useState<any | null>(null);
  const [ocrInvoiceNo, setOcrInvoiceNo] = useState("");
  const [ocrSupplierId, setOcrSupplierId] = useState("");
  const [ocrVerifiedItems, setOcrVerifiedItems] = useState<any[]>([]);
  const [ocrTotalSum, setOcrTotalSum] = useState<number>(0);

  // File trigger simulation helper
  const handleSimulateOCR = async (docType: "supreme" | "hindustan") => {
    setIsProcessing(true);
    setFileSelected(true);
    setFileName(docType === "supreme" ? "SUPREME_WHOLESALE_INV_9921.PDF" : "HFMC_DIST_BILL_0131.PNG");

    const dummyFileBytes = "JVBERi0xLjQKJSDi48U1" + Math.random().toString(); // raw dummy chunk
    const mimeType = docType === "supreme" ? "application/pdf" : "image/png";

    // Launch full stack API call!
    const resp = await processInvoiceOCR(dummyFileBytes, fileName, mimeType);
    
    setIsProcessing(false);
    if (resp && resp.success && resp.payload) {
      const payload = resp.payload;
      setOcrPayload(payload);
      setOcrInvoiceNo(payload.invoiceNumber || `PO-AI-${Date.now().toString().slice(-4)}`);
      
      // Match supplier list
      const matchedSupp = suppliers.find(s => s.name.toLowerCase().includes(payload.supplierName.toLowerCase())) || suppliers[0];
      setOcrSupplierId(matchedSupp ? matchedSupp.id : "s-1");
      
      // Map extracted line items to editable structures
      const verifiedItems = payload.items.map((it: any) => {
        // Attempt catalog barcode match
        const catProd = products.find(p => p.name.toLowerCase().includes(it.productName.toLowerCase()) || p.barcode === it.barcode);
        
        return {
          productId: catProd ? catProd.id : "p-temp",
          name: it.productName,
          barcode: it.barcode || catProd?.barcode || "8901030753541",
          quantity: it.quantity || 100,
          costPrice: it.unitPrice || 45,
          gstRate: it.gstRate || 18,
          hsnCode: catProd ? catProd.hsnCode : "19053100"
        };
      });

      setOcrVerifiedItems(verifiedItems);
      setOcrTotalSum(payload.invoiceTotal || verifiedItems.reduce((acc, curr) => acc + (curr.quantity * curr.costPrice), 0));
    } else {
      alert("AI extraction timed out. Please check LAN port 3000 connectivity or Gemini credentials.");
    }
  };

  // Drag Drop simulator Trigger
  const handleFileDropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSimulateOCR("supreme");
    }
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    setOcrVerifiedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConfirmStockIngress = async () => {
    if (ocrVerifiedItems.length === 0) return;
    
    const success = await createPurchaseReceipt({
      supplierId: ocrSupplierId,
      invoiceNumber: ocrInvoiceNo,
      items: ocrVerifiedItems
    });

    if (success) {
      alert(`🎉 Goods fully received! Stock updated at ${currentBranch?.name || "Main Whitefield Hub"}. Outstanding billing of ₹${ocrTotalSum} accrued to Supplier account.`);
      setOcrPayload(null);
      setFileSelected(false);
      setFileName("");
      setOcrVerifiedItems([]);
      setActiveSubView("history");
    } else {
      alert("Ingress posting failed. Verify catalog item IDs mapping.");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROL */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900">Purchase Ledger & OCR Doc AI</h2>
          <p className="text-sm text-gray-500 font-sans">Automate wholesale invoice ingress data-entry registers using local Gemini AI.</p>
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button 
            onClick={() => setActiveSubView("ocr")}
            className={`text-xs py-1.5 px-4 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeSubView === 'ocr' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            <Sparkles className="h-4 w-4 text-brand-500" /> AI Document Scanner
          </button>
          <button 
            onClick={() => setActiveSubView("history")}
            className={`text-xs py-1.5 px-4 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeSubView === 'history' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
          >
            <Calendar className="h-4 w-4" /> Purchase Inflow Records
          </button>
        </div>
      </div>

      {activeSubView === "ocr" && (
        <>
          {!fileSelected ? (
            /* HERO AI UPLOAD SPLASH ZONE */
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center max-w-3xl mx-auto space-y-6 shadow-xs mt-6">
              <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto">
                <UploadCloud className="h-8 w-8 text-brand-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 font-display">Drag and upload Wholesale purchase receipt</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">Upload scanned JPEG invoices, PNG photo crops, or PDF delivery challans from FMCG supplier catalogs. AI will read lines automatically.</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <label className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl shadow-xs transition-all cursor-pointer">
                  Browse Documents
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileDropUpload}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* SIMULATION HOT TIERS */}
              <div className="pt-6 border-t border-gray-50 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">Offline LAN simulator presets (Mimic Scanner)</span>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => handleSimulateOCR("supreme")}
                    className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 px-4 rounded-xl text-gray-600 font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  >
                    📄 Simulate Supreme Biscuits Invoice (PDF)
                  </button>
                  <button 
                    onClick={() => handleSimulateOCR("hindustan")}
                    className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 py-3 px-4 rounded-xl text-gray-600 font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                  >
                    📸 Simulate Hindustan Dairy Bill (PNG)
                  </button>
                </div>
              </div>
            </div>
          ) : isProcessing ? (
            /* LOADER SCREEN */
            <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center max-w-xl mx-auto space-y-6">
              <RefreshCw className="h-12 w-12 text-brand-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest font-mono">LAN Gemini AI Engine Active</h4>
                <p className="text-xs text-gray-400">Reading wholesale metadata, aligning product categories, CGST/SGST ledger allocations...</p>
              </div>
            </div>
          ) : (
            /* AI HIGH-FIDELITY CO-ORDINATOR MATCHING CANVAS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: SIMULATED INVOICE SHEET PREVIEW */}
              <div className="lg:col-span-4 bg-stone-50 border border-stone-200 p-4 rounded-2xl shadow-inner min-h-[400px] space-y-6">
                <div className="border-b border-dashed border-stone-300 pb-3">
                  <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded font-mono uppercase">AI DOCUMENT UNDER SCAN</span>
                  <p className="text-xs font-mono font-bold mt-2 text-stone-800">{fileName}</p>
                </div>

                <div className="bg-white p-4 font-mono text-[10px] text-stone-700 leading-relaxed rounded shadow border border-stone-200 space-y-4">
                  <div className="text-center border-b pb-2">
                    <h5 className="font-extrabold uppercase">{ocrPayload?.supplierName || "WHOLESALER MERCHANT"}</h5>
                    <p className="text-[9px]">TAX RECPT/INVOICE SUMMARY SHEET. INC.</p>
                    <p className="text-[8px] text-stone-400">GSTIN: {ocrPayload?.supplierGstin || "29AAAAA1111A1Z1"}</p>
                  </div>
                  
                  <div className="text-[9px] space-y-0.5">
                    <p>INVOICE CODE ID: {ocrInvoiceNo}</p>
                    <p>DATE: {new Date().toLocaleDateString()}</p>
                    <p>FOR SHIPPING DISPATCH: INWARD GOODS STORAGE</p>
                  </div>

                  <div className="border-y border-dashed py-2 space-y-1.5 text-[9px]">
                    <div className="grid grid-cols-12 font-bold text-stone-850">
                      <span className="col-span-6">Extracted Product Line</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-4 text-right">Cost unit</span>
                    </div>
                    {ocrPayload?.items?.map((it: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 text-stone-600">
                        <span className="col-span-6 truncate font-sans">{it.productName}</span>
                        <span className="col-span-2 text-center font-mono">{it.quantity}</span>
                        <span className="col-span-4 text-right font-mono">₹{it.unitPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-[11px] font-extrabold">
                    <p>TOTAL EXTRACTED VALUE: ₹{ocrTotalSum}</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: INTERACTIVE FORM EDIT MATCHING */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-brand-500" /> AI-Extraction Verification Pane
                  </h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">Edit billing classifications carefully prior to posting actual stock additions to physical warehouse locations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Map dropdown */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Target Supplier Register</label>
                    <select 
                      value={ocrSupplierId}
                      onChange={(e) => setOcrSupplierId(e.target.value)}
                      className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-800"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice Code */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Extracted Supplier Invoice ID Code</label>
                    <input 
                      type="text" 
                      value={ocrInvoiceNo}
                      onChange={(e) => setOcrInvoiceNo(e.target.value)}
                      className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Extracted table lines editing */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-gray-400 font-sans tracking-wide">Lines Alignment Form</h4>
                  <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-150">
                    
                    {ocrVerifiedItems.map((item, index) => {
                      // Lookup corresponding product in stock
                      const matchedStockProd = products.find(p => p.id === item.productId || p.barcode === item.barcode);

                      return (
                        <div key={index} className="p-4 bg-gray-55/10 hover:bg-gray-50 transition-colors space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <span className="text-[10px] bg-brand-50 text-brand-700 font-mono font-bold px-2.5 py-0.5 rounded uppercase">Line #{index+1}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">Matched catalog: <span className="text-emerald-700 font-bold">{matchedStockProd ? matchedStockProd.name : "N/A - WILL REGISTER AS INGRESS NEW"}</span></span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Product Title */}
                            <div className="col-span-2">
                              <label className="text-[9px] uppercase font-bold text-gray-450 font-mono">Extracted label</label>
                              <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleLineItemChange(index, "name", e.target.value)}
                                className="w-full text-xs mt-1 border border-gray-200 bg-white px-2 py-1.5 rounded-lg font-bold"
                              />
                            </div>
                            {/* Barcode mapping */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-gray-450 font-mono">Mapped barcode</label>
                              <input 
                                type="text"
                                value={item.barcode}
                                onChange={(e) => handleLineItemChange(index, "barcode", e.target.value)}
                                className="w-full text-xs mt-1 border border-gray-200 bg-white px-2 py-1.5 rounded-lg font-mono"
                              />
                            </div>
                            {/* Subtitle count */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-gray-450 font-mono">Quantity Units</label>
                              <input 
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, "quantity", Number(e.target.value))}
                                className="w-full text-xs mt-1 border border-gray-200 bg-white px-2 py-1.5 rounded-lg font-mono font-bold"
                              />
                            </div>
                            
                            {/* Cost unit */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-gray-450 font-mono">Unit Cost Price (₹)</label>
                              <input 
                                type="number"
                                value={item.costPrice}
                                onChange={(e) => handleLineItemChange(index, "costPrice", Number(e.target.value))}
                                className="w-full text-xs mt-1 border border-gray-200 bg-white px-2 py-1.5 rounded-lg font-mono font-bold text-gray-900"
                              />
                            </div>

                            {/* Indian GST rate */}
                            <div>
                              <label className="text-[9px] uppercase font-bold text-gray-450 font-mono">Aligned GST Slabs</label>
                              <select 
                                value={item.gstRate}
                                onChange={(e) => handleLineItemChange(index, "gstRate", Number(e.target.value))}
                                className="w-full text-xs mt-1 border border-gray-200 bg-white p-1.5 rounded-lg text-gray-700 font-mono"
                              >
                                <option value={0}>0% Slab</option>
                                <option value={5}>5% Slab</option>
                                <option value={12}>12% Slab</option>
                                <option value={18}>18% Slab</option>
                                <option value={28}>28% Slab</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Submits and controls */}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 capitalize">Final ledger balance addition</span>
                    <h5 className="text-base font-bold text-gray-900 font-mono">Total Balance: ₹{(ocrTotalSum).toLocaleString("en-IN")}</h5>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFileSelected(false);
                        setOcrPayload(null);
                        setOcrVerifiedItems([]);
                      }}
                      className="text-xs bg-white border border-gray-250 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-100"
                    >
                      Reset Upload
                    </button>
                    <button 
                      onClick={handleConfirmStockIngress}
                      className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-transform hover:scale-[1.01]"
                    >
                      Confirm Stock Ingress Flow
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {activeSubView === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 font-mono uppercase">Wholesale purchase receipts ledger</h3>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold font-mono">
                  <th className="p-4 pl-6">INVOICE CODE</th>
                  <th className="p-4">SUPPLIER TRADEMARK</th>
                  <th className="p-4 text-center">ORDER CALENDAR DATA</th>
                  <th className="p-4 text-right">SUBTOTAL EXCLUDED TAX</th>
                  <th className="p-4 text-right">Integrated GST</th>
                  <th className="p-4 text-right pr-6">GRAND BILL VALUE WITH TAX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {purchases.map((po, idx) => (
                  <tr key={po.id || idx} className="hover:bg-gray-55/20 transition-colors">
                    <td className="p-4 pl-6 font-mono font-bold text-brand-700">{po.invoiceNumber}</td>
                    <td className="p-4 font-bold text-gray-900">{po.supplierName}</td>
                    <td className="p-4 text-center font-mono text-gray-500">{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-mono">₹{po.subtotal.toLocaleString("en-IN")}</td>
                    <td className="p-4 text-right font-mono text-brand-600">₹{po.taxAmount.toLocaleString("en-IN")}</td>
                    <td className="p-4 text-right pr-6 font-mono font-extrabold text-gray-900">₹{po.totalWithTax.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
