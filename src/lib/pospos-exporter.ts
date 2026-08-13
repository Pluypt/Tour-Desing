/**
 * POSPOS Bulk Import CSV Exporter Utility
 * Generates UTF-8 BOM CSV files matching POSPOS import template specifications.
 */

export interface PosposProductImportRow {
  barcode?: string;         // บาร์โค้ด / รหัสสินค้า
  name: string;             // ชื่อสินค้า
  category: string;         // หมวดหมู่
  selling_price: number;    // ราคาขาย
  cost_price?: number;      // ราคาต้นทุน
  unit?: string;            // หน่วยนับ (เช่น ชิ้น, แพ็ก, ท่าน, ทริป)
  stock_quantity?: number;  // จำนวนสต็อกเริ่มต้น
  min_stock?: number;       // สต็อกขั้นต่ำ
  description?: string;     // รายละเอียดเพิ่มเติม
}

/**
 * Escapes CSV text fields properly for RFC 4180
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts array of product objects to POSPOS Template CSV String (with UTF-8 BOM)
 */
export function generatePosposCsv(products: PosposProductImportRow[]): string {
  // Standard POSPOS Excel Import Header
  const headers = [
    'บาร์โค้ด',
    'ชื่อสินค้า',
    'หมวดหมู่',
    'ราคาขาย',
    'ราคาต้นทุน',
    'หน่วยนับ',
    'จำนวนสต็อก',
    'สต็อกขั้นต่ำ',
    'รายละเอียด'
  ];

  const rows = products.map(p => [
    escapeCsvCell(p.barcode || ''),
    escapeCsvCell(p.name),
    escapeCsvCell(p.category || 'ทั่วไป'),
    escapeCsvCell(p.selling_price),
    escapeCsvCell(p.cost_price || 0),
    escapeCsvCell(p.unit || 'รายการ'),
    escapeCsvCell(p.stock_quantity ?? 999),
    escapeCsvCell(p.min_stock ?? 0),
    escapeCsvCell(p.description || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  
  // Prepend UTF-8 Byte Order Mark (BOM) so Microsoft Excel displays Thai text correctly
  const UTF8_BOM = '\uFEFF';
  return UTF8_BOM + csvContent;
}

/**
 * Example helper to convert TourPlan records into POSPOS Product rows
 */
export function convertTourPlansToPosposRows(tourPlans: Array<{
  id: string;
  tour_code?: string | null;
  title?: string | null;
  country?: string | null;
  selling_price_per_person?: number | null;
  total_selling_price?: number | null;
  cost_per_person?: number | null;
  internal_cost?: number | null;
  duration?: number | null;
}>): PosposProductImportRow[] {
  return tourPlans.map(plan => {
    const code = plan.tour_code || `TOUR-${plan.id.slice(-6)}`;
    const title = plan.title || 'แพ็กเกจทัวร์';
    const category = plan.country ? `ทัวร์${plan.country}` : 'แพ็กเกจทัวร์';
    const sellingPrice = plan.selling_price_per_person || plan.total_selling_price || 0;
    const costPrice = plan.cost_per_person || plan.internal_cost || 0;

    return {
      barcode: code,
      name: `[${code}] ${title}`,
      category,
      selling_price: sellingPrice,
      cost_price: costPrice,
      unit: 'ท่าน',
      stock_quantity: 100,
      description: `ทริปท่องเที่ยว ${plan.duration || ''} วัน`
    };
  });
}
