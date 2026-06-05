/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from "zustand";
import { 
  User, UserRole, Product, Category, StockMovement, Customer, Supplier, 
  Expense, PurchaseOrder, SaleInvoice, AuditLog, ERPNotification, Branch 
} from "./types";

interface ERPState {
  currentUser: User | null;
  currentBranch: Branch | null;
  users: User[];
  branches: Branch[];
  categories: Category[];
  products: Product[];
  stockMovements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  purchases: PurchaseOrder[];
  sales: SaleInvoice[];
  auditLogs: AuditLog[];
  notifications: ERPNotification[];
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  setBranch: (branchId: string) => void;
  changeBranch: (branchId: string) => void;
  changeUserRole: (role: "ADMIN" | "CASHIER") => void;
  
  // Handlers matching network operations
  fetchInitialData: () => Promise<void>;
  createProduct: (productData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  bulkImportProducts: (items: any[]) => Promise<boolean>;
  adjustStock: (productId: string, type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER", quantity: number, note: string, toBranchId?: string) => Promise<boolean>;
  recordSaleCheckout: (checkoutData: { items: any[]; paymentMethod: string; discountAmount: number; customerMobile?: string; couponCode?: string }) => Promise<SaleInvoice | null>;
  createCategory: (name: string, code: string) => Promise<boolean>;
  createCustomer: (name: string, phone: string, email?: string) => Promise<boolean>;
  createSupplier: (supplierData: Partial<Supplier>) => Promise<boolean>;
  createExpense: (expenseData: Partial<Expense>) => Promise<boolean>;
  createPurchaseReceipt: (purchaseData: { supplierId: string; invoiceNumber: string; items: any[] }) => Promise<boolean>;
  processInvoiceOCR: (fileBytes: string, fileName: string, mimeType: string) => Promise<any | null>;
  markNotificationsAsRead: (id?: string) => Promise<void>;
}

export const useERPStore = create<ERPState>((set, get) => ({
  currentUser: null,
  currentBranch: null,
  users: [],
  branches: [],
  categories: [],
  products: [],
  stockMovements: [],
  customers: [],
  suppliers: [],
  expenses: [],
  purchases: [],
  sales: [],
  auditLogs: [],
  notifications: [],
  isLoading: false,
  error: null,

  login: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      if (!res.ok) {
        throw new Error("Credentials match failed.");
      }
      const data = await res.json();
      set({ currentUser: data.user, isLoading: false });
      // Fetch fresh data post login
      await get().fetchInitialData();
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ currentUser: null, currentBranch: null });
  },

  setBranch: (branchId: string) => {
    const branch = get().branches.find(b => b.id === branchId) || null;
    set({ currentBranch: branch });
  },

  changeBranch: (branchId: string) => {
    const branch = get().branches.find(b => b.id === branchId) || null;
    set({ currentBranch: branch });
  },

  changeUserRole: (role: "ADMIN" | "CASHIER") => {
    const userRoleValue = role === "ADMIN" ? UserRole.ADMIN : UserRole.CASHIER;
    const user = get().currentUser ? { ...get().currentUser!, role: userRoleValue } : { id: "u-1", name: "David Miller", username: "david", role: userRoleValue };
    set({ currentUser: user });
  },

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const [usr, brs, cats, prods, movements, cust, supp, exp, POs, invoices, logs, alerts] = await Promise.all([
        fetch("/api/users").then(r => r.json()),
        fetch("/api/branches").then(r => r.json()),
        fetch("/api/categories").then(r => r.json()),
        fetch("/api/products").then(r => r.json()),
        fetch("/api/inventory/ledger").then(r => r.json()),
        fetch("/api/customers").then(r => r.json()),
        fetch("/api/suppliers").then(r => r.json()),
        fetch("/api/expenses").then(r => r.json()),
        fetch("/api/purchases").then(r => r.json()),
        fetch("/api/sales").then(r => r.json()),
        fetch("/api/security/audit-logs").then(r => r.json()),
        fetch("/api/notifications").then(r => r.json())
      ]);

      set({
        users: usr,
        branches: brs,
        categories: cats,
        products: prods,
        stockMovements: movements,
        customers: cust,
        suppliers: supp,
        expenses: exp,
        purchases: POs,
        sales: invoices,
        auditLogs: logs,
        notifications: alerts,
        currentBranch: get().currentBranch || brs[0] || null,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: "Failed to connect to LAN Server database. Retrying...", isLoading: false });
    }
  },

  createProduct: async (productData: Partial<Product>) => {
    try {
      const branchStocks = productData.branchStocks || { "br-1": 10, "br-2": 0 };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...productData, branchStocks })
      });
      if (!res.ok) throw new Error("Product mutation failed");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete action failed");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  bulkImportProducts: async (items: any[]) => {
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (!res.ok) throw new Error("Bulk load error");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  adjustStock: async (productId: string, type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER", quantity: number, note: string, toBranchId?: string) => {
    try {
      const res = await fetch("/api/inventory/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          type,
          quantity,
          branchId: get().currentBranch?.id || "br-1",
          note,
          toBranchId,
          user: get().currentUser?.name || "Inventory System"
        })
      });
      if (!res.ok) throw new Error("Inventory adjustment failed");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  recordSaleCheckout: async (checkoutData) => {
    try {
      const user = get().currentUser;
      const branch = get().currentBranch;
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkoutData,
          cashierName: user?.name || "David Miller",
          branchId: branch?.id || "br-1",
          counterId: "CTR-01"
        })
      });
      if (!res.ok) throw new Error("Checkout failed");
      const invoice = await res.json();
      await get().fetchInitialData();
      return invoice;
    } catch (err) {
      return null;
    }
  },

  createCategory: async (name: string, code: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code })
      });
      if (!res.ok) throw new Error("Unable to create category.");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  createCustomer: async (name: string, phone: string, email?: string) => {
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email })
      });
      if (!res.ok) throw new Error("Customer add fail");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  createSupplier: async (supplierData) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData)
      });
      if (!res.ok) throw new Error("Supplier sync problem");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  createExpense: async (expenseData) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData)
      });
      if (!res.ok) throw new Error("Expense write error");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  createPurchaseReceipt: async (purchaseData) => {
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...purchaseData,
          branchId: get().currentBranch?.id || "br-1"
        })
      });
      if (!res.ok) throw new Error("Supplier receipt validation fail");
      await get().fetchInitialData();
      return true;
    } catch (err) {
      return false;
    }
  },

  processInvoiceOCR: async (fileBytes, fileName, mimeType) => {
    try {
      const res = await fetch("/api/ai/invoice-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBytes, fileName, mimeType })
      });
      if (!res.ok) throw new Error("OCR network anomaly");
      const resp = await res.json();
      return resp;
    } catch (err) {
      return null;
    }
  },

  markNotificationsAsRead: async (id) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      await get().fetchInitialData();
    } catch (err) {}
  }
}));
