/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "Admin",
  STORE_MANAGER = "Store Manager",
  CASHIER = "Cashier",
  INVENTORY_MANAGER = "Inventory Manager",
  OWNER = "Owner" // Read-only Analytics
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  token?: string;
  avatar?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
}

export interface BatchInfo {
  batchNumber: string;
  expiryDate: string; // ISO date
  stockQuantity: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string; // Category ID or Name
  brand: string;
  unit: string; // e.g., Pcs, Kg, Litre, Pack
  costPrice: number;
  sellingPrice: number;
  gstRate: number; // e.g., 5, 12, 18, 28 (%)
  hsnCode: string;
  minStockLevel: number;
  // Multi-branch stock tracking
  branchStocks: { [branchId: string]: number };
  batches?: BatchInfo[];
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "TRANSFER";
  quantity: number;
  fromBranchId?: string;
  toBranchId?: string;
  timestamp: string;
  note: string;
  user: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  membershipDate: string;
  purchaseCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email?: string;
  outstandingBalance: number;
  gstin?: string;
}

export interface Expense {
  id: string;
  category: "Salary" | "Electricity" | "Rent" | "Maintenance" | "Miscellaneous";
  amount: number;
  description: string;
  date: string;
  referenceNo?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  barcode: string;
  quantity: number;
  costPrice: number;
  gstRate: number;
  taxAmount: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  orderDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  totalWithTax: number;
  status: "DRAFT" | "RECEIVED" | "CANCELLED";
}

export interface SaleItem {
  productId: string;
  name: string;
  barcode: string;
  quantity: number;
  sellingPrice: number;
  gstRate: number; // calculated from product
  taxAmount: number; // item tax
  discount: number; // line discount
  total: number; // quantity * sellingPrice + tax - discount
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string; // POS-YYYYMMDD-XXXX
  branchId: string;
  counterId: string; // Counter identification
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number; // items cost count
  discountTotal: number;
  gstTotal: number;
  grandTotal: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "Credit" | "Split";
  paymentDetails?: {
    cashAmount?: number;
    cardAmount?: number;
    upiAmount?: number;
    cardReference?: string;
    upiReference?: string;
  };
  couponCode?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module: "Auth" | "POS" | "Inventory" | "Purchase" | "CRM" | "Supplier" | "Expense" | "Branch" | "AI_OCR";
  details?: string;
}

export interface ERPNotification {
  id: string;
  type: "low_stock" | "expiry" | "sales_target" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
