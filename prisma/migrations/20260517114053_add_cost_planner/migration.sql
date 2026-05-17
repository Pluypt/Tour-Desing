-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "line_id" TEXT,
    "customer_type" TEXT,
    "traveler_count" INTEGER,
    "age_range" TEXT,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tour_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_code" TEXT,
    "customer_id" TEXT,
    "title" TEXT,
    "country" TEXT,
    "main_city" TEXT,
    "secondary_city" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "duration" INTEGER,
    "trip_type" TEXT,
    "theme" TEXT,
    "traveler_count" INTEGER,
    "age_range" TEXT,
    "airline" TEXT,
    "flight_route" TEXT,
    "outbound_flight" TEXT,
    "outbound_time" TEXT,
    "return_flight" TEXT,
    "return_time" TEXT,
    "hotel_level" TEXT,
    "budget_per_person" REAL,
    "total_budget" REAL,
    "internal_cost" REAL,
    "selling_price_per_person" REAL,
    "total_selling_price" REAL,
    "profit_amount" REAL,
    "profit_percent" REAL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "hero_image_url" TEXT,
    "internal_note" TEXT,
    "customer_note" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "cost_currency" TEXT DEFAULT 'THB',
    "exchange_rate" REAL DEFAULT 1,
    "total_fixed_cost" REAL DEFAULT 0,
    "total_variable_cost" REAL DEFAULT 0,
    "total_cost" REAL DEFAULT 0,
    "cost_per_person" REAL DEFAULT 0,
    "pricing_method" TEXT,
    "target_profit_percent" REAL DEFAULT 0,
    "target_profit_per_person" REAL DEFAULT 0,
    "deposit_amount" REAL DEFAULT 0,
    "remaining_amount" REAL DEFAULT 0,
    CONSTRAINT "tour_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tour_cost_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "cost_type" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit_cost" REAL NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tour_cost_items_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tour_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "actual_date" DATETIME,
    "day_title" TEXT,
    "city" TEXT,
    "hotel_name" TEXT,
    "breakfast_included" BOOLEAN NOT NULL DEFAULT false,
    "lunch_included" BOOLEAN NOT NULL DEFAULT false,
    "dinner_included" BOOLEAN NOT NULL DEFAULT false,
    "customer_note" TEXT,
    "internal_note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tour_days_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tour_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_day_id" TEXT NOT NULL,
    "time_text" TEXT,
    "activity_title" TEXT,
    "activity_description" TEXT,
    "location_name" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tour_activities_tour_day_id_fkey" FOREIGN KEY ("tour_day_id") REFERENCES "tour_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "night_text" TEXT,
    "hotel_name" TEXT,
    "hotel_level" TEXT,
    "room_type" TEXT,
    "area" TEXT,
    "image_url" TEXT,
    "note" TEXT,
    CONSTRAINT "hotels_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inclusions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "item_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "inclusions_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exclusions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "item_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "exclusions_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tour_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tour_plan_id" TEXT NOT NULL,
    "version_no" INTEGER NOT NULL,
    "snapshot_json" TEXT NOT NULL,
    "edit_note" TEXT,
    "edited_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tour_versions_tour_plan_id_fkey" FOREIGN KEY ("tour_plan_id") REFERENCES "tour_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
