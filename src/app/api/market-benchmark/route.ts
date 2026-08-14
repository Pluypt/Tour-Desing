import { NextResponse } from "next/server";
import { getTripComBenchmark } from "@/lib/tripComBenchmark";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { city, country, duration, hotelLevel, currentSellingPrice, travelerCount } = body;

    const benchmark = getTripComBenchmark({
      city,
      country,
      durationDays: parseInt(duration) || 4,
      hotelLevel,
      currentSellingPrice: parseFloat(currentSellingPrice) || 0,
      travelerCount: parseInt(travelerCount) || 2,
    });

    return NextResponse.json({
      success: true,
      data: benchmark,
    });
  } catch (error: any) {
    console.error("Market benchmark API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Trip.com market benchmark" },
      { status: 500 }
    );
  }
}
