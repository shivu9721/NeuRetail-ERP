/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  User, UserRole, Product, Category, StockMovement, Customer, Supplier, 
  Expense, PurchaseOrder, SaleInvoice, AuditLog, ERPNotification, Branch 
} from "./src/types";

const app = express();
const PORT = 3000;

// Body parser limits for base64 invoice file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- DATABASE STATE (LAN SYSTEM IN-MEMORY TRACING) ---

const DEFAULT_USERS: User[] = [
  { id: "u-1", name: "Anand Sharma", username: "admin", role: UserRole.ADMIN, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" },
  { id: "u-2", name: "Rina Mehta", username: "manager", role: UserRole.STORE_MANAGER, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" },
  { id: "u-3", name: "David Miller", username: "cashier1", role: UserRole.CASHIER, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" },
  { id: "u-4", name: "Suresh Rao", username: "stock", role: UserRole.INVENTORY_MANAGER, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80" },
  { id: "u-5", name: "Vikram Singhania", username: "owner", role: UserRole.OWNER, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80" }
];

const DEFAULT_BRANCHES: Branch[] = [
  { id: "br-1", name: "NeuRetail Hub - Whitefield", code: "NR-WFD-01", location: "Whitefield Main Road, Bengaluru", phone: "+91 80 4432 9901" },
  { id: "br-2", name: "NeuRetail Express - Indiranagar", code: "NR-IND-02", location: "100 Feet Road, Indiranagar, Bengaluru", phone: "+91 80 4432 9902" }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Groceries & Staples", code: "GST" },
  { id: "cat-2", name: "Beverages & Cold Drinks", code: "BEV" },
  { id: "cat-3", name: "Dairy & Frozen Food", code: "DFY" },
  { id: "cat-4", name: "Personal Care & Cosmetics", code: "PCC" },
  { id: "cat-5", name: "Household Supplements", code: "HHS" }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "c-1", name: "Rahul Verma", phone: "9876543210", email: "rahul@gmail.com", loyaltyPoints: 340, membershipDate: "2025-01-12", purchaseCount: 14 },
  { id: "c-2", name: "Priya Nair", phone: "9812345678", email: "priya.n@yahoo.com", loyaltyPoints: 125, membershipDate: "2025-03-05", purchaseCount: 6 },
  { id: "c-3", name: "John Doe", phone: "9900112233", email: "john_doe@outlook.com", loyaltyPoints: 850, membershipDate: "2024-06-20", purchaseCount: 42 },
  { id: "c-4", name: "Amit Patel", phone: "9560981234", email: "amit.patel@gmail.com", loyaltyPoints: 50, membershipDate: "2025-05-18", purchaseCount: 2 }
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: "s-1", name: "Supreme Foods Distribution", code: "SUP-FOOD", contactPerson: "Nilesh Shah", phone: "9442012351", email: "orders@supremefoods.in", outstandingBalance: 124500, gstin: "29AAAAA1111A1Z1" },
  { id: "s-2", name: "Hindustan FMCG Ltd", code: "HIND-FMCG", contactPerson: "Siddharth Roy", phone: "9885023912", email: "roy.s@hindfmcg.com", outstandingBalance: 45000, gstin: "29BBBBB2222B2Z2" },
  { id: "s-3", name: "Greenfield Farms & Dairy", code: "GRN-FARMS", contactPerson: "Hiren Patel", phone: "9123456701", email: "supply@greenfarm.co.in", outstandingBalance: 0, gstin: "29CCCCC3333C3Z3" }
];

const DEFAULT_EXPENSES: Expense[] = [
  { id: "exp-1", category: "Electricity", amount: 18500, description: "Whitefield branch electric invoice May 2026", date: "2026-05-20", referenceNo: "EL-29402" },
  { id: "exp-2", category: "Salary", amount: 145000, description: "Monthly wages Whitefield branch cashiers & managers", date: "2026-06-01", referenceNo: "SAL-PAY-06" },
  { id: "exp-3", category: "Rent", amount: 60000, description: "Whitefield building rent monthly remittance", date: "2026-06-01", referenceNo: "RNT-WHITE-1" }
];

// Seed realistic barcode products for immediate testing
let products: Product[] = [
  {
    id: "p-1",
    barcode: "8901030753541",
    name: "Lipton Green Tea Honey Lemon (25 Bags)",
    category: "Beverages & Cold Drinks",
    brand: "Lipton",
    unit: "Pack",
    costPrice: 110,
    sellingPrice: 160,
    gstRate: 12,
    hsnCode: "09021000",
    minStockLevel: 25,
    branchStocks: { "br-1": 182, "br-2": 45 },
    batches: [
      { batchNumber: "B-LGT-26A", expiryDate: "2027-04-15", stockQuantity: 182 }
    ]
  },
  {
    id: "p-2",
    barcode: "8901262010078",
    name: "Amul Butter salted 500g",
    category: "Dairy & Frozen Food",
    brand: "Amul",
    unit: "Pack",
    costPrice: 215,
    sellingPrice: 275,
    gstRate: 12,
    hsnCode: "04051000",
    minStockLevel: 30,
    branchStocks: { "br-1": 12, "br-2": 18 }, // Stock alerts
    batches: [
      { batchNumber: "B-AB-11P", expiryDate: "2026-08-30", stockQuantity: 30 }
    ]
  },
  {
    id: "p-3",
    barcode: "8901063141476",
    name: "Britannia Marie Gold Biscuit 250g",
    category: "Groceries & Staples",
    brand: "Britannia",
    unit: "Pack",
    costPrice: 28,
    sellingPrice: 40,
    gstRate: 18,
    hsnCode: "19053100",
    minStockLevel: 50,
    branchStocks: { "br-1": 420, "br-2": 180 },
    batches: [
      { batchNumber: "B-BMG-99", expiryDate: "2026-12-10", stockQuantity: 600 }
    ]
  },
  {
    id: "p-4",
    barcode: "5449000000996",
    name: "Coca-Cola Original Can 300ml",
    category: "Beverages & Cold Drinks",
    brand: "Coca-Cola",
    unit: "Pcs",
    costPrice: 22,
    sellingPrice: 40,
    gstRate: 28,
    hsnCode: "22021010",
    minStockLevel: 60,
    branchStocks: { "br-1": 340, "br-2": 110 },
    batches: [
      { batchNumber: "B-CC-X3", expiryDate: "2026-11-20", stockQuantity: 450 }
    ]
  },
  {
    id: "p-5",
    barcode: "7613035824123",
    name: "Nescafe Classic Fresh Blend Jar 100g",
    category: "Beverages & Cold Drinks",
    brand: "Nestle",
    unit: "Pcs",
    costPrice: 240,
    sellingPrice: 320,
    gstRate: 18,
    hsnCode: "21011110",
    minStockLevel: 20,
    branchStocks: { "br-1": 8, "br-2": 24 }, // Alert Whitefield
    batches: [
      { batchNumber: "B-NES-7A", expiryDate: "2027-03-31", stockQuantity: 32 }
    ]
  },
  {
    id: "p-6",
    barcode: "8901058002317",
    name: "Tata Iodized Salt 1kg",
    category: "Groceries & Staples",
    brand: "Tata",
    unit: "Pcs",
    costPrice: 18,
    sellingPrice: 28,
    gstRate: 5,
    hsnCode: "25010010",
    minStockLevel: 80,
    branchStocks: { "br-1": 340, "br-2": 150 },
    batches: [
      { batchNumber: "B-TS-045", expiryDate: "2028-01-01", stockQuantity: 490 }
    ]
  },
  {
    id: "p-7",
    barcode: "8906001235123",
    name: "Premium Long Grain Basmati Rice 5kg",
    category: "Groceries & Staples",
    brand: "Fortune",
    unit: "Pack",
    costPrice: 420,
    sellingPrice: 590,
    gstRate: 0,
    hsnCode: "10063020",
    minStockLevel: 15,
    branchStocks: { "br-1": 28, "br-2": 32 },
    batches: [
      { batchNumber: "B-RICE-FO26", expiryDate: "2028-05-10", stockQuantity: 600 }
    ]
  },
  {
    id: "p-8",
    barcode: "8717163712312",
    name: "Dove Beauty Bathing Soap Cream 100g",
    category: "Personal Care & Cosmetics",
    brand: "Dove",
    unit: "Pcs",
    costPrice: 45,
    sellingPrice: 65,
    gstRate: 18,
    hsnCode: "34011110",
    minStockLevel: 40,
    branchStocks: { "br-1": 15, "br-2": 52 }, // Alert Whitefield
    batches: [
      { batchNumber: "B-SOAP-DV12", expiryDate: "2027-10-31", stockQuantity: 67 }
    ]
  }
];

let databaseSeedTime = new Date().toISOString();

// Seed baseline transactions to populate dashboard beautifully on boots
let salesInvoices: SaleInvoice[] = [
  {
    id: "inv-1001",
    invoiceNumber: "POS-20260604-001",
    branchId: "br-1",
    counterId: "CTR-01",
    cashierName: "David Miller",
    customerId: "c-1",
    customerName: "Rahul Verma",
    customerPhone: "9876543210",
    items: [
      { productId: "p-1", name: "Lipton Green Tea Honey Lemon (25 Bags)", barcode: "8901030753541", quantity: 2, sellingPrice: 160, gstRate: 12, taxAmount: 34.28, discount: 10, total: 310 },
      { productId: "p-3", name: "Britannia Marie Gold Biscuit 250g", barcode: "8901063141476", quantity: 5, sellingPrice: 40, gstRate: 18, taxAmount: 30.51, discount: 0, total: 200 }
    ],
    subtotal: 520,
    discountTotal: 10,
    gstTotal: 64.79,
    grandTotal: 510,
    paymentMethod: "UPI",
    paymentDetails: { upiReference: "UPI9402840284" },
    timestamp: "2026-06-04T08:30:00Z"
  },
  {
    id: "inv-1002",
    invoiceNumber: "POS-20260604-002",
    branchId: "br-1",
    counterId: "CTR-02",
    cashierName: "David Miller",
    customerId: "c-3",
    customerName: "John Doe",
    customerPhone: "9900112233",
    items: [
      { productId: "p-7", name: "Premium Long Grain Basmati Rice 5kg", barcode: "8906001235123", quantity: 3, sellingPrice: 590, gstRate: 0, taxAmount: 0, discount: 70, total: 1700 },
      { productId: "p-5", name: "Nescafe Classic Fresh Blend Jar 100g", barcode: "7613035824123", quantity: 1, sellingPrice: 320, gstRate: 18, taxAmount: 48.81, discount: 20, total: 300 }
    ],
    subtotal: 2090,
    discountTotal: 90,
    gstTotal: 48.81,
    grandTotal: 2000,
    paymentMethod: "Card",
    paymentDetails: { cardReference: "TXN48201", cardAmount: 2000 },
    timestamp: "2026-06-04T11:45:00Z"
  },
  {
    id: "inv-1003",
    invoiceNumber: "POS-20260605-001",
    branchId: "br-1",
    counterId: "CTR-01",
    cashierName: "David Miller",
    customerId: "c-2",
    customerName: "Priya Nair",
    customerPhone: "9812345678",
    items: [
      { productId: "p-2", name: "Amul Butter salted 500g", barcode: "8901262010078", quantity: 1, sellingPrice: 275, gstRate: 12, taxAmount: 29.46, discount: 0, total: 275 },
      { productId: "p-4", name: "Coca-Cola Original Can 300ml", barcode: "5449000000996", quantity: 6, sellingPrice: 40, gstRate: 28, taxAmount: 52.50, discount: 15, total: 225 }
    ],
    subtotal: 515,
    discountTotal: 15,
    gstTotal: 81.96,
    grandTotal: 500,
    paymentMethod: "Cash",
    paymentDetails: { cashAmount: 500 },
    timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  }
];

let purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-5001",
    invoiceNumber: "PUR-INV-9921",
    supplierId: "s-1",
    supplierName: "Supreme Foods Distribution",
    branchId: "br-1",
    orderDate: "2026-05-15T14:20:00Z",
    items: [
      { productId: "p-3", name: "Britannia Marie Gold Biscuit 250g", barcode: "8901063141476", quantity: 500, costPrice: 28, gstRate: 18, taxAmount: 2520, subtotal: 14000 }
    ],
    subtotal: 14000,
    taxAmount: 2520,
    totalWithTax: 16520,
    status: "RECEIVED"
  },
  {
    id: "po-5002",
    invoiceNumber: "PUR-INV-1090",
    supplierId: "s-2",
    supplierName: "Hindustan FMCG Ltd",
    branchId: "br-1",
    orderDate: "2026-05-28T09:12:00Z",
    items: [
      { productId: "p-4", name: "Coca-Cola Original Can 300ml", barcode: "5449000000996", quantity: 300, costPrice: 22, gstRate: 28, taxAmount: 1848, subtotal: 6600 }
    ],
    subtotal: 6600,
    taxAmount: 1848,
    totalWithTax: 8448,
    status: "RECEIVED"
  }
];

let stockMovements: StockMovement[] = [
  { id: "mov-1", productId: "p-3", productName: "Britannia Marie Gold Biscuit 250g", barcode: "8901063141476", type: "STOCK_IN", quantity: 500, toBranchId: "br-1", timestamp: "2026-05-15T14:30:00Z", note: "Supplier Goods Receipt #PUR-INV-9921", user: "Suresh Rao" },
  { id: "mov-2", productId: "p-4", productName: "Coca-Cola Original Can 300ml", barcode: "5449000000996", type: "STOCK_IN", quantity: 300, toBranchId: "br-1", timestamp: "2026-05-28T10:00:00Z", note: "Supplier Goods Receipt #PUR-INV-1090", user: "Suresh Rao" },
  { id: "mov-3", productId: "p-1", productName: "Lipton Green Tea Honey Lemon (25 Bags)", barcode: "8901030753541", type: "STOCK_OUT", quantity: 2, timestamp: "2026-06-04T08:30:00Z", note: "POS Checkout POS-20260604-001", user: "David Miller" },
  { id: "mov-4", productId: "p-3", productName: "Britannia Marie Gold Biscuit 250g", barcode: "8901063141476", type: "STOCK_OUT", quantity: 5, timestamp: "2026-06-04T08:30:00Z", note: "POS Checkout POS-20260604-001", user: "David Miller" }
];

let auditLogs: AuditLog[] = [
  { id: "log-1", timestamp: "2026-06-05T01:00:00Z", userId: "u-1", userName: "Anand Sharma", role: "Admin", action: "Server Initialization", module: "Auth", details: "Local LAN server starting and database state initialized." },
  { id: "log-2", timestamp: "2026-06-05T03:15:00Z", userId: "u-2", userName: "Rina Mehta", role: "Store Manager", action: "Stock Auditing", module: "Inventory", details: "Checked low stock flags for perishable categories." }
];

let notifications: ERPNotification[] = [
  { id: "not-1", type: "low_stock", title: "Amul Butter running low", message: "Whitefield Branch stock value is 12 units (Limit: 30). Reorder recommended.", timestamp: "2026-06-05T02:10:00Z", read: false },
  { id: "not-2", type: "low_stock", title: "Nescafe Jar Alert", message: "Whitefield Branch stock has fallen to 8 units. Minimum limit: 20.", timestamp: "2026-06-05T03:00:00Z", read: false }
];

// --- BACKEND OMNI-RETAIL ENGINE HELPERS ---

function logAuditAction(userId: string, username: string, name: string, role: string, action: string, module: any, details?: string) {
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId,
    userName: name,
    role,
    action,
    module,
    details
  });
}

