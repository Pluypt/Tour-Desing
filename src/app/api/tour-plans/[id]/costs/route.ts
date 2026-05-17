import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCostItemTotal } from "@/lib/pricing";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const costs = await prisma.tourCostItem.findMany({
      where: { tour_plan_id: id },
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({ success: true, costs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch costs" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const travelerCount = plan.traveler_count || 1;
    const duration = plan.duration || 1;

    const totalCost = calculateCostItemTotal(
      { cost_type: body.cost_type, quantity: body.quantity, unit_cost: body.unit_cost },
      travelerCount,
      duration
    );

    const cost = await prisma.tourCostItem.create({
      data: {
        tour_plan_id: id,
        category: body.category || "other",
        item_name: body.item_name || "",
        cost_type: body.cost_type || "fixed_group",
        quantity: parseFloat(body.quantity) || 1,
        unit_cost: parseFloat(body.unit_cost) || 0,
        total_cost: totalCost,
        is_internal: true,
        note: body.note || "",
        sort_order: body.sort_order || 0,
      },
    });

    return NextResponse.json({ success: true, cost });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to create cost item" }, { status: 500 });
  }
}
