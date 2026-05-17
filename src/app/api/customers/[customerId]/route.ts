import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        TourPlans: {
          orderBy: { created_at: "desc" },
          select: {
            id: true, tour_code: true, title: true, country: true,
            main_city: true, start_date: true, end_date: true,
            status: true, traveler_count: true, selling_price_per_person: true,
            created_at: true,
          },
        },
      },
    });

    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const body = await req.json();

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: body.name,
        phone: body.phone,
        line_id: body.line_id,
        email: body.email,
        customer_type: body.customer_type,
        traveler_count: body.traveler_count ? parseInt(body.traveler_count) : null,
        age_range: body.age_range,
        note: body.note,
        average_budget: body.average_budget ? parseFloat(body.average_budget) : null,
        interested_countries: body.interested_countries,
        internal_note: body.internal_note,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}