// Ensure low stock thresholds trigger alerts
function checkLowStockAlerts() {
  products.forEach(p => {
    Object.keys(p.branchStocks).forEach(brId => {
      const stock = p.branchStocks[brId];
      if (stock <= p.minStockLevel) {
        // Prevent duplicate alerts
        const branchName = brId === "br-1" ? "Whitefield Hub" : "Indiranagar Express";
        const alreadyExists = notifications.some(n => n.type === "low_stock" && n.message.includes(p.name) && n.message.includes(branchName));
        if (!alreadyExists) {
          notifications.unshift({
            id: `not-${Date.now()}-${p.id}`,
            type: "low_stock",
            title: `Low Stock: ${p.name}`,
            message: `${branchName} contains only ${stock} units. Recommended replenishment is ${p.minStockLevel * 2} Pcs.`,
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
    });
  });
}

// Run initial alert evaluation
checkLowStockAlerts();

// --- API ENDPOINTS ---

// AUTH & USERS
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = DEFAULT_USERS.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials. Typical accounts: admin, manager, cashier1, owner." });
  }
  
  // Clean fake token sign for LAN use
  const responseUser = { ...user, token: `lan-jwt-${user.id}-${Date.now()}` };
  logAuditAction(user.id, user.username, user.name, user.role, "User Login", "Auth", `Successful LAN console session logged.`);
  res.json({ user: responseUser });
});

app.get("/api/users", (req, res) => {
  res.json(DEFAULT_USERS);
});

// MULTI-BRANCH METRICS & SETUP
app.get("/api/branches", (req, res) => {
  res.json(DEFAULT_BRANCHES);
});

// CATEGORIES & PRODUCTS
app.get("/api/categories", (req, res) => {
  res.json(DEFAULT_CATEGORIES);
});

app.post("/api/categories", (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: "Name and code required." });
  const newCat = { id: `cat-${Date.now()}`, name, code };
  DEFAULT_CATEGORIES.push(newCat);
  res.status(201).json(newCat);
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { id, barcode, name, category, brand, unit, costPrice, sellingPrice, gstRate, hsnCode, minStockLevel, branchStocks, batches } = req.body;
  
  if (!barcode || !name || !category || sellingPrice === undefined) {
    return res.status(400).json({ error: "Barcode, Product Name, Category and Selling Price are mandatory." });
  }

  const existingIndex = products.findIndex(p => p.barcode === barcode || (id && p.id === id));
  
  if (existingIndex > -1) {
    // Update EXISTING item
    const prevProduct = products[existingIndex];
    products[existingIndex] = {
      ...prevProduct,
      barcode,
      name,
      category,
      brand: brand || "Generic",
      unit: unit || "Pcs",
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice),
      gstRate: Number(gstRate) || 0,
      hsnCode: hsnCode || "00000000",
      minStockLevel: Number(minStockLevel) || 10,
      branchStocks: branchStocks || prevProduct.branchStocks,
      batches: batches || prevProduct.batches
    };

    logAuditAction("u-1", "admin", "Anand Sharma", "Admin", "Product Updated", "Inventory", `Barcode: ${barcode}. Name: ${name}`);
    checkLowStockAlerts();
    return res.json(products[existingIndex]);
  } else {
    // Create NEW item
    const newProduct: Product = {
      id: id || `p-${Date.now()}`,
      barcode: barcode.trim(),
      name: name.trim(),
      category,
      brand: brand || "Generic",
      unit: unit || "Pcs",
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice),
      gstRate: Number(gstRate) || 0,
      hsnCode: hsnCode || "00000000",
      minStockLevel: Number(minStockLevel) || 10,
      branchStocks: branchStocks || { "br-1": 10, "br-2": 0 },
      batches: batches || [{ batchNumber: `B-NEW-${Date.now().toString().slice(-4)}`, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), stockQuantity: branchStocks?.["br-1"] || 10 }]
    };

    products.push(newProduct);
    logAuditAction("u-1", "admin", "Anand Sharma", "Admin", "Product Created", "Inventory", `Added barcode: ${barcode}. Name: ${name}`);
    checkLowStockAlerts();
    return res.status(201).json(newProduct);
  }
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Product not found." });
  const deleted = products.splice(index, 1)[0];
  logAuditAction("u-1", "admin", "Anand Sharma", "Admin", "Product Deleted", "Inventory", `ID: ${deleted.id}, Barcode: ${deleted.barcode}`);
  res.json({ message: "Product deleted", product: deleted });
});

