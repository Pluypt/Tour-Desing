import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchGoogleImages, selectTopImagesForDay } from "@/lib/image-search";

export async function POST(req: Request, { params }: { params: Promise<{ dayId: string }> }) {
  try {
    const { dayId } = await params;
    const body = await req.json();
    const keywords: string[] = body.keywords || [];

    if (keywords.length === 0) {
      return NextResponse.json({ success: false, error: "No keywords provided" }, { status: 400 });
    }

    // Search images for each keyword, collect all results
    const allResults = [];
    for (const kw of keywords.slice(0, 4)) {
      const results = await searchGoogleImages(kw, 2);
      allResults.push(...results.map(r => ({ ...r, search_keyword: kw })));
    }

    const selected = selectTopImagesForDay(allResults, 4);

    // Delete existing images for this day and save new ones
    await prisma.tourDayImage.deleteMany({ where: { tour_day_id: dayId } });

    const saved = await Promise.all(
      selected.map((img, i) =>
        prisma.tourDayImage.create({
          data: {
            tour_day_id: dayId,
            image_url: img.imageUrl,
            thumbnail_url: img.thumbnailUrl || null,
            source_url: img.sourceUrl || null,
            source_title: img.sourceTitle || null,
            provider: img.provider,
            search_keyword: (img as typeof img & { search_keyword?: string }).search_keyword || null,
            alt_text: img.altText || null,
            is_selected: true,
            sort_order: i,
          },
        })
      )
    );

    return NextResponse.json({ success: true, images: saved, count: saved.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to search images" }, { status: 500 });
  }
}
