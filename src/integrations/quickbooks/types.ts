
/**
 * QuickBooks Integration Types
 * Type definitions for QuickBooks API entities and responses
 */

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
  redirectUri: string;
}

export interface QuickBooksTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
  realm_id: string;
  created_at: number;
}

export interface QuickBooksCustomer {
  Id?: string;
  DisplayName: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
  };
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  Active?: boolean;
  SyncToken?: string;
}

export interface QuickBooksInvoice {
  Id?: string;
  Line: Array<{
    Id?: string;
    LineNum?: number;
    Description: string;
    Amount: number;
    DetailType: "SalesItemLineDetail";
    SalesItemLineDetail: {
      ItemRef?: {
        value: string;
        name: string;
      };
      Qty?: number;
      UnitPrice?: number;
    };
  }>;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TxnDate?: string;
  DueDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
  BillEmail?: {
    Address: string;
  };
  SalesTermRef?: {
    value: string;
  };
  TotalAmt?: number;
  Balance?: number;
  SyncToken?: string;
}

export interface QuickBooksPayment {
  Id?: string;
  TotalAmt: number;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TxnDate?: string;
  PaymentMethodRef?: {
    value: string;
    name?: string;
  };
  PrivateNote?: string;
  Line?: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: "Invoice";
    }>;
  }>;
  SyncToken?: string;
}

export interface QuickBooksItem {
  Id?: string;
  Name: string;
  Description?: string;
  Active?: boolean;
  Type: "Service" | "Inventory" | "NonInventory";
  IncomeAccountRef?: {
    value: string;
    name?: string;
  };
  UnitPrice?: number;
  SyncToken?: string;
}

export interface QuickBooksCompanyInfo {
  Id: string;
  CompanyName: string;
  LegalName?: string;
  Email?: {
    Address: string;
  };
  WebAddr?: {
    URI: string;
  };
  Country?: string;
  CompanyAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
}

export interface QuickBooksSyncStatus {
  lastSync: number;
  status: "idle" | "syncing" | "error";
  customersSynced: number;
  invoicesSynced: number;
  error?: string;
}

export interface QuickBooksAuthState {
  isConnected: boolean;
  realmId: string | null;
  companyName: string | null;
  lastSync: number | null;
  error: string | null;
}
