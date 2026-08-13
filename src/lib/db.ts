import { adminDb } from './firebaseAdmin';

export interface CustomerData {
  id?: string;
  name: string;
  phone?: string | null;
  line_id?: string | null;
  email?: string | null;
  customer_type?: string | null;
  traveler_count?: number | null;
  age_range?: string | null;
  note?: string | null;
  average_budget?: number | null;
  interested_countries?: string | null;
  latest_status?: string | null;
  internal_note?: string | null;
  created_at?: any;
  updated_at?: any;
}

export interface TourPlanData {
  id?: string;
  tour_code?: string | null;
  customer_id?: string | null;
  title?: string | null;
  country?: string | null;
  main_city?: string | null;
  secondary_city?: string | null;
  start_date?: any;
  end_date?: any;
  duration?: number | null;
  trip_type?: string | null;
  theme?: string | null;
  traveler_count?: number | null;
  age_range?: string | null;
  airline?: string | null;
  flight_route?: string | null;
  outbound_flight?: string | null;
  outbound_time?: string | null;
  return_flight?: string | null;
  return_time?: string | null;
  hotel_level?: string | null;
  budget_per_person?: number | null;
  total_budget?: number | null;
  internal_cost?: number | null;
  selling_price_per_person?: number | null;
  total_selling_price?: number | null;
  profit_amount?: number | null;
  profit_percent?: number | null;
  status?: string;
  hero_image_url?: string | null;
  internal_note?: string | null;
  customer_note?: string | null;
  created_by?: string | null;
  cost_currency?: string | null;
  exchange_rate?: number | null;
  total_fixed_cost?: number | null;
  total_variable_cost?: number | null;
  total_cost?: number | null;
  cost_per_person?: number | null;
  pricing_method?: string | null;
  target_profit_percent?: number | null;
  target_profit_per_person?: number | null;
  deposit_amount?: number | null;
  remaining_amount?: number | null;
  created_at?: any;
  updated_at?: any;

  customer?: CustomerData | null;
  TourDays?: any[];
  Hotels?: any[];
  Inclusions?: any[];
  Exclusions?: any[];
  CostItems?: any[];
  CoverDesigns?: any[];
  TourVersions?: any[];
}

export function formatDocData<T>(data: any): T {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => formatDocData(item)) as unknown as T;
  }
  const result: any = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      result[key] = val.toDate();
    } else if (val && typeof val === 'object' && val.seconds !== undefined && val.nanoseconds !== undefined) {
      result[key] = new Date(val.seconds * 1000);
    } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      result[key] = formatDocData(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

export function generateId(): string {
  return adminDb.collection('_dummy').doc().id;
}