// Bulk Import simulation (Accept CSV/JSON rows)
app.post("/api/products/bulk", (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid array of items." });
  }

  let importedCount = 0;
  items.forEach((item: any) => {
    if (!item.barcode || !item.name || !item.sellingPrice) return;
    const cleanItem: Product = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      barcode: String(item.barcode).trim(),
      name: String(item.name).trim(),
      category: item.category || "Groceries & Staples",
      brand: item.brand || "Imported",
      unit: item.unit || "Pcs",
      costPrice: Number(item.costPrice) || 0,
      sellingPrice: Number(item.sellingPrice),
      gstRate: Number(item.gstRate) || 12,
      hsnCode: item.hsnCode || "19050000",
      minStockLevel: Number(item.minStockLevel) || 15,
      branchStocks: { "br-1": Number(item.qty) || 50, "br-2": 0 },
      batches: [{ batchNumber: `B-IMP-${Date.now().toString().slice(-3)}`, expiryDate: "2027-12-31", stockQuantity: Number(item.qty) || 50 }]
    };
    products.push(cleanItem);
    importedCount++;
  });

  logAuditAction("u-2", "manager", "Rina Mehta", "Store Manager", "Bulk Import", "Inventory", `Bulk uploaded ${importedCount} items.`);
  checkLowStockAlerts();
  res.json({ message: `Successfully loaded ${importedCount} items.`, count: importedCount });
});

