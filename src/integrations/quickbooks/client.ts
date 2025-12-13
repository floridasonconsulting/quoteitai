/**
 * QuickBooks API Client
 * Handles OAuth2 authentication and API requests to QuickBooks Online
 */

import { QuickBooksTokens, QuickBooksCustomer, QuickBooksInvoice, QuickBooksPayment, QuickBooksItem, QuickBooksCompanyInfo } from "./types";

const QUICKBOOKS_API_BASE = "https://quickbooks.api.intuit.com/v3/company";
const QUICKBOOKS_SANDBOX_API_BASE = "https://sandbox-quickbooks.api.intuit.com/v3/company";
const QUICKBOOKS_OAUTH_BASE = "https://oauth.platform.intuit.com/oauth2/v1";

interface QuickBooksQueryResponse<T> {
  QueryResponse: T;
}

interface QuickBooksEntityResponse<T> {
  [key: string]: T;
}

export class QuickBooksClient {
  private realmId: string;
  private environment: "sandbox" | "production";
  private getAccessToken: () => Promise<string>;

  constructor(
    realmId: string,
    environment: "sandbox" | "production",
    getAccessToken: () => Promise<string>
  ) {
    this.realmId = realmId;
    this.environment = environment;
    this.getAccessToken = getAccessToken;
  }

  private get baseUrl(): string {
    return this.environment === "production"
      ? QUICKBOOKS_API_BASE
      : QUICKBOOKS_SANDBOX_API_BASE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/${this.realmId}/${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `QuickBooks API error: ${response.status} - ${JSON.stringify(error)}`
      );
    }

    return response.json();
  }

  /**
   * Customer Operations
   */
  async getCustomers(maxResults: number = 100): Promise<QuickBooksCustomer[]> {
    const response = await this.request<QuickBooksQueryResponse<{ Customer: QuickBooksCustomer[] }>>(
      `query?query=SELECT * FROM Customer MAXRESULTS ${maxResults}`
    );
    return response.QueryResponse?.Customer || [];
  }

  async getCustomerById(id: string): Promise<QuickBooksCustomer | null> {
    try {
      const response = await this.request<QuickBooksEntityResponse<QuickBooksCustomer>>(`customer/${id}`);
      return response.Customer;
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customer: QuickBooksCustomer): Promise<QuickBooksCustomer> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksCustomer>>("customer", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    return response.Customer;
  }

  async updateCustomer(customer: QuickBooksCustomer): Promise<QuickBooksCustomer> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksCustomer>>("customer", {
      method: "POST",
      body: JSON.stringify({
        ...customer,
        sparse: true,
      }),
    });
    return response.Customer;
  }

  /**
   * Invoice Operations
   */
  async getInvoices(maxResults: number = 100): Promise<QuickBooksInvoice[]> {
    const response = await this.request<QuickBooksQueryResponse<{ Invoice: QuickBooksInvoice[] }>>(
      `query?query=SELECT * FROM Invoice MAXRESULTS ${maxResults} ORDERBY TxnDate DESC`
    );
    return response.QueryResponse?.Invoice || [];
  }

  async getInvoiceById(id: string): Promise<QuickBooksInvoice | null> {
    try {
      const response = await this.request<QuickBooksEntityResponse<QuickBooksInvoice>>(`invoice/${id}`);
      return response.Invoice;
    } catch (error) {
      return null;
    }
  }

  async createInvoice(invoice: QuickBooksInvoice): Promise<QuickBooksInvoice> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksInvoice>>("invoice", {
      method: "POST",
      body: JSON.stringify(invoice),
    });
    return response.Invoice;
  }

  async sendInvoice(invoiceId: string, email: string): Promise<QuickBooksInvoice> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksInvoice>>(`invoice/${invoiceId}/send?sendTo=${email}`, {
      method: "POST",
    });
    return response.Invoice;
  }

  /**
   * Payment Operations
   */
  async getPayments(maxResults: number = 100): Promise<QuickBooksPayment[]> {
    const response = await this.request<QuickBooksQueryResponse<{ Payment: QuickBooksPayment[] }>>(
      `query?query=SELECT * FROM Payment MAXRESULTS ${maxResults} ORDERBY TxnDate DESC`
    );
    return response.QueryResponse?.Payment || [];
  }

  async createPayment(payment: QuickBooksPayment): Promise<QuickBooksPayment> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksPayment>>("payment", {
      method: "POST",
      body: JSON.stringify(payment),
    });
    return response.Payment;
  }

  /**
   * Item Operations
   */
  async getItems(maxResults: number = 100): Promise<QuickBooksItem[]> {
    const response = await this.request<QuickBooksQueryResponse<{ Item: QuickBooksItem[] }>>(
      `query?query=SELECT * FROM Item WHERE Type='Service' MAXRESULTS ${maxResults}`
    );
    return response.QueryResponse?.Item || [];
  }

  async createItem(item: QuickBooksItem): Promise<QuickBooksItem> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksItem>>("item", {
      method: "POST",
      body: JSON.stringify(item),
    });
    return response.Item;
  }

  /**
   * Company Info
   */
  async getCompanyInfo(): Promise<QuickBooksCompanyInfo> {
    const response = await this.request<QuickBooksEntityResponse<QuickBooksCompanyInfo>>("companyinfo/" + this.realmId);
    return response.CompanyInfo;
  }

  /**
   * OAuth Token Management
   */
  static async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string
  ): Promise<QuickBooksTokens> {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const response = await fetch(`${QUICKBOOKS_OAUTH_BASE}/tokens/bearer`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const tokens = await response.json();
    return {
      ...tokens,
      created_at: Date.now(),
    };
  }

  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<QuickBooksTokens> {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const response = await fetch(`${QUICKBOOKS_OAUTH_BASE}/tokens/bearer`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const tokens = await response.json();
    return {
      ...tokens,
      created_at: Date.now(),
    };
  }

  static async revokeToken(
    token: string,
    clientId: string,
    clientSecret: string
  ): Promise<void> {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    await fetch(`${QUICKBOOKS_OAUTH_BASE}/tokens/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
      }),
    });
  }

  static getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    state: string,
    environment: "sandbox" | "production" = "production"
  ): string {
    const baseUrl = "https://appcenter.intuit.com/connect/oauth2";
    const scope = "com.intuit.quickbooks.accounting";
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      state,
    });

    return `${baseUrl}?${params.toString()}`;
  }
}
