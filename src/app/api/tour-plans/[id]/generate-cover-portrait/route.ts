import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const destination = [plan.main_city, plan.country].filter(Boolean).join(", ") || "Thailand";
    const theme = plan.theme || plan.trip_type || "general travel";

    const prompt = `Photorealistic travel photography of ${destination}.
Scene: iconic landmark or natural scenery that is unmistakably from ${destination}.
Style: professional travel photography, golden hour or soft natural light, vivid colors, ultra-sharp details.
Composition: portrait orientation, vertical frame — subject fills the frame beautifully.
Mood: inspiring, breathtaking, authentic — makes the viewer want to travel there.
Theme: ${theme}.
No text, no logos, no watermarks, no people faces, no borders, no frames.
Shot as if by a professional travel photographer with a high-end camera.`;

    const imageResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "9:16",
        outputMimeType: "image/jpeg",
      },
    });

    const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      return NextResponse.json({ success: false, error: "Image generation returned no data" }, { status: 500 });
    }

    const heroImageUrl = `data:image/jpeg;base64,${imageBytes}`;

    // Save to tour plan hero_image_url
    await prisma.tourPlan.update({
      where: { id },
      data: { hero_image_url: heroImageUrl },
    });

    return NextResponse.json({ success: true, heroImageUrl });
  } catch (error) {
    console.error("Portrait cover image generation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate cover image" }, { status: 500 });
  }
}
