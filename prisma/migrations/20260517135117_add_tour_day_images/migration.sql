-- AlterTable
ALTER TABLE "customers" ADD COLUMN "average_budget" REAL;
ALTER TABLE "customers" ADD COLUMN "email" TEXT;
ALTER TABLE "customers" ADD COLUMN "interested_countries" TEXT;
ALTER TABLE "customers" ADD COLUMN "internal_note" TEXT;
ALTER TABLE "customers" ADD COLUMN "latest_status" TEXT;

-- CreateTable
CREATE TABLE "tour_cover_designs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "template_name" TEXT,
    "background_url" TEXT,
    "logo_url" TEXT,
    "headline" TEXT,
    "subheadline" TEXT,
    "travel_date_text" TEXT,
    "price_text" TEXT,
    "badge_text" TEXT,
    "highlight_text" TEXT,
    "theme_color" TEXT DEFAULT '#D32F2F',
    "text_color" TEXT DEFAULT '#FFFFFF',
    "overlay_style" TEXT DEFAULT 'dark',
    "export_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tour_cover_designs_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tour_day_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_day_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "source_url" TEXT,
    "source_title" TEXT,
    "photographer" TEXT,
    "provider" TEXT,
    "location_name" TEXT,
    "search_keyword" TEXT,
    "alt_text" TEXT,
    "caption" TEXT,
    "is_selected" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tour_day_images_tour_day_id_fkey" FOREIGN KEY ("tour_day_id") REFERENCES "tour_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
