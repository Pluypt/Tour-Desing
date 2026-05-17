import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateTourPricing } from "@/lib/pricing";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const plan = await prisma.tourPlan.findUnique({
      where: { id },
      include: { CostItems: true },
    });

    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const result = calculateTourPricing({
      costItems: plan.CostItems,
      travelerCount: plan.traveler_count || 1,
      duration: plan.duration || 1,
      pricingMethod: body.pricingMethod ?? plan.pricing_method,
      targetProfitPercent: body.targetProfitPercent ?? plan.target_profit_percent,
      targetProfitPerPerson: body.targetProfitPerPerson ?? plan.target_profit_per_person,
      manualSellingPricePerPerson: body.manualSellingPricePerPerson ?? plan.selling_price_per_person,
    });

    // Save pricing results back to TourPlan
    await prisma.tourPlan.update({
      where: { id },
      data: {
        pricing_method: body.pricingMethod ?? plan.pricing_method,
        target_profit_percent: body.targetProfitPercent ?? plan.target_profit_percent,
        target_profit_per_person: body.targetProfitPerPerson ?? plan.target_profit_per_person,
        total_fixed_cost: result.totalFixedCost,
        total_variable_cost: result.totalVariableCost,
        total_cost: result.totalCost,
        cost_per_person: result.costPerPerson,
        selling_price_per_person: result.sellingPricePerPerson,
        total_selling_price: result.totalSellingPrice,
        profit_amount: result.profitAmount,
        profit_percent: result.profitPercent,
        deposit_amount: result.depositAmount,
        remaining_amount: result.remainingAmount,
      },
    });

    return NextResponse.json({ success: true, pricing: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to calculate pricing" }, { status: 500 });
  }
}
