import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchGoogleImages, selectTopImagesForDay } from "@/lib/image-search";

export async function GET(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  try {
    const { dayId } = await params;
    const images = await prisma.tourDayImage.findMany({
      where: { tour_day_id: dayId },
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  try {
    const { dayId } = await params;
    const body = await req.json();

    const image = await prisma.tourDayImage.create({
      data: {
        tour_day_id: dayId,
        image_url: body.image_url,
        thumbnail_url: body.thumbnail_url || null,
        source_url: body.source_url || null,
        source_title: body.source_title || null,
        provider: body.provider || "manual_upload",
        location_name: body.location_name || null,
        search_keyword: body.search_keyword || null,
        alt_text: body.alt_text || null,
        caption: body.caption || null,
        is_selected: true,
        sort_order: body.sort_order || 0,
      },
    });

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to save image" }, { status: 500 });
  }
}
