/**
 * POSPOS Developer API Client
 * Official API Base URL: https://api.pospos.co (or configured via environment variable)
 */

export interface PosposStockItem {
  id?: string | number;
  barcode?: string;
  name: string;
  price: number;
  cost?: number;
  unit?: string;
  category?: string;
  stock_quantity?: number;
  updated_at?: string;
}

export interface PosposTransaction {
  id: string;
  transaction_no: string;
  created_at: string;
  total_price: number;
  discount?: number;
  payment_method?: string;
  items: Array<{
    barcode?: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export interface PosposApiConfig {
  apiKey: string;
  baseUrl?: string;
}

export class PosposClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: Partial<PosposApiConfig>) {
    this.apiKey = config?.apiKey || process.env.POSPOS_API_KEY || '';
    this.baseUrl = (config?.baseUrl || process.env.POSPOS_API_BASE_URL || 'https://api.pospos.co').replace(/\/$/, '');
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('POSPOS API Key (Token) is missing. Please set POSPOS_API_KEY in environment variables.');
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POSPOS API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all stock items from POSPOS
   */
  async getStock(): Promise<PosposStockItem[]> {
    return this.fetchApi<PosposStockItem[]>('/developer/api/stock');
  }

  /**
   * Get stock with pagination
   */
  async getStockPaginated(page: number = 1, limit: number = 50): Promise<{ data: PosposStockItem[]; total: number; page: number }> {
    return this.fetchApi<{ data: PosposStockItem[]; total: number; page: number }>(
      `/developer/api/stock/pagination?page=${page}&limit=${limit}`
    );
  }

  /**
   * Get sales transactions history
   */
  async getTransactions(startDate?: string, endDate?: string): Promise<PosposTransaction[]> {
    let query = '';
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) query = `?${params.toString()}`;

    return this.fetchApi<PosposTransaction[]>(`/developer/api/transactions${query}`);
  }
}

export const posposClient = new PosposClient();
