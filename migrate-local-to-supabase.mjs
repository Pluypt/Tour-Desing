import { PrismaClient as SupabaseClient } from '@prisma/client'
import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Connect to Supabase (via .env DATABASE_URL)
const supabase = new SupabaseClient()

// Connect to local SQLite
const sqlite = new Database(join(__dirname, 'prisma/dev.db'))

function toDate(val) {
  if (!val) return null
  // SQLite stores as unix ms or ISO string
  if (typeof val === 'number') return new Date(val)
  return new Date(val)
}

async function migrate() {
  console.log('🚀 Starting migration from local SQLite → Supabase...\n')

  // 1. Customers
  const customers = sqlite.prepare('SELECT * FROM customers').all()
  console.log(`📦 Migrating ${customers.length} customers...`)
  for (const c of customers) {
    await supabase.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        phone: c.phone || null,
        line_id: c.line_id || null,
        email: c.email || null,
        customer_type: c.customer_type || null,
        traveler_count: c.traveler_count || null,
        age_range: c.age_range || null,
        note: c.note || null,
        average_budget: c.average_budget || null,
        interested_countries: c.interested_countries || null,
        latest_status: c.latest_status || null,
        internal_note: c.internal_note || null,
        created_at: toDate(c.created_at),
        updated_at: toDate(c.updated_at),
      }
    })
  }
  console.log('  ✅ Customers done')

  // 2. Tour Plans
  const tourPlans = sqlite.prepare('SELECT * FROM tour_plans').all()
  console.log(`📦 Migrating ${tourPlans.length} tour plans...`)
  for (const p of tourPlans) {
    await supabase.tourPlan.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        tour_code: p.tour_code || null,
        customer_id: p.customer_id || null,
        title: p.title || null,
        country: p.country || null,
        main_city: p.main_city || null,
        secondary_city: p.secondary_city || null,
        start_date: p.start_date ? toDate(p.start_date) : null,
        end_date: p.end_date ? toDate(p.end_date) : null,
        duration: p.duration || null,
        trip_type: p.trip_type || null,
        theme: p.theme || null,
        traveler_count: p.traveler_count || null,
        age_range: p.age_range || null,
        airline: p.airline || null,
        flight_route: p.flight_route || null,
        outbound_flight: p.outbound_flight || null,
        outbound_time: p.outbound_time || null,
        return_flight: p.return_flight || null,
        return_time: p.return_time || null,
        hotel_level: p.hotel_level || null,
        budget_per_person: p.budget_per_person || null,
        total_budget: p.total_budget || null,
        internal_cost: p.internal_cost || null,
        selling_price_per_person: p.selling_price_per_person || null,
        total_selling_price: p.total_selling_price || null,
        profit_amount: p.profit_amount || null,
        profit_percent: p.profit_percent || null,
        status: p.status || 'Draft',
        hero_image_url: p.hero_image_url || null,
        internal_note: p.internal_note || null,
        customer_note: p.customer_note || null,
        created_by: p.created_by || null,
        created_at: toDate(p.created_at),
        updated_at: toDate(p.updated_at),
      }
    })
  }
  console.log('  ✅ Tour Plans done')

  // 3. Tour Days
  const tourDays = sqlite.prepare('SELECT * FROM tour_days').all()
  console.log(`📦 Migrating ${tourDays.length} tour days...`)
  for (const d of tourDays) {
    await supabase.tourDay.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        tour_plan_id: d.tour_plan_id,
        day_number: d.day_number,
        actual_date: d.actual_date ? toDate(d.actual_date) : null,
        day_title: d.day_title || null,
        city: d.city || null,
        hotel_name: d.hotel_name || null,
        breakfast_included: d.breakfast_included === 1,
        lunch_included: d.lunch_included === 1,
        dinner_included: d.dinner_included === 1,
        customer_note: d.customer_note || null,
        internal_note: d.internal_note || null,
        sort_order: d.sort_order || 0,
        created_at: toDate(d.created_at),
        updated_at: toDate(d.updated_at),
      }
    })
  }
  console.log('  ✅ Tour Days done')

  // 4. Tour Activities
  const activities = sqlite.prepare('SELECT * FROM tour_activities').all()
  console.log(`📦 Migrating ${activities.length} activities...`)
  for (const a of activities) {
    await supabase.tourActivity.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        tour_day_id: a.tour_day_id,
        time_text: a.time_text || null,
        activity_title: a.activity_title || null,
        activity_description: a.activity_description || null,
        location_name: a.location_name || null,
        image_url: a.image_url || null,
        sort_order: a.sort_order || 0,
        created_at: toDate(a.created_at),
        updated_at: toDate(a.updated_at),
      }
    })
  }
  console.log('  ✅ Activities done')

  // 5. Tour Day Images
  const images = sqlite.prepare('SELECT * FROM tour_day_images').all()
  console.log(`📦 Migrating ${images.length} day images...`)
  for (const img of images) {
    await supabase.tourDayImage.upsert({
      where: { id: img.id },
      update: {},
      create: {
        id: img.id,
        tour_day_id: img.tour_day_id,
        image_url: img.image_url,
        thumbnail_url: img.thumbnail_url || null,
        source_url: img.source_url || null,
        source_title: img.source_title || null,
        photographer: img.photographer || null,
        provider: img.provider || null,
        location_name: img.location_name || null,
        search_keyword: img.search_keyword || null,
        alt_text: img.alt_text || null,
        caption: img.caption || null,
        is_selected: img.is_selected === 1,
        sort_order: img.sort_order || 0,
        created_at: toDate(img.created_at),
        updated_at: toDate(img.updated_at),
      }
    })
  }
  console.log('  ✅ Day Images done')

  console.log('\n🎉 Migration completed successfully!')
  
  // Summary
  const counts = await Promise.all([
    supabase.customer.count(),
    supabase.tourPlan.count(),
    supabase.tourDay.count(),
    supabase.tourActivity.count(),
  ])
  console.log('\n📊 Supabase now has:')
  console.log(`  - ${counts[0]} customers`)
  console.log(`  - ${counts[1]} tour plans`)
  console.log(`  - ${counts[2]} tour days`)
  console.log(`  - ${counts[3]} activities`)

  await supabase.$disconnect()
  sqlite.close()
}

migrate().catch(async (e) => {
  console.error('❌ Error:', e.message)
  await supabase.$disconnect()
  process.exit(1)
})