// INVENTORY LEDGER & MOVEMENTS
app.get("/api/inventory/ledger", (req, res) => {
  res.json(stockMovements);
});

app.post("/api/inventory/adjustment", (req, res) => {
  const { productId, type, quantity, branchId, note, user } = req.body;

  if (!productId || !type || !quantity) {
    return res.status(400).json({ error: "Product, Adjustment Type and Quantity are required." });
  }

  const p = products.find(prod => prod.id === productId);
  if (!p) return res.status(404).json({ error: "Product not found." });

  const qty = Number(quantity);
  const brId = branchId || "br-1";

  if (p.branchStocks[brId] === undefined) {
    p.branchStocks[brId] = 0;
  }

  if (type === "STOCK_IN" || type === "ADJUSTMENT" && qty > 0) {
    p.branchStocks[brId] += Math.abs(qty);
  } else if (type === "STOCK_OUT" || type === "ADJUSTMENT" && qty < 0) {
    p.branchStocks[brId] = Math.max(0, p.branchStocks[brId] - Math.abs(qty));
  } else if (type === "TRANSFER") {
    const { toBranchId } = req.body;
    if (!toBranchId) return res.status(400).json({ error: "Target branch required for transfer." });
    p.branchStocks[brId] = Math.max(0, p.branchStocks[brId] - Math.abs(qty));
    if (p.branchStocks[toBranchId] === undefined) p.branchStocks[toBranchId] = 0;
    p.branchStocks[toBranchId] += Math.abs(qty);
  }

  const newMov: StockMovement = {
    id: `mov-${Date.now()}`,
    productId: p.id,
    productName: p.name,
    barcode: p.barcode,
    type,
    quantity: Math.abs(qty),
    fromBranchId: type === "TRANSFER" ? brId : undefined,
    toBranchId: type === "TRANSFER" ? req.body.toBranchId : brId,
    timestamp: new Date().toISOString(),
    note: note || "Manual operations dispatch alert",
    user: user || "Suresh Rao"
  };

  stockMovements.unshift(newMov);
  logAuditAction("u-4", "stock", "Suresh Rao", "Inventory Manager", "Inventory Adjustment", "Inventory", `${type} recorded for ${p.name}. Qty: ${qty}`);
  checkLowStockAlerts();
  res.status(201).json({ product: p, movement: newMov });
});

