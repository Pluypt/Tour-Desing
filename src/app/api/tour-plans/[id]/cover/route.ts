import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch both cover design and main tour plan
    const [cover, plan] = await Promise.all([
      prisma.tourCoverDesign.findFirst({
        where: { tour_plan_id: id },
        orderBy: { created_at: "desc" },
      }),
      prisma.tourPlan.findUnique({
        where: { id },
      })
    ]);

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    const defaultHeadline = plan.title || "";
    const defaultSubheadline = [plan.country, plan.main_city].filter(Boolean).join(" - ");
    const defaultDateText = plan.duration ? `${plan.duration} วัน` : "";
    const defaultBadge = plan.trip_type || "";

    const responseCover = {
      template_name: cover?.template_name || "Premium Proposal",
      background_url: cover?.background_url || plan.hero_image_url || "",
      headline: cover?.headline || defaultHeadline,
      subheadline: cover?.subheadline || defaultSubheadline,
      travel_date_text: cover?.travel_date_text || defaultDateText,
      price_text: cover?.price_text || "",
      badge_text: cover?.badge_text || defaultBadge,
      highlight_text: cover?.highlight_text || "",
      theme_color: cover?.theme_color || "#D32F2F",
      text_color: cover?.text_color || "#FFFFFF",
      overlay_style: cover?.overlay_style || "dark",
    };

    return NextResponse.json({ success: true, cover: responseCover });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to fetch cover" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Upsert: one cover per plan
    const existing = await prisma.tourCoverDesign.findFirst({ where: { tour_plan_id: id } });

    let cover;
    if (existing) {
      cover = await prisma.tourCoverDesign.update({
        where: { id: existing.id },
        data: {
          template_name: body.template_name,
          background_url: body.background_url,
          headline: body.headline,
          subheadline: body.subheadline,
          travel_date_text: body.travel_date_text,
          price_text: body.price_text,
          badge_text: body.badge_text,
          highlight_text: body.highlight_text,
          theme_color: body.theme_color ?? "#D32F2F",
          text_color: body.text_color ?? "#FFFFFF",
          overlay_style: body.overlay_style ?? "dark",
        },
      });
    } else {
      cover = await prisma.tourCoverDesign.create({
        data: {
          tour_plan_id: id,
          template_name: body.template_name ?? "Premium Proposal",
          background_url: body.background_url,
          headline: body.headline,
          subheadline: body.subheadline,
          travel_date_text: body.travel_date_text,
          price_text: body.price_text,
          badge_text: body.badge_text,
          highlight_text: body.highlight_text,
          theme_color: body.theme_color ?? "#D32F2F",
          text_color: body.text_color ?? "#FFFFFF",
          overlay_style: body.overlay_style ?? "dark",
        },
      });
    }

    return NextResponse.json({ success: true, cover });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to save cover" }, { status: 500 });
  }
}
