import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { line_id: { contains: search } },
            ],
          } : {},
          type ? { customer_type: type } : {},
        ],
      },
      include: {
        TourPlans: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: { status: true, title: true, created_at: true },
        },
        _count: { select: { TourPlans: true } },
      },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}
