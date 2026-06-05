/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Barcode, Search, User, CreditCard, DollarSign, QrCode, 
  Trash2, ShoppingBag, Plus, Minus, Printer, CheckCircle, Tag, Settings
} from "lucide-react";
import { useERPStore } from "../store";
import { Product, Customer, SaleInvoice } from "../types";

export function POSBilling() {
  const { 
    products, customers, recordSaleCheckout, currentUser, currentBranch 
  } = useERPStore();

  // Local state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "UPI" | "Credit" | "Split">("Cash");
  const [customerMobile, setCustomerMobile] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [continuousScan, setContinuousScan] = useState(true);
  const [scannedMessage, setScannedMessage] = useState("");
  const [receiptModel, setReceiptModel] = useState<"58mm" | "80mm">("80mm");
  const [completedInvoice, setCompletedInvoice] = useState<SaleInvoice | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Autofocus the scanner simulation field
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Continuous auto-refocus if continuous scan check is enabled
  useEffect(() => {
    const handler = () => {
      if (continuousScan && barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
        // Only refocus if user is not typing in standard fields like search or phone numbers
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== "INPUT" && activeTag !== "SELECT" && activeTag !== "TEXTAREA") {
          barcodeInputRef.current.focus();
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [continuousScan]);

  // Handle Scan trigger
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    const matchedProd = products.find(p => p.barcode === barcode);
    if (matchedProd) {
      addToCart(matchedProd);
      setScannedMessage(`Scanned: ${matchedProd.name}`);
      setTimeout(() => setScannedMessage(""), 3000);
    } else {
      setScannedMessage("❌ Product Barcode not registered in LAN catalog.");
      setTimeout(() => setScannedMessage(""), 4000);
    }
    setBarcodeInput("");
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          sellingPrice: product.sellingPrice,
          gstRate: product.gstRate,
          discount: 0,
          qty: 1
        }];
      }
    });
    setCompletedInvoice(null); // Clear previous receipt on additions 
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const handleMobileLookup = (val: string) => {
    setCustomerMobile(val);
    const m = customers.find(c => c.phone === val.trim());
    if (m) {
      setMatchedCustomer(m);
    } else {
      setMatchedCustomer(null);
    }
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, curr) => acc + (curr.sellingPrice * curr.qty), 0);
  
  // Calculations for Indian GST Included
  // Value = SellingPrice * Qty
  // CGST = Value / (1 + GST/100) * (GST/200)
  // SGST = Value / (1 + GST/100) * (GST/200)
  const totalTax = cart.reduce((acc, curr) => {
    const lineTotal = curr.sellingPrice * curr.qty;
    const gstRate = curr.gstRate || 0;
    const lineTax = lineTotal - (lineTotal / (1 + gstRate / 100));
    return acc + lineTax;
  }, 0);

  const grandTotal = Math.max(0, cartSubtotal - checkoutDiscount);

  // Quick Preset Barcode swiper trigger for easier interactive testing:
  const presetBarcodes = [
    { name: "Lipton Green Tea", code: "8901030753541" },
    { name: "Amul Salted Butter", code: "8901262010078" },
    { name: "Marie Gold Biscuit", code: "8901063141476" },
    { name: "Coca Cola Original", code: "5449000000996" },
    { name: "Nescafe Classic Jar", code: "7613035824123" },
    { name: "Tata Iodized Salt", code: "8901058002317" },
    { name: "Premium Basmati Rice", code: "8906001235123" },
    { name: "Dove Soap Cream", code: "8717163712312" }
  ];

  // Checkout submission
  const handlePOSCheckout = async () => {
    if (cart.length === 0) return;
    const res = await recordSaleCheckout({
      items: cart,
      paymentMethod,
      discountAmount: checkoutDiscount,
      customerMobile: matchedCustomer ? matchedCustomer.phone : customerMobile || undefined,
      couponCode: couponCode || undefined
    });

    if (res) {
      setCompletedInvoice(res);
      setCart([]);
      setCheckoutDiscount(0);
      setCouponCode("");
      setCustomerMobile("");
      setMatchedCustomer(null);
    }
  };

  const handlePrintCommand = () => {
    window.print();
  };

  // Search filtered products
  const filteredProducts = searchQuery.trim() 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery))
    : products.slice(0, 5); // display limited seeds initially under POS panel to preserve space

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* LEFT: CART SECTIONS & BARCODE SCANNER CONTROLLER */}
      <div className="xl:col-span-8 space-y-6">
        
        {/* TOP POS HEADER BAR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">POS Terminals Cashier desk</h2>
              <p className="text-xs text-gray-400">Current Login: <span className="font-semibold text-brand-600 font-mono">{currentUser?.name || "David Miller"}</span> | Register No: <span className="font-medium font-mono text-gray-800">CTR-01 / Whitefield</span></p>
            </div>
          </div>

          {/* Barcode continuous simulator input */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Barcode className="h-4 w-4" />
              </span>
              <input 
                ref={barcodeInputRef}
                type="text" 
                placeholder="Scan / Type Barcode number..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full text-xs font-mono font-medium pl-10 pr-3 py-2 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white shadow-inner"
              />
            </div>
            <button 
              type="submit"
              className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-3 rounded-xl transition-all"
            >
              Scan
            </button>
          </form>
        </div>

        {/* SWIPER BARCODE PRESISTS (FAST TESTING PRESETS) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 font-mono flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> Fast Barcode Swiper Preset Simulator (LAN testing gun)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input 
                type="checkbox" 
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-gray-500 font-medium">Auto-focus Scanner</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {presetBarcodes.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setBarcodeInput(item.code);
                  // Fire immediately mimicking manual continuous hardware trigger
                  const matched = products.find(p => p.barcode === item.code);
                  if (matched) {
                    addToCart(matched);
                    setScannedMessage(`Triggered: ${matched.name}`);
                    setTimeout(() => setScannedMessage(""), 2000);
                  }
                  setBarcodeInput("");
                }}
                className="text-[11px] bg-brand-50 hover:bg-brand-100/80 text-brand-700 font-medium py-1 px-2.5 rounded-lg border border-brand-100/50 transition-colors uppercase tracking-wider font-mono"
              >
                📟 {item.name}
              </button>
            ))}
          </div>
          {scannedMessage && (
            <div className="text-xs font-mono font-bold text-brand-600 animate-pulse py-1 pl-1">
              {scannedMessage}
            </div>
          )}
        </div>

        {/* CRM MAPPING VIP SEARCH & PRODUCT QUICK-DISPATCH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CRM VIP matching */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-sans">
              <User className="h-4 w-4 text-brand-500" /> Customer Loyalty CRM Integration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono">Mobile Number lookup</label>
                <input 
                  type="text" 
                  placeholder="Type 10 digit register (eg. 9876543210)"
                  value={customerMobile}
                  onChange={(e) => handleMobileLookup(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-800 font-medium focus:outline-none"
                />
              </div>

              {matchedCustomer ? (
                <div className="p-3 bg-brand-50/75 border border-brand-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-900 font-display">{matchedCustomer.name}</span>
                    <span className="text-[10px] bg-brand-200 text-brand-800 font-bold px-2 py-0.5 rounded-sm">VIP LOYALTY MEMBER</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-brand-700 font-mono">
                    <span>Outstanding Loyalty points:</span>
                    <span className="font-bold font-mono text-brand-900">{matchedCustomer.loyaltyPoints} Pts</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">Registered member since {matchedCustomer.membershipDate} ({matchedCustomer.purchaseCount} purchases logged)</div>
                </div>
              ) : customerMobile.length >= 10 ? (
                <div className="p-2 bg-amber-50 border border-amber-200/50 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] text-amber-800 font-medium">Customer Mobile unregistered.</span>
                  <button 
                    onClick={() => {
                      const namesPreset = ["Reena Singh", "Sanjay Kumar", "Latha Murthy", "Vikram Patel"];
                      const mockName = namesPreset[Math.floor(Math.random() * namesPreset.length)];
                      const mNew = { id: `c-${Date.now()}`, name: mockName, phone: customerMobile, loyaltyPoints: 20, membershipDate: new Date().toISOString(), purchaseCount: 1 };
                      customers.push(mNew);
                      setMatchedCustomer(mNew);
                    }}
                    className="text-[10px] text-brand-700 font-semibold underline"
                  >
                    Quick Add VIP Profile
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Catalog Speed Search */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-sans">
              <Search className="h-4 w-4 text-brand-500" /> Manual Product quick finder
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Product name / Brand key search (e.g., Tea)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-800 font-medium focus:outline-none"
              />

              {searchQuery.trim() && (
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-[110px] overflow-y-auto bg-gray-50">
                  {filteredProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => addToCart(prod)}
                      className="p-2 flex items-center justify-between text-xs cursor-pointer hover:bg-brand-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-700">{prod.name}</p>
                        <p className="text-[9px] text-gray-400 font-mono">Barcode: {prod.barcode}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">₹{prod.sellingPrice}</span>
                        <p className="text-[9px] text-brand-600 font-semibold uppercase">{prod.unit}</p>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="p-3 text-[10px] text-gray-400 text-center">No products found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CURRENT CHECKOUT SHOPPING CART LIST */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              📋 Real-Time Register Cart ({cart.length} unique lines)
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Clear Register
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-50 max-h-[280px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Barcode className="h-12 w-12 text-gray-200 mx-auto stroke-1" />
                <h4 className="text-sm font-bold text-gray-500 mt-3 font-display">LAN POS Billing Terminal Waiting</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Please scan a registered supermarket product barcode using the scanner bar or click on the swiper preset models above.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-55/40 transition-colors">
                  <div className="space-y-1 md:max-w-md">
                    <p className="text-xs font-bold text-gray-800">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-mono">
                      <span>Barcode: {item.barcode}</span>
                      <span>•</span>
                      <span>GST Incl Rate: {item.gstRate}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 self-stretch md:self-auto">
                    {/* QUANTITY BLOCK */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1 bg-gray-50">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-extrabold font-mono text-gray-800 w-8 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* PRICING LINE (GST EXCLUDED SHOWN IN BREAKDOWN) */}
                    <div className="text-right w-24">
                      <span className="text-xs font-extrabold text-gray-900 font-mono">₹{(item.sellingPrice * item.qty).toLocaleString("en-IN")}</span>
                      <p className="text-[10px] text-gray-400">@ ₹{item.sellingPrice}/ea</p>
                    </div>

                    {/* ACTIONS */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded-sm hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors self-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PAYMENT METHODS & BILL SUBMISSION */}
        {cart.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans border-b border-gray-50 pb-2">
              💳 Checkout & Remittance Settler
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PAYMENT PICKER */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 font-mono">Settle Category Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setPaymentMethod("Cash")}
                    className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${paymentMethod === 'Cash' ? 'bg-brand-600 text-white border-brand-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <DollarSign className="h-4 w-4" /> Cash Counter
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("Card")}
                    className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${paymentMethod === 'Card' ? 'bg-brand-600 text-white border-brand-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <CreditCard className="h-4 w-4" /> POS Swipe Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("UPI")}
                    className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${paymentMethod === 'UPI' ? 'bg-brand-600 text-white border-brand-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <QrCode className="h-4 w-4" /> UPI NetQR
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("Credit")}
                    className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-3 rounded-xl border transition-all ${paymentMethod === 'Credit' ? 'bg-brand-600 text-white border-brand-600 shadow-inner' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <User className="h-4 w-4" /> Credit Account
                  </button>
                </div>
              </div>

              {/* OVERALL TRADE DISCOUNTS */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 font-mono">Remit Discount (INR ₹)</label>
                  <input 
                    type="number" 
                    placeholder="Discount amount. E.g. ₹50"
                    value={checkoutDiscount || ""}
                    onChange={(e) => setCheckoutDiscount(Number(e.target.value))}
                    className="w-full text-xs mt-1 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-800 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400 font-mono">Coupon voucher</label>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      placeholder="e.g. EXTRA50"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 text-xs bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-gray-800 font-medium font-mono"
                    />
                    <button 
                      onClick={() => {
                        if (couponCode === "SPECIAL10") {
                          setCheckoutDiscount(Math.floor(cartSubtotal * 0.10));
                          setScannedMessage("🎟️ Coupon SPECIAL10 custom 10% applied!");
                          setTimeout(() => setScannedMessage(""), 3000);
                        } else {
                          setCheckoutDiscount(30);
                        }
                      }}
                      className="text-xs shrink-0 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-850 px-3 rounded-xl transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* GRAND SUBCOMMIT PANEL */}
            <div className="bg-brand-50/50 rounded-2xl border border-brand-100/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-900 font-display">Net Payable Bill</span>
                <h3 className="text-4xl font-extrabold text-brand-950 font-mono">₹{grandTotal.toLocaleString("en-IN")}</h3>
                <div className="flex gap-4 text-[10px] font-mono text-brand-700">
                  <span>Gross: ₹{cartSubtotal}</span>
                  <span>GST Sum: ₹{totalTax.toFixed(2)}</span>
                  {checkoutDiscount > 0 && <span className="text-rose-600 font-semibold">-Discount: ₹{checkoutDiscount}</span>}
                </div>
              </div>

              <button 
                onClick={handlePOSCheckout}
                className="w-full md:w-auto text-center font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl shadow-md cursor-pointer hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 self-stretch md:self-auto"
              >
                <CheckCircle className="h-5 w-5" /> Generate Bill & Print Receipt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: INTERACTIVE THERMAL PRINTER EMULATOR */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-800">LAN Thermal Printer</h3>
              <p className="text-xs text-gray-400 font-mono">LAN Port 3000 Loop</p>
            </div>
            
            {/* Toggle Receipt template size */}
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button 
                onClick={() => setReceiptModel("58mm")}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-md transition-all ${receiptModel === '58mm' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
              >
                58mm
              </button>
              <button 
                onClick={() => setReceiptModel("80mm")}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-md transition-all ${receiptModel === '80mm' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-400 hover:text-gray-700'}`}
              >
                80mm
              </button>
            </div>
          </div>

          {/* THERMAL PAPER VISUAL MODEL */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5 relative shadow-inner overflow-hidden">
            {/* Top wave tear line */}
            <div className="h-2 w-full absolute top-0 left-0 bg-[repeat-x] opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' width='10' height='10'%3E%3Cpath d='M0 5 L5 10 L10 5 L10 10 L0 10 Z' fill='black'/%3E%3C/svg%3E")` }}></div>
            
            <div id="printable-receipt-area" className="bg-white p-4 font-mono text-[10px] md:text-xs text-stone-850 leading-relaxed shadow-sm min-h-[480px] select-all border-y border-stone-200">
              {/* MAIN EMULATION TEXT AREA */}
              <div className="text-center space-y-1 py-4 border-b border-dashed border-stone-300">
                <h4 className="text-xs md:text-sm font-extrabold tracking-wide uppercase font-display">NEURETAIL ERP SUPERMARKET</h4>
                <p className="text-[9px] uppercase font-semibold text-stone-600">Smart Retail Solutions by NeuNet Tech</p>
                <p className="text-[9px] text-stone-500">WHITEFIELD BRANCH: WHITEFIELD MAIN RD, BLR</p>
                <p className="text-[9px] text-stone-500">PHONE: +91 80 4432 9901 | GSTIN: 29NRNET1111A1Z0</p>
              </div>

              {/* Invoice details */}
              <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-[9px] text-stone-600">
                {completedInvoice ? (
                  <>
                    <p className="font-bold">INVOICE: {completedInvoice.invoiceNumber}</p>
                    <p>DATE: {new Date(completedInvoice.timestamp).toLocaleString()}</p>
                    <p>COUNTER: CTR-01 (LAN TERMINAL HOST)</p>
                    <p>OPERATOR (CASHIER): {completedInvoice.cashierName}</p>
                    {completedInvoice.customerName && (
                      <p className="font-bold">CUSTOMER: {completedInvoice.customerName} ({completedInvoice.customerPhone})</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-bold">INVOICE: POS-YYYYMMDD-XXXX (PREVIEW)</p>
                    <p>DATE: {new Date().toLocaleString()}</p>
                    <p>COUNTER: CTR-01 (LAN STANDBY)</p>
                    <p>CASHIER: {currentUser?.name || "David Miller"}</p>
                    {matchedCustomer && (
                      <p className="font-bold">CUSTOMER MATCHED: {matchedCustomer.name}</p>
                    )}
                  </>
                )}
              </div>

              {/* Items Table based on emulated width selection */}
              <div className="py-3 border-b border-dashed border-stone-300">
                {receiptModel === "80mm" ? (
                  /* 80mm GST Columns Layout */
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-12 font-bold uppercase text-[9px] text-stone-700 border-b border-dashed border-stone-200 pb-1 pb-1">
                      <span className="col-span-5">Product Name</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-1 text-center">GST</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>

                    {(completedInvoice ? completedInvoice.items : cart).map((item: any, idx: number) => {
                      const qty = item.qty || item.quantity;
                      const price = item.sellingPrice;
                      const gst = item.gstRate;
                      const sum = qty * price;
                      
                      return (
                        <div key={idx} className="grid grid-cols-12 text-[10px] items-center text-stone-850">
                          <span className="col-span-5 truncate">{item.name}</span>
                          <span className="col-span-2 text-center font-mono">{qty}</span>
                          <span className="col-span-2 text-right font-mono">{price}</span>
                          <span className="col-span-1 text-center font-mono text-[8px]">{gst}%</span>
                          <span className="col-span-2 text-right font-mono">{(sum).toFixed(0)}</span>
                        </div>
                      );
                    })}

                    {(completedInvoice ? completedInvoice.items : cart).length === 0 && (
                      <p className="text-center text-[10px] text-stone-400 py-6">Register drawer is empty.</p>
                    )}
                  </div>
                ) : (
                  /* 58mm Slim Cash Ticket Layout */
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-[9px] text-stone-700 border-b border-dashed border-stone-200 pb-1">
                      <span>Item Descr.</span>
                      <span>Qty x Price = Subtot</span>
                    </div>

                    {(completedInvoice ? completedInvoice.items : cart).map((item: any, idx: number) => (
                      <div key={idx} className="space-y-0.5 text-stone-800 text-[10px]">
                        <p className="font-bold">{item.name}</p>
                        <div className="flex justify-between text-[9px] font-mono pl-1">
                          <span>{item.qty || item.quantity} Pcs x ₹{item.sellingPrice}</span>
                          <span>₹{((item.qty || item.quantity) * item.sellingPrice).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}

                    {(completedInvoice ? completedInvoice.items : cart).length === 0 && (
                      <p className="text-stone-400 py-4 text-center">Empty printer reel.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Totals breakout */}
              <div className="pt-3 space-y-1.5 text-stone-850 text-right text-[10px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span className="font-mono">₹{(completedInvoice ? completedInvoice.subtotal : cartSubtotal).toLocaleString("en-IN")}</span>
                </div>
                
                <div className="flex justify-between text-stone-500">
                  <span>OUT TAX GST (SGST+CGST INCL.):</span>
                  <span className="font-mono">₹{(completedInvoice ? completedInvoice.gstTotal : totalTax).toFixed(2)}</span>
                </div>

                {(completedInvoice ? completedInvoice.discountTotal : checkoutDiscount) > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>DISCOUNT APPLIED:</span>
                    <span className="font-mono">-₹{(completedInvoice ? completedInvoice.discountTotal : checkoutDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs md:text-sm font-extrabold border-t border-dashed border-stone-300 pt-2 text-stone-900 leading-none">
                  <span>GRAND NET AMOUNT:</span>
                  <span className="font-mono uppercase font-display select-all">₹{(completedInvoice ? completedInvoice.grandTotal : grandTotal).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-[9px] text-stone-600 font-mono border-t border-stone-100 pt-1">
                  <span>METHOD REMITTED:</span>
                  <span className="font-bold uppercase font-mono tracking-wider">{completedInvoice ? completedInvoice.paymentMethod : paymentMethod} CARD DESK</span>
                </div>
              </div>

              {/* FOOTER THANK YOU NOTE & BARCODE PRINT */}
              <div className="text-center space-y-2 mt-6 pt-4 border-t border-dashed border-stone-400/50">
                <p className="text-[10px] font-medium tracking-wide">**** THANK YOU - VISIT US AGAIN ****</p>
                <p className="text-[8px] text-stone-450 leading-relaxed uppercase">NEURETAIL CLOUD ERP LAN GATEWAY v3.1<br/>DEVELOPED BY NEUNET TECH SOLUTIONS</p>
                
                {/* Visual Barcode display mimicking direct laser printers */}
                <div className="flex flex-col items-center justify-center p-2 rounded bg-stone-50 border border-stone-100">
                  <span className="text-[18px] opacity-75 inline-block font-mono font-medium tracking-[0.25em] text-gray-800">
                    ||||| | |||| || ||| || ||| ||||
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase">
                    {completedInvoice ? completedInvoice.invoiceNumber : "POS-TERMINAL-CTR01"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom wave tear line */}
            <div className="h-2 w-full absolute bottom-0 left-0 bg-[repeat-x] opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' width='10' height='10'%3E%3Cpath d='M0 5 L5 10 L10 5 L10 10 L0 10 Z' fill='black'/%3E%3C/svg%3E")` }}></div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handlePrintCommand}
              className="flex-1 text-center font-bold text-xs bg-gray-150 hover:bg-gray-200 text-gray-800 py-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="h-4 w-4" /> Hardware Print
            </button>
            
            <button 
              onClick={() => {
                alert("Thermal continuous scanner loop active! Standard carriage gun suffix return is enabled. Open localhost COM ports to bind actual TVS/Zebra print servers.");
              }}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-3 rounded-lg font-bold"
              title="Printer settings options"
            >
              Setup ESC/POS
            </button>
          </div>
        </div>

        {/* KEYBOARD SHORTCUTS LEGEND */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
          <h4 className="text-xs font-bold uppercase text-gray-400 font-sans tracking-wider">⌨️ Supermarket Desk Hotkeys Legend</h4>
          <div className="divide-y divide-gray-50 text-[11px] text-gray-500">
            <div className="py-2 flex justify-between font-mono">
              <span className="font-bold text-gray-700">ESC</span>
              <span>Clear Cart Registers</span>
            </div>
            <div className="py-2 flex justify-between font-mono">
              <span className="font-bold text-gray-700">F2</span>
              <span>Focus Barcode input box</span>
            </div>
            <div className="py-2 flex justify-between font-mono">
              <span className="font-bold text-gray-700">F4</span>
              <span>Add custom CRM customer lookup</span>
            </div>
            <div className="py-2 flex justify-between font-mono">
              <span className="font-bold text-gray-700">Enter</span>
              <span>Submit barcode search</span>
            </div>
            <div className="py-2 flex justify-between font-mono">
              <span className="font-bold text-gray-700">F8</span>
              <span>Submit Checkout pay remittance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
