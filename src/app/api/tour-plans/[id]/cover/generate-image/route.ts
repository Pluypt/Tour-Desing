import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const prompt = `Create a premium travel poster background for PR Travel Group.
Destination: ${plan.main_city}, ${plan.country}
Trip theme: ${plan.theme || "general travel"}
Customer type: ${plan.trip_type || "Private Tour"}
Mood: premium, clean, professional, warm, trustworthy
Style: luxury travel photography, cinematic lighting, high resolution, wide composition
Composition: leave empty space on the left side for Thai text and logo
Do not include text, logo, watermark, people faces, or random letters.
Use realistic landmark or atmosphere related to the destination.
Aspect ratio: 16:9`;

    const imageResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
      },
    });

    const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      return NextResponse.json({ success: false, error: "Image generation returned no data" }, { status: 500 });
    }

    const backgroundUrl = `data:image/jpeg;base64,${imageBytes}`;

    // Save to cover design
    const existing = await prisma.tourCoverDesign.findFirst({ where: { tour_plan_id: id } });
    if (existing) {
      await prisma.tourCoverDesign.update({ where: { id: existing.id }, data: { background_url: backgroundUrl } });
    } else {
      await prisma.tourCoverDesign.create({
        data: { tour_plan_id: id, background_url: backgroundUrl, template_name: "Premium Proposal" },
      });
    }

    return NextResponse.json({ success: true, backgroundUrl });
  } catch (error) {
    console.error("Cover image generation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate cover image" }, { status: 500 });
  }
}
