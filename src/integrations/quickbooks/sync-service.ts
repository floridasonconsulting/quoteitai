
/**
 * QuickBooks Sync Service
 * Manages synchronization between Quote-It AI and QuickBooks
 */

import { QuickBooksClient } from "./client";
import { QuickBooksCustomer, QuickBooksInvoice, QuickBooksSyncStatus } from "./types";
import { Customer, Quote } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export class QuickBooksSyncService {
  private client: QuickBooksClient;
  private userId: string;

  constructor(client: QuickBooksClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  /**
   * Sync customers from QuickBooks to Quote-It AI
   */
  async syncCustomersFromQuickBooks(): Promise<number> {
    try {
      const qbCustomers = await this.client.getCustomers(1000);
      let syncedCount = 0;

      for (const qbCustomer of qbCustomers) {
        try {
          const customer: Partial<Customer> = {
            name: qbCustomer.DisplayName,
            email: qbCustomer.PrimaryEmailAddr?.Address || "",
            phone: qbCustomer.PrimaryPhone?.FreeFormNumber || "",
            company: qbCustomer.CompanyName || "",
            address: this.formatAddress(qbCustomer),
            user_id: this.userId,
            quickbooks_id: qbCustomer.Id,
          };

          // Check if customer already exists
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("quickbooks_id", qbCustomer.Id)
            .eq("user_id", this.userId)
            .maybeSingle();

          if (existing) {
            // Update existing customer
            await supabase
              .from("customers")
              .update(customer)
              .eq("id", existing.id);
          } else {
            // Create new customer
            await supabase.from("customers").insert(customer);
          }

          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync customer ${qbCustomer.Id}:`, error);
        }
      }

      await this.updateSyncStatus("customers", syncedCount);
      return syncedCount;
    } catch (error) {
      console.error("Failed to sync customers from QuickBooks:", error);
      throw error;
    }
  }

  /**
   * Sync customer to QuickBooks (create or update)
   */
  async syncCustomerToQuickBooks(customer: Customer): Promise<string> {
    try {
      const qbCustomer: QuickBooksCustomer = {
        DisplayName: customer.name,
        PrimaryEmailAddr: customer.email
          ? { Address: customer.email }
          : undefined,
        PrimaryPhone: customer.phone
          ? { FreeFormNumber: customer.phone }
          : undefined,
        CompanyName: customer.company || undefined,
        BillAddr: this.parseAddress(customer.address),
      };

      if (customer.quickbooks_id) {
        // Update existing customer in QuickBooks
        const existing = await this.client.getCustomerById(customer.quickbooks_id);
        if (existing) {
          qbCustomer.Id = customer.quickbooks_id;
          qbCustomer.SyncToken = existing.SyncToken;
          const updated = await this.client.updateCustomer(qbCustomer);
          return updated.Id!;
        }
      }

      // Create new customer in QuickBooks
      const created = await this.client.createCustomer(qbCustomer);
      
      // Update local customer with QuickBooks ID
      await supabase
        .from("customers")
        .update({ quickbooks_id: created.Id })
        .eq("id", customer.id);

      return created.Id!;
    } catch (error) {
      console.error("Failed to sync customer to QuickBooks:", error);
      throw error;
    }
  }

  /**
   * Create invoice in QuickBooks from accepted quote
   */
  async createInvoiceFromQuote(quote: Quote, customer: Customer): Promise<string> {
    try {
      // Ensure customer exists in QuickBooks
      let qbCustomerId = customer.quickbooks_id;
      if (!qbCustomerId) {
        qbCustomerId = await this.syncCustomerToQuickBooks(customer);
      }

      // Parse quote items
      const items = typeof quote.items === "string" 
        ? JSON.parse(quote.items) 
        : quote.items;

      // Create invoice line items
      const lineItems = items.map((item: any, index: number) => ({
        LineNum: index + 1,
        Description: item.description || item.name,
        Amount: item.price * (item.quantity || 1),
        DetailType: "SalesItemLineDetail" as const,
        SalesItemLineDetail: {
          Qty: item.quantity || 1,
          UnitPrice: item.price,
        },
      }));

      const invoice: QuickBooksInvoice = {
        Line: lineItems,
        CustomerRef: {
          value: qbCustomerId,
          name: customer.name,
        },
        TxnDate: new Date().toISOString().split("T")[0],
        DocNumber: quote.quote_number,
        PrivateNote: `Created from Quote-It AI - Quote #${quote.quote_number}`,
        BillEmail: customer.email ? { Address: customer.email } : undefined,
        TotalAmt: quote.total_price,
      };

      const createdInvoice = await this.client.createInvoice(invoice);

      // Update quote with QuickBooks invoice ID
      await supabase
        .from("quotes")
        .update({ 
          quickbooks_invoice_id: createdInvoice.Id,
          status: "invoiced" 
        })
        .eq("id", quote.id);

      // Send invoice email if customer has email
      if (customer.email && createdInvoice.Id) {
        try {
          await this.client.sendInvoice(createdInvoice.Id, customer.email);
        } catch (error) {
          console.error("Failed to send QuickBooks invoice:", error);
        }
      }

      return createdInvoice.Id!;
    } catch (error) {
      console.error("Failed to create invoice from quote:", error);
      throw error;
    }
  }

  /**
   * Sync payment status from QuickBooks
   */
  async syncPaymentStatus(invoiceId: string): Promise<"paid" | "partial" | "unpaid"> {
    try {
      const invoice = await this.client.getInvoiceById(invoiceId);
      if (!invoice) {
        return "unpaid";
      }

      const balance = invoice.Balance || 0;
      const total = invoice.TotalAmt || 0;

      if (balance === 0) {
        return "paid";
      } else if (balance < total) {
        return "partial";
      }
      return "unpaid";
    } catch (error) {
      console.error("Failed to sync payment status:", error);
      return "unpaid";
    }
  }

  /**
   * Helper: Format address for display
   */
  private formatAddress(qbCustomer: QuickBooksCustomer): string {
    const addr = qbCustomer.BillAddr;
    if (!addr) return "";

    const parts = [
      addr.Line1,
      addr.City,
      addr.CountrySubDivisionCode,
      addr.PostalCode,
      addr.Country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Helper: Parse address string into QuickBooks format
   */
  private parseAddress(address: string): QuickBooksCustomer["BillAddr"] {
    if (!address) return undefined;

    const parts = address.split(",").map((p) => p.trim());
    return {
      Line1: parts[0] || undefined,
      City: parts[1] || undefined,
      CountrySubDivisionCode: parts[2] || undefined,
      PostalCode: parts[3] || undefined,
      Country: parts[4] || undefined,
    };
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(type: string, count: number): Promise<void> {
    const key = `quickbooks_sync_${type}`;
    const status: QuickBooksSyncStatus = {
      lastSync: Date.now(),
      status: "idle",
      customersSynced: type === "customers" ? count : 0,
      invoicesSynced: type === "invoices" ? count : 0,
    };

    localStorage.setItem(key, JSON.stringify(status));
  }
}
