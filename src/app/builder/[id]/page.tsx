import { prisma } from "@/lib/prisma";
import TourBuilderClient from "./TourBuilderClient";
import { notFound } from "next/navigation";

export default async function TourBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.tourPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      Inclusions: { orderBy: { sort_order: "asc" } },
      Exclusions: { orderBy: { sort_order: "asc" } },
      TourDays: {
        orderBy: { sort_order: "asc" },
        include: {
          TourActivities: {
            orderBy: { sort_order: "asc" }
          }
        }
      }
    }
  });

  if (!plan) return notFound();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <TourBuilderClient initialPlan={plan} />
    </div>
  );
}
