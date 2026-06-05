/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, Filter, UploadCloud, 
  Barcode, CheckCircle, RefreshCw, Layers, Printer
} from "lucide-react";
import { useERPStore } from "../store";
import { Product } from "../types";

export function ProductManagement() {
  const { 
    products, categories, createProduct, deleteProduct, bulkImportProducts, 
    createCategory, currentBranch 
  } = useERPStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");

  // Add / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Groceries & Staples");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("Pcs");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [gstRate, setGstRate] = useState("18"); // default standard slab
  const [hsnCode, setHsnCode] = useState("");
  const [minStock, setMinStock] = useState("20");

  // Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatCode, setNewCatCode] = useState("");
  const [showCatForm, setShowCatForm] = useState(false);

  // Barcode Label Print Dialog
  const [selectedBarcodeProd, setSelectedBarcodeProd] = useState<Product | null>(null);
  const [printLabelCount, setPrintLabelCount] = useState(12);

  // CSV Mock File selector state
  const [csvStatus, setCsvStatus] = useState("");

  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setEditingId(p.id);
    setBarcode(p.barcode);
    setName(p.name);
    setCategory(p.category);
    setBrand(p.brand);
    setUnit(p.unit);
    setCostPrice(String(p.costPrice));
    setSellingPrice(String(p.sellingPrice));
    setGstRate(String(p.gstRate));
    setHsnCode(p.hsnCode);
    setMinStock(String(p.minStockLevel));
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setBarcode(Math.floor(8901000000000 + Math.random() * 999999).toString()); // Mock GS1 barcode prefix
    setName("");
    setCategory(categories[0]?.name || "Groceries & Staples");
    setBrand("");
    setUnit("Pcs");
    setCostPrice("");
    setSellingPrice("");
    setGstRate("12");
    setHsnCode(Math.floor(10000000 + Math.random() * 89999999).toString());
    setMinStock("20");
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !name || !sellingPrice) {
      alert("Please provide Barcode, Product Name and a valid Selling Price.");
      return;
    }

    const payload: Partial<Product> = {
      id: editingId || undefined,
      barcode: barcode.trim(),
      name: name.trim(),
      category,
      brand: brand || "Generic",
      unit,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice),
      gstRate: Number(gstRate) || 0,
      hsnCode: hsnCode || "00000000",
      minStockLevel: Number(minStock) || 10
    };

    const success = await createProduct(payload);
    if (success) {
      setShowForm(false);
      resetFields();
    } else {
      alert("Error saving barcode product to LAN Server.");
    }
  };

  const resetFields = () => {
    setBarcode("");
    setName("");
    setBrand("");
    setCostPrice("");
    setSellingPrice("");
    setHsnCode("");
    setEditingId(null);
  };

  const handleCategoryCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;
    const succ = await createCategory(newCatName, newCatCode);
    if (succ) {
      setNewCatName("");
      setNewCatCode("");
      setShowCatForm(false);
    }
  };

  // Mock excel importer
  const triggerCSVImport = async () => {
    setCsvStatus("📖 Reading spreadsheets...");
    setTimeout(async () => {
      const mockCSVRows = [
        { barcode: "8901235123991", name: "Maggi Instant Noodles 2-Min 280g", category: "Groceries & Staples", brand: "Nestle", unit: "Pcs", costPrice: "22", sellingPrice: "30", gstRate: "18", hsnCode: "19023010", minStockLevel: "40", qty: "320" },
        { barcode: "8902049210492", name: "Pepsi Cold Drink Pet-Bottle 1.25L", category: "Beverages & Cold Drinks", brand: "PepsiCo", unit: "Pcs", costPrice: "48", sellingPrice: "70", gstRate: "28", hsnCode: "22021010", minStockLevel: "30", qty: "140" },
        { barcode: "8901030310212", name: "Horlicks Nourishing Malt Jar 500g", category: "Dairy & Frozen Food", brand: "GSK", unit: "Jar", costPrice: "245", sellingPrice: "310", gstRate: "18", hsnCode: "19011010", minStockLevel: "15", qty: "65" }
      ];
      
      const res = await bulkImportProducts(mockCSVRows);
      if (res) {
        setCsvStatus("✅ Stock Ingress Successful! 3 FMCG lines loaded.");
        setTimeout(() => setCsvStatus(""), 4000);
      } else {
        setCsvStatus("❌ CSV Parsing Failure");
      }
    }, 1500);
  };

  // Unique Brands
  const uniqueBrands = ["All", ...new Set(products.map(p => p.brand))];

  // Filters application
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    const matchesCat = selectedCat === "All" || p.category === selectedCat;
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;
    return matchesSearch && matchesCat && matchesBrand;
  });

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900">Product Directory Management</h2>
          <p className="text-sm text-gray-500 font-sans">Establish pricing indices, barcode allocations, and taxation GST rate tiers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          <button 
            onClick={triggerCSVImport}
            className="flex-1 lg:flex-none text-xs bg-gray-50 border border-gray-200 hover:bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" /> CSV/Excel Importer
          </button>
          
          <button 
            onClick={() => setShowCatForm(true)}
            className="flex-1 lg:flex-none text-xs bg-gray-50 border border-gray-200 hover:bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers className="h-4 w-4" /> New Category
          </button>

          <button 
            onClick={handleOpenCreate}
            className="flex-1 lg:flex-none text-xs bg-brand-600 hover:bg-brand-700 font-bold text-white py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Register Product
          </button>
        </div>
      </div>

      {csvStatus && (
        <div className="bg-brand-50 text-brand-850 px-4 py-3 rounded-lg border border-brand-100 text-xs font-mono font-semibold animate-pulse flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> {csvStatus}
        </div>
      )}

      {/* FILTER RAILS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search matching barcodes or label names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-gray-50/50"
          />
        </div>

        {/* Brand Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 bg-white rounded-xl">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="text-xs text-gray-700 py-1 focus:outline-none font-semibold cursor-pointer"
          >
            {uniqueBrands.map(b => (
              <option key={b} value={b}>{b === 'All' ? 'Select Brand' : b}</option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 bg-white rounded-xl">
          <Layers className="h-3.5 w-3.5 text-gray-400" />
          <select 
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs text-gray-700 py-1 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN CATALOG BEN-TO TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] tracking-wider uppercase font-extrabold text-gray-400 font-mono">
                <th className="p-4 pl-6">BARCODE LABEL</th>
                <th className="p-4">PRODUCT DEFINITION</th>
                <th className="p-4">BRAND & CATEGORY</th>
                <th className="p-4 text-right">COST PRICE</th>
                <th className="p-4 text-right">SELLING PRICE</th>
                <th className="p-4 text-center">GST RATE</th>
                <th className="p-4 text-center">BRANCH STOCK</th>
                <th className="p-4 text-center">REORDER</th>
                <th className="p-4 pr-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredProducts.map((p) => {
                const stock = p.branchStocks[currentBranch?.id || "br-1"] || 0;
                const isUnderAlert = stock <= p.minStockLevel;
                
                return (
                  <tr key={p.id} className="hover:bg-gray-55/20 transition-colors">
                    {/* Barcode column */}
                    <td className="p-4 pl-6 font-mono font-medium text-gray-600">
                      <div className="flex items-center gap-2">
                        <Barcode 
                          className="h-4.5 w-4.5 text-brand-600 cursor-pointer" 
                          title="Generate Barcode Ticket Sheet" 
                          onClick={() => setSelectedBarcodeProd(p)}
                        />
                        <span className="select-all hover:bg-gray-100 px-1 py-0.5 rounded cursor-copy text-[11px] font-bold text-gray-800">{p.barcode}</span>
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="p-4 font-bold text-gray-900 font-display min-w-[200px]">
                      {p.name}
                      <p className="text-[10px] text-gray-400 font-normal font-mono mt-0.5">HSN Code: {p.hsnCode} | Unit: {p.unit}</p>
                    </td>

                    {/* Brand / Category */}
                    <td className="p-4 space-y-1">
                      <span className="inline-block bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-sm">{p.category}</span>
                      <p className="text-[10px] text-gray-400 font-semibold">{p.brand}</p>
                    </td>

                    {/* Prices */}
                    <td className="p-4 text-right font-mono text-gray-500">₹{p.costPrice}</td>
                    <td className="p-4 text-right font-mono font-extrabold text-gray-900">₹{p.sellingPrice}</td>
                    
                    {/* GST */}
                    <td className="p-4 text-center">
                      <span className="bg-gray-100 text-gray-700 font-mono text-[10px] font-bold py-1 px-2.5 rounded-sm">
                        {p.gstRate}%
                      </span>
                    </td>

                    {/* Stock Multi-branch counter representation */}
                    <td className="p-4 text-center">
                      <span className={`inline-block font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg ${isUnderAlert ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'}`}>
                        {stock} {p.unit}
                      </span>
                    </td>

                    {/* Min stock details */}
                    <td className="p-4 text-center font-mono text-gray-400">Ref: {p.minStockLevel}</td>

                    {/* Action anchors */}
                    <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Do you wish to delete barcode profile: ${p.name}?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete product catalog profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <p className="p-12 text-sm text-center text-gray-400 font-display">No registered products corresponding to criteria. Establish new barcodes with the action register panel.</p>
          )}
        </div>
      </div>

      {/* FORM MODAL: CREATE / UPDATE BARCODE RECORD */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                <Barcode className="h-5 w-5 text-brand-600" /> {isEditing ? "Modify Barcode profile index" : "Register New Barcode Product"}
              </h3>
              <button 
                onClick={() => {
                  setShowForm(false);
                  resetFields();
                }}
                className="text-gray-400 hover:text-gray-750 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product barcode */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">GS1 Barcode Identifier</label>
                <input 
                  type="text" 
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                  placeholder="e.g. 8901030753541"
                />
              </div>

              {/* Product name */}
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Supermarket Label Description</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-bold font-display focus:outline-none"
                  placeholder="e.g. Amul Salted Butter 500g Pack"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Category Allocation</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-gray-700 font-semibold focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand label */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Brand/Manufacturer Trademark</label>
                <input 
                  type="text" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl focus:outline-none"
                  placeholder="e.g. Amul"
                />
              </div>

              {/* Packaging unit */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Measurement Unit</label>
                <select 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-gray-700 focus:outline-none"
                >
                  <option value="Pcs">Pcs (Count)</option>
                  <option value="Pack">Pack</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Litre">Litre</option>
                  <option value="Jar">Jar</option>
                </select>
              </div>

              {/* HSN CODE */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Tax HSN Code</label>
                <input 
                  type="text" 
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                  placeholder="e.g. 04051000"
                />
              </div>

              {/* Costs indicators */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Cost Price (₹)</label>
                <input 
                  type="number" 
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                  placeholder="e.g. 190"
                />
              </div>

              {/* Selling price */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Selling Price (₹ GST Included)</label>
                <input 
                  type="number" 
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono font-bold focus:outline-none"
                  placeholder="e.g. 240"
                />
              </div>

              {/* GST rate */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Indian GST Rate Slab</label>
                <select 
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-gray-700 font-mono focus:outline-none"
                >
                  <option value="0">0% (Tax Exempt)</option>
                  <option value="5">5% (Essential Items)</option>
                  <option value="12">12% (Processed Staples)</option>
                  <option value="18">18% (Standard FMCG)</option>
                  <option value="28">28% (Luxury/Aerated Beverages)</option>
                </select>
              </div>

              {/* Min Stocks levels */}
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Replenishment Alert Index (Minimum units)</label>
                <input 
                  type="number" 
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                  placeholder="e.g. 25"
                />
              </div>

              {/* Submits buttons */}
              <div className="md:col-span-2 pt-4 border-t border-gray-100 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    resetFields();
                  }}
                  className="text-xs bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Commit Catalog Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL DIALOG */}
      {showCatForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 font-display">Create Category Record</h3>
              <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleCategoryCreateSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Category string Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dairy & Frozen Foods"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-sans focus:outline-none font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-extrabold text-gray-400 font-mono">Gst reference shorthand Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. DFY"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value.toUpperCase())}
                  className="w-full text-xs mt-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl font-mono focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCatForm(false)} 
                  className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARCODE PRINT GENERATOR SCREEN DIALOG */}
      {selectedBarcodeProd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-3xl w-full p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Laser Printable Barcode Label Sheet</h3>
                <p className="text-xs text-brand-600 font-medium">Product: {selectedBarcodeProd.name}</p>
              </div>
              <button onClick={() => setSelectedBarcodeProd(null)} className="text-gray-400 hover:text-gray-700 font-bold">✕</button>
            </div>

            {/* Config count */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-mono">TVS Sticker count size:</span>
              <select 
                value={printLabelCount} 
                onChange={(e) => setPrintLabelCount(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded p-1"
              >
                <option value={4}>4 Labels (Mini tester)</option>
                <option value={8}>8 Labels</option>
                <option value={12}>12 Labels (1 Sheet standard)</option>
                <option value={24}>24 Labels (Double Sheet)</option>
              </select>
            </div>

            {/* Labels rendering */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-150 rounded-2xl max-h-[300px] overflow-y-auto">
              {Array.from({ length: printLabelCount }).map((_, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center space-y-1 shadow-xs">
                  <span className="text-[9px] text-gray-500 font-sans tracking-tight font-semibold uppercase">{selectedBarcodeProd.brand}</span>
                  <p className="text-[10px] font-bold text-gray-800 truncate w-full">{selectedBarcodeProd.name}</p>
                  
                  {/* CSS standard styling barcode bars emulation */}
                  <div className="p-1 rounded bg-stone-50 border border-stone-100/50 flex flex-col items-center">
                    <span className="text-[15px] block font-mono tracking-[0.2em] font-medium leading-none text-gray-800">
                      ||||||| |||| | ||| 
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-gray-600 mt-1">{selectedBarcodeProd.barcode}</span>
                  </div>
                  
                  <span className="text-xs font-black font-mono text-gray-900">₹{selectedBarcodeProd.sellingPrice}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setSelectedBarcodeProd(null)} 
                className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold"
              >
                Close View
              </button>
              <button 
                onClick={() => window.print()} 
                className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Label Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
