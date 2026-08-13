import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai } from "@/lib/ai";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const plan = await prisma.tourPlan.findUnique({ where: { id } });
    if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    const destination = [plan.main_city, plan.country].filter(Boolean).join(", ") || "Thailand";

    let backgroundUrl = "";

    // 1. Try Gemini Imagen AI if GEMINI_API_KEY is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Create a premium travel poster background for PR Travel Group.
Destination: ${destination}
Trip theme: ${plan.theme || "general travel"}
Style: luxury travel photography, cinematic lighting, high resolution.
Do not include text, logo, watermark, or people faces.`;

        const imageResponse = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "3:4",
            outputMimeType: "image/jpeg",
          },
        });

        const imageBytes = imageResponse.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
          backgroundUrl = `data:image/jpeg;base64,${imageBytes}`;
        }
      } catch (aiErr) {
        console.warn("Imagen API cover generation unavailable, using destination fallback photo:", aiErr);
      }
    }

    // 2. Fallback to curated travel photo if AI image generation is unavailable
    if (!backgroundUrl) {
      const destLower = destination.toLowerCase();
      backgroundUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80";
      if (destLower.includes("macao") || destLower.includes("macau")) {
        backgroundUrl = "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("hong kong")) {
        backgroundUrl = "https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("japan") || destLower.includes("tokyo")) {
        backgroundUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("china") || destLower.includes("chengdu")) {
        backgroundUrl = "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&auto=format&fit=crop&q=80";
      }
    }

    // Save to cover design & plan hero_image_url
    const existing = await prisma.tourCoverDesign.findFirst({ where: { tour_plan_id: id } });
    if (existing) {
      await prisma.tourCoverDesign.update({ where: { id: existing.id }, data: { background_url: backgroundUrl } });
    } else {
      await prisma.tourCoverDesign.create({
        data: { tour_plan_id: id, background_url: backgroundUrl, template_name: "Premium Proposal" },
      });
    }

    await prisma.tourPlan.update({
      where: { id },
      data: { hero_image_url: backgroundUrl },
    });

    return NextResponse.json({ success: true, backgroundUrl });
  } catch (error) {
    console.error("Cover image generation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to generate cover image" }, { status: 500 });
  }
}
