import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateCostItemTotal } from "@/lib/pricing";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const { id, costId } = await params;
    const body = await req.json();

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    const travelerCount = plan?.traveler_count || 1;
    const duration = plan?.duration || 1;

    const totalCost = calculateCostItemTotal(
      { cost_type: body.cost_type, quantity: body.quantity, unit_cost: body.unit_cost },
      travelerCount,
      duration
    );

    const cost = await prisma.tourCostItem.update({
      where: { id: costId },
      data: {
        category: body.category,
        item_name: body.item_name,
        cost_type: body.cost_type,
        quantity: parseFloat(body.quantity) || 1,
        unit_cost: parseFloat(body.unit_cost) || 0,
        total_cost: totalCost,
        note: body.note || "",
        sort_order: body.sort_order || 0,
      },
    });

    return NextResponse.json({ success: true, cost });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update cost item" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  try {
    const { costId } = await params;
    await prisma.tourCostItem.delete({ where: { id: costId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete cost item" }, { status: 500 });
  }
}