// EXPENSES MANAGEMENT
app.get("/api/expenses", (req, res) => {
  res.json(DEFAULT_EXPENSES);
});

app.post("/api/expenses", (req, res) => {
  const { category, amount, description, referenceNo } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ error: "Category and Amount are mandatory." });
  }

  const newExp: Expense = {
    id: `exp-${Date.now()}`,
    category,
    amount: Number(amount),
    description: description || "",
    date: new Date().toISOString().slice(0, 10),
    referenceNo: referenceNo || `EXP-REF-${Date.now().toString().slice(-4)}`
  };

  DEFAULT_EXPENSES.unshift(newExp);
  logAuditAction("u-2", "manager", "Rina Mehta", "Store Manager", "Logged Expense", "Expense", `Category: ${category}. Amt: INR ${amount}`);
  res.status(201).json(newExp);
});

// CUSTOMER CRM
app.get("/api/customers", (req, res) => {
  res.json(DEFAULT_CUSTOMERS);
});

app.post("/api/customers", (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "Name and Phone required." });

  // Check if existing
  let cust = DEFAULT_CUSTOMERS.find(c => c.phone === phone);
  if (cust) {
    cust.name = name;
    cust.email = email || cust.email;
    return res.json(cust);
  }

  const newCust: Customer = {
    id: `c-${Date.now()}`,
    name,
    phone,
    email,
    loyaltyPoints: 10, // Welcoming points
    membershipDate: new Date().toISOString().slice(0, 10),
    purchaseCount: 0
  };

  DEFAULT_CUSTOMERS.push(newCust);
  logAuditAction("u-3", "cashier1", "David Miller", "Cashier", "Register Customer", "CRM", `Name: ${name}. Phone: ${phone}`);
  res.status(201).json(newCust);
});

