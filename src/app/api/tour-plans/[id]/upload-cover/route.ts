import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { imageBase64 } = body;

    // imageBase64 can be null (to clear the image) or a base64 data URL
    if (imageBase64 !== null && (!imageBase64 || !imageBase64.startsWith("data:image/"))) {
      return NextResponse.json({ success: false, error: "Invalid image data" }, { status: 400 });
    }

    // Update hero_image_url in tour plan (null = remove)
    await prisma.tourPlan.update({
      where: { id },
      data: { hero_image_url: imageBase64 ?? null },
    });

    return NextResponse.json({ success: true, heroImageUrl: imageBase64 ?? null });
  } catch (error) {
    console.error("Upload cover failed:", error);
    return NextResponse.json({ success: false, error: "Failed to upload cover image" }, { status: 500 });
  }
}
