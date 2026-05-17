import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const PIPELINE_STATUSES = [
  "Draft",
  "AI Generated",
  "Internal Review",
  "Sent to Customer",
  "Customer Requested Revision",
  "Revised",
  "Waiting for Deposit",
  "Deposit Paid",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!PIPELINE_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const plan = await prisma.tourPlan.update({
      where: { id },
      data: { status },
    });

    // Sync latest_status to customer
    if (plan.customer_id) {
      await prisma.customer.update({
        where: { id: plan.customer_id },
        data: { latest_status: status },
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