// SUPPLIERS
app.get("/api/suppliers", (req, res) => {
  res.json(DEFAULT_SUPPLIERS);
});

app.post("/api/suppliers", (req, res) => {
  const { name, code, contactPerson, phone, email, outstandingBalance, gstin } = req.body;
  if (!name || !contactPerson || !phone) {
    return res.status(400).json({ error: "Supplier Name, Contact Person and Phone are required." });
  }

  const newSupp: Supplier = {
    id: `s-${Date.now()}`,
    name,
    code: code || `SUP-${Date.now().toString().slice(-4)}`,
    contactPerson,
    phone,
    email,
    outstandingBalance: Number(outstandingBalance) || 0,
    gstin
  };

  DEFAULT_SUPPLIERS.push(newSupp);
  logAuditAction("u-1", "admin", "Anand Sharma", "Admin", "Supplier Onboarding", "Supplier", `Onboarded: ${name}`);
  res.status(201).json(newSupp);
});

// PURCHASES
app.get("/api/purchases", (req, res) => {
  res.json(purchaseOrders);
});

app.post("/api/purchases", (req, res) => {
  const { supplierId, invoiceNumber, items, branchId } = req.body;
  if (!supplierId || !items || items.length === 0) {
    return res.status(400).json({ error: "Supplier profile and at least 1 item is required." });
  }

  const supp = DEFAULT_SUPPLIERS.find(s => s.id === supplierId);
  const supplierName = supp ? supp.name : "Dynamic Importer";

  let totalCost = 0;
  let taxSum = 0;
  
  const processedItems = items.map((it: any) => {
    const qty = Number(it.quantity);
    const cost = Number(it.costPrice);
    const gstPct = Number(it.gstRate) || 12;
    const sub = qty * cost;
    const tax = sub * (gstPct / 100);
    totalCost += sub;
    taxSum += tax;

    // Increment local warehouse stocks
    const pObj = products.find(prod => prod.id === it.productId || prod.barcode === it.barcode);
    if (pObj) {
      const bId = branchId || "br-1";
      pObj.branchStocks[bId] = (pObj.branchStocks[bId] || 0) + qty;
      
      // Stock Ledger
      stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        productId: pObj.id,
        productName: pObj.name,
        barcode: pObj.barcode,
        type: "STOCK_IN",
        quantity: qty,
        toBranchId: bId,
        timestamp: new Date().toISOString(),
        note: `Purchase Order Invoice Receipt #${invoiceNumber || "MANUAL"}`,
        user: "Stock Ingress Agent"
      });
    }

    return {
      productId: it.productId || "p-temp",
      name: it.name,
      barcode: it.barcode || "N/A",
      quantity: qty,
      costPrice: cost,
      gstRate: gstPct,
      taxAmount: parseFloat(tax.toFixed(2)),
      subtotal: parseFloat(sub.toFixed(2))
    };
  });

  const grandTotal = totalCost + taxSum;

  const newPO: PurchaseOrder = {
    id: `po-${Date.now()}`,
    invoiceNumber: invoiceNumber || `PUR-RECPT-${Date.now().toString().slice(-4)}`,
    supplierId,
    supplierName,
    branchId: branchId || "br-1",
    orderDate: new Date().toISOString(),
    items: processedItems,
    subtotal: parseFloat(totalCost.toFixed(2)),
    taxAmount: parseFloat(taxSum.toFixed(2)),
    totalWithTax: parseFloat(grandTotal.toFixed(2)),
    status: "RECEIVED"
  };

  purchaseOrders.unshift(newPO);
  
  // Accrue to supplier outstanding balances
  if (supp) {
    supp.outstandingBalance += parseFloat(grandTotal.toFixed(2));
  }

  logAuditAction("u-4", "stock", "Suresh Rao", "Inventory Manager", "Created Purchase Receipt", "Purchase", `Logged invoice: ${newPO.invoiceNumber} (INR ${grandTotal})`);
  checkLowStockAlerts();
  res.status(201).json(newPO);
});

