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

    let heroImageUrl = "";

    // 1. Try Gemini Imagen AI if GEMINI_API_KEY is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Photorealistic travel photography of ${destination}.
Scene: iconic landmark or natural scenery that is unmistakably from ${destination}.
Style: professional travel photography, golden hour, vivid colors, ultra-sharp details.
Composition: portrait orientation, vertical frame. No text, no logos.`;

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
        if (imageBytes) {
          heroImageUrl = `data:image/jpeg;base64,${imageBytes}`;
        }
      } catch (aiErr) {
        console.warn("Gemini Imagen generation unavailable, using high quality travel fallback:", aiErr);
      }
    }

    // 2. Fallback to curated Unsplash travel landmark photo if AI image is empty
    if (!heroImageUrl) {
      const encodedDest = encodeURIComponent(`${destination} landmark travel`);
      heroImageUrl = `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80`;
      
      // Select city specific high-res images if available
      const destLower = destination.toLowerCase();
      if (destLower.includes("macao") || destLower.includes("macau")) {
        heroImageUrl = "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("hong kong")) {
        heroImageUrl = "https://images.unsplash.com/photo-1506970845246-18f21d533b20?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("japan") || destLower.includes("tokyo")) {
        heroImageUrl = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80";
      } else if (destLower.includes("china") || destLower.includes("chengdu")) {
        heroImageUrl = "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&auto=format&fit=crop&q=80";
      }
    }

    // Save to tour plan hero_image_url
    await prisma.tourPlan.update({
      where: { id },
      data: { hero_image_url: heroImageUrl },
    });

    return NextResponse.json({ success: true, heroImageUrl });
  } catch (error) {
    console.error("Portrait cover image generation error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate cover image" }, { status: 500 });
  }
}
