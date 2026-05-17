import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ dayId: string; imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const body = await req.json();

    const image = await prisma.tourDayImage.update({
      where: { id: imageId },
      data: {
        caption: body.caption,
        alt_text: body.alt_text,
        is_selected: body.is_selected,
        sort_order: body.sort_order,
      },
    });

    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update image" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ dayId: string; imageId: string }> }
) {
  try {
    const { imageId } = await params;
    await prisma.tourDayImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
  }
}