// POS CHECKOUT & BILLING
app.get("/api/sales", (req, res) => {
  res.json(salesInvoices);
});

app.post("/api/sales", (req, res) => {
  const { customerMobile, items, paymentMethod, discountAmount, couponCode, counterId, cashierName, branchId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cart cannot be empty for standard POS checkout." });
  }

  // Calculate taxes, totals, verify stocks
  let subtotal = 0;
  let gstAccumulator = 0;
  const bId = branchId || "br-1";

  const processedItems = items.map((cartItem: any) => {
    const qty = Number(cartItem.qty || cartItem.quantity);
    const pId = cartItem.id || cartItem.productId;
    const pObj = products.find(prod => prod.id === pId || prod.barcode === cartItem.barcode);

    if (!pObj) {
      throw new Error(`Critical Inventory Mismatch: Product code ${cartItem.barcode || pId} not registerable.`);
    }

    // Adjust quantities
    pObj.branchStocks[bId] = Math.max(0, (pObj.branchStocks[bId] || 0) - qty);

    // Track movement
    stockMovements.unshift({
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: pObj.id,
      productName: pObj.name,
      barcode: pObj.barcode,
      type: "STOCK_OUT",
      quantity: qty,
      fromBranchId: bId,
      timestamp: new Date().toISOString(),
      note: `POS Terminal Checkout Invoice #POS`,
      user: cashierName || "Counter POS Terminal"
    });

    const itemCost = pObj.sellingPrice;
    const lineSubtotal = itemCost * qty;
    
    // Indian GST calculation (GST inclusive in the display checkout price)
    // Formula: GST Amount = Value - (Value / (1 + GST_Rate/100))
    const gstRate = pObj.gstRate || 0;
    const taxValue = lineSubtotal - (lineSubtotal / (1 + gstRate / 100));
    
    subtotal += lineSubtotal;
    gstAccumulator += taxValue;

    return {
      productId: pObj.id,
      name: pObj.name,
      barcode: pObj.barcode,
      quantity: qty,
      sellingPrice: itemCost,
      gstRate: gstRate,
      taxAmount: parseFloat(taxValue.toFixed(2)),
      discount: cartItem.discount || 0,
      total: lineSubtotal - (cartItem.discount || 0)
    };
  });

  const discTotal = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, subtotal - discTotal);

  // Link Customer CRM points
  let linkedCustomer: Customer | undefined;
  if (customerMobile) {
    linkedCustomer = DEFAULT_CUSTOMERS.find(c => c.phone === customerMobile.trim());
    if (linkedCustomer) {
      linkedCustomer.loyaltyPoints += Math.floor(grandTotal / 100); // 1 point per 100 Rs
      linkedCustomer.purchaseCount += 1;
    }
  }

  const invoiceNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${(salesInvoices.length + 1).toString().padStart(4, "0")}`;

  const newInvoice: SaleInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    branchId: bId,
    counterId: counterId || "Counter-01",
    cashierName: cashierName || "David Miller",
    customerId: linkedCustomer?.id,
    customerName: linkedCustomer?.name,
    customerPhone: linkedCustomer?.phone,
    items: processedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountTotal: parseFloat(discTotal.toFixed(2)),
    gstTotal: parseFloat(gstAccumulator.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    paymentMethod: paymentMethod || "Cash",
    couponCode: couponCode || undefined,
    timestamp: new Date().toISOString()
  };

  salesInvoices.unshift(newInvoice);

  logAuditAction("u-3", "cashier1", cashierName || "David Miller", "Cashier", "POS Checkout Complete", "POS", `Generated bill ${invoiceNumber}. Total: INR ${grandTotal}`);
  checkLowStockAlerts();
  res.status(201).json(newInvoice);
});

// NOTIFICATIONS CONTROL
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/mark-read", (req, res) => {
  const { id } = req.body;
  if (id) {
    const alert = notifications.find(n => n.id === id);
    if (alert) alert.read = true;
  } else {
    notifications.forEach(n => n.read = true);
  }
  res.json({ message: "Done" });
});

// SECURITY SYSTEM AUDIT LOG DATA
app.get("/api/security/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// --- GOOGLE GEMINI INTELLIGENT AI BILL OCR PARSER ---
app.post("/api/ai/invoice-ocr", async (req, res) => {
  const { fileBytes, fileName, mimeType } = req.body;

  if (!fileBytes) {
    return res.status(400).json({ error: "Invoice file material bytes required." });
  }

  // Define structured JSON Schema for Gemini Output
  // This matches a deterministic structure of the purchase invoice products
  const InvoiceSchema = {
    type: Type.OBJECT,
    properties: {
      invoiceNumber: { type: Type.STRING, description: "Extract the unique invoice identification number." },
      supplierName: { type: Type.STRING, description: "Extract the supplier or merchant trademark name." },
      supplierGstin: { type: Type.STRING, description: "Extract the 15-character GSTIN/Tax ID if visible, e.g. 29AAAAA1111A1Z1" },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "Full descriptive name of the product." },
            barcode: { type: Type.STRING, description: "Product barcode or item code, if mentioned or visible. Can leave empty if absent." },
            quantity: { type: Type.NUMBER, description: "Count or amount purchased." },
            unitPrice: { type: Type.NUMBER, description: "Unit price of the product without tax." },
            gstRate: { type: Type.NUMBER, description: "Tax rating percentage applied to this specific item (e.g. 5, 12, 18, 28)." }
          },
          required: ["productName", "quantity", "unitPrice"]
        }
      },
      subtotalAmount: { type: Type.NUMBER, description: "Total tax-exclusive amount." },
      calculatedGst: { type: Type.NUMBER, description: "Total integrated GST." },
      invoiceTotal: { type: Type.NUMBER, description: "Absolute final value matching original bill." }
    },
    required: ["invoiceNumber", "supplierName", "items", "invoiceTotal"]
  };

  try {
    const isApiKeyConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";

    if (!isApiKeyConfigured) {
      console.warn("GEMINI_API_KEY not supplied or is placeholder. Using smart offline ERP OCR simulator.");
      throw new Error("Local fallback triggered due to absent API Key.");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const filePart = {
      inlineData: {
        data: fileBytes, // Base64 chunk
        mimeType: mimeType || "image/png"
      }
    };

    const promptText = "Please intelligently read and examine the contents of this purchase invoice, and return a perfectly formatted JSON containing invoice details, supplier company name, list of physical goods/items stocked, units purchased, unit costs, and appropriate GST tax thresholds of each product. Ensure numeric values are returned as numbers.";

    logAuditAction("u-2", "manager", "Rina Mehta", "Store Manager", "AI Invoice Process", "AI_OCR", `Processing invoice file "${fileName || 'uploaded_doc'}" via Gemini AI.`);

    const geminiRet = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [filePart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: InvoiceSchema,
        temperature: 0.1 // precise extraction
      }
    });

    const val = geminiRet.text;
    if (!val) {
      throw new Error("Received empty answer content from Gemini core.");
    }

    const parsedJson = JSON.parse(val.trim());
    return res.json({ success: true, method: "Gemini 3.5 AI Integration", payload: parsedJson });

  } catch (err: any) {
    console.log("OCR engine fallback invoked. Reason: ", err.message || err);

    // Provide high-fidelity simulated fallback object based on default FMCG items 
    // to keep the software beautiful even when fully disconnected from WAN/API gateways
    const placeholderFallbacks = [
      {
        invoiceNumber: `OCR-SIM-${Date.now().toString().slice(-4)}`,
        supplierName: "Supreme Foods Distribution",
        supplierGstin: "29AAAAA1111A1Z1",
        items: [
          { productName: "Britannia Marie Gold Biscuit 250g", barcode: "8901063141476", quantity: 150, unitPrice: 28, gstRate: 18 },
          { productName: "Amul Butter salted 500g", barcode: "8901262010078", quantity: 60, unitPrice: 215, gstRate: 12 }
        ],
        subtotalAmount: 17100,
        calculatedGst: 2304,
        invoiceTotal: 19404
      },
      {
        invoiceNumber: `FMCG-REC-${Date.now().toString().slice(-4)}`,
        supplierName: "Hindustan FMCG Ltd",
        supplierGstin: "29BBBBB2222B2Z2",
        items: [
          { productName: "Lipton Green Tea Honey Lemon (25 Bags)", barcode: "8901030753541", quantity: 120, unitPrice: 110, gstRate: 12 },
          { productName: "Nescafe Classic Fresh Blend Jar 100g", barcode: "7613035824123", quantity: 45, unitPrice: 240, gstRate: 18 }
        ],
        subtotalAmount: 24000,
        calculatedGst: 3528,
        invoiceTotal: 27528
      }
    ];

    const chosenFallback = placeholderFallbacks[Math.floor(Math.random() * placeholderFallbacks.length)];
    
    logAuditAction("u-2", "manager", "Rina Mehta", "Store Manager", "AI Invoice Process Fallback", "AI_OCR", `Successful simulated invoice parsing on local system backend offline cache.`);

    return res.json({ 
      success: true, 
      method: "Simulated Local Scanner Engine", 
      payload: chosenFallback, 
      note: "Offline scanner returned fallback result. Connect Gemini API to unlock real-time commercial document reading." 
    });
  }
});

// HEALTH CHECK ENGINE
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    address: req.ip,
    lanAccessUrl: "http://192.168.1.100:3000"
  });
});

// --- VITE MIDDLEWARE INTEROPERABILITY & STATIC HANDLING ---

async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server mount
    console.log("Starting NeuRetail dev container environment...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production build delivery
    console.log("Serving pre-compiled release static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`-----------------------------------------------`);
    console.log(`🚀 NeuRetail ERP Active on Port ${PORT}`);
    console.log(`🌐 Local Area Network Gateway: http://localhost:${PORT}`);
    console.log(`-----------------------------------------------`);
  });
}

bootServer();
