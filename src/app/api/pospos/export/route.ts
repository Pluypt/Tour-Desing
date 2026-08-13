import { NextResponse } from 'next/server';
import { generatePosposCsv, PosposProductImportRow } from '@/lib/pospos-exporter';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint to download POSPOS Import CSV file
 * Usage: GET /api/pospos/export
 */
export async function GET() {
  try {
    let rows: PosposProductImportRow[] = [];

    // Attempt to pull tour plans from DB if available
    try {
      const tourPlans = await prisma.tourPlan.findMany({
        take: 50,
        orderBy: { updated_at: 'desc' }
      });

      if (tourPlans.length > 0) {
        rows = tourPlans.map(plan => ({
          barcode: plan.tour_code || `TOUR-${plan.id.slice(-6)}`,
          name: plan.title ? `[${plan.tour_code || 'TOUR'}] ${plan.title}` : 'แพ็กเกจทัวร์',
          category: plan.country ? `ทัวร์${plan.country}` : 'แพ็กเกจทัวร์',
          selling_price: plan.selling_price_per_person || plan.total_selling_price || 0,
          cost_price: plan.cost_per_person || plan.internal_cost || 0,
          unit: 'ท่าน',
          stock_quantity: 100,
          min_stock: 5,
          description: `แพ็กเกจทัวร์ ${plan.country || ''} ระยะเวลา ${plan.duration || ''} วัน`
        }));
      }
    } catch (dbErr) {
      console.warn('Could not fetch tour plans from database, generating sample POSPOS products:', dbErr);
    }

    // Fallback sample data if DB has no records yet
    if (rows.length === 0) {
      rows = [
        {
          barcode: 'TOUR-JPN-001',
          name: 'แพ็กเกจทัวร์ ญี่ปุ่น โตเกียว ฟูจิ 5 วัน 3 คืน',
          category: 'ทัวร์ต่างประเทศ',
          selling_price: 35900,
          cost_price: 28000,
          unit: 'ท่าน',
          stock_quantity: 30,
          min_stock: 5,
          description: 'ทัวร์ญี่ปุ่น ไฮไลท์โตเกียว ฟูจิ ช็อปปิ้งชินจูกุ'
        },
        {
          barcode: 'TOUR-KOR-002',
          name: 'แพ็กเกจทัวร์ เกาหลี โซล นามิ 4 วัน 3 คืน',
          category: 'ทัวร์ต่างประเทศ',
          selling_price: 22900,
          cost_price: 17500,
          unit: 'ท่าน',
          stock_quantity: 40,
          min_stock: 5,
          description: 'เกาหลีใต้ เที่ยวเกาะนามิ พระราชวังเคียงบก'
        },
        {
          barcode: 'SERV-VISA-001',
          name: 'บริการยื่นวีซ่าเชงเก้น (Schengen Visa)',
          category: 'บริการวีซ่า',
          selling_price: 3500,
          cost_price: 2000,
          unit: 'รายการ',
          stock_quantity: 999,
          min_stock: 0,
          description: 'ค่าบริการยื่นเอกสารวีซ่าเชงเก้น'
        }
      ];
    }

    const csvData = generatePosposCsv(rows);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pospos_products_import_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
