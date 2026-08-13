import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedInstance: GoogleGenerativeAI | null = null;
let cachedKey: string | undefined = undefined;

export function getGenAI(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!cachedInstance || cachedKey !== key) {
    cachedInstance = new GoogleGenerativeAI(key);
    cachedKey = key;
  }
  return cachedInstance;
}

export const ai = {
  models: {
    async generateContent(options: { model: string; contents: any; config?: { responseMimeType?: string } }) {
      const genAI = getGenAI();
      if (!genAI) {
        throw new Error("GEMINI_API_KEY environment variable is missing");
      }
      const model = genAI.getGenerativeModel({
        model: options.model || "gemini-1.5-flash",
        generationConfig: options.config?.responseMimeType ? { responseMimeType: options.config.responseMimeType } : undefined,
      });

      let promptPayload: any = options.contents;
      if (Array.isArray(options.contents)) {
        // Handle parts/role structure
        const first = options.contents[0];
        if (first && first.parts) {
          promptPayload = first.parts.map((p: any) => {
            if (p.text) return p.text;
            if (p.inlineData) return { inlineData: p.inlineData };
            return p;
          });
        }
      }

      const result = await model.generateContent(promptPayload);
      const response = await result.response;
      return { text: response.text() };
    },
    async generateImages(_options: any) {
      // Imagen via @google/generative-ai fallback safely
      return { generatedImages: [] };
    }
  }
};

/**
 * Safely parse JSON from AI response.
 * Returns null if parsing fails.
 */
export function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export type AIPlan = {
  tour_name: string;
  summary?: string;
  airline?: string;
  flight_route?: string;
  outbound_flight?: string;
  return_flight?: string;
  itinerary: Array<{
    day_number: number;
    date?: string;
    daily_theme: string;
    hotel_name_suggestion?: string;
    breakfast_included?: boolean;
    lunch_included?: boolean;
    dinner_included?: boolean;
    activities: Array<{
      time_period?: string;
      time_start?: string;
      time_end?: string;
      activity_title?: string;
      location_name: string;
      description: string;
      is_highlight?: boolean;
    }>;
  }>;
};

/**
 * Validate that an AI-generated tour plan has the minimum required structure.
 */
export function validateAIPlan(plan: unknown): plan is AIPlan {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;
  if (!Array.isArray(p.itinerary) || p.itinerary.length === 0) return false;
  return true;
}

/**
 * Real destination dictionary for fallback generation
 */
/**
 * Comprehensive real landmark database for various popular cities
 */
const DESTINATION_DATA: Record<string, {
  tourName: string;
  hotel: string;
  airline: string;
  flightRoute: string;
  outboundFlight: string;
  returnFlight: string;
  days: Array<{
    theme: string;
    activities: Array<{ time_period: string; activity_title: string; location_name: string; description: string; is_highlight?: boolean }>;
  }>;
}> = {
  kunming: {
    tourName: "มหัศจรรย์ คุนหมิง ตาหลี่ ลี่เจียง ภูเขาหิมะมังกรหยก",
    hotel: "Kunming Grand Park Hotel หรือเทียบเท่า 4 ดาว",
    airline: "China Eastern Airlines (MU) / Thai Airways (TG)",
    flightRoute: "BKK - KMG - BKK",
    outboundFlight: "MU748 BKK 15:55 - 19:30 KMG",
    returnFlight: "MU747 KMG 13:15 - 14:55 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - คุนหมิง (สนามบินฉางสุ่ย) - เข้าสู่ที่พักเมืองคุนหมิง",
        activities: [
          {
            time_period: "13.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน China Eastern Airlines"
          },
          {
            time_period: "15.55 น.",
            activity_title: "บินลัดฟ้าสู่เมืองคุนหมิง",
            location_name: "สนามบินนานาชาติคุนหมิงฉางสุ่ย (KMG)",
            description: "ออกเดินทางสู่ **นครคุนหมิง** โดยเที่ยวบิน **MU748** สัมผัสเมืองแห่งฤดูใบไม้ผลิ"
          },
          {
            time_period: "19.30 น.",
            activity_title: "เดินทางถึงคุนหมิง - เช็คอินเข้าสู่ที่พัก",
            location_name: "โรงแรมใจกลางเมืองคุนหมิง",
            description: "เดินทางถึง **สนามบินคุนหมิงฉางสุ่ย** ผ่านพิธีการตรวจคนเข้าเมือง จากนั้นนำท่านเดินทางเข้าสู่ที่พักพักผ่อนตามอัธยาศัย",
            is_highlight: true
          }
        ]
      },
      {
        theme: "คุนหมิง - ชมอุทยานป่าหินมรดกโลก (Stone Forest) - ตำหนักทองจินเตี้ยน - ถนนคนเดินหนานผิง",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "มหัศจรรย์มรดกโลก อุทยานป่าหิน (Stone Forest)",
            location_name: "อุทยานป่าหิน (Stone Forest National Park)",
            description: "นำท่านชม **อุทยานป่าหิน (Stone Forest)** มรดกโลกทางธรรมชาติ UNESCO ชมกลุ่มเสาหินปูนธรรมชาติรูปร่างแปลกตาอันงดงามตระการตา",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูสุกี้เห็ดคุนหมิง",
            location_name: "ร้านอาหารพื้นเมืองคุนหมิง",
            description: "ลิ้มลองเมนูขึ้นชื่อ **สุกี้เห็ดคุนหมิง** ซุปเห็ดธรรมชาติเสฉวนรสกลมกล่อม"
          },
          {
            time_period: "บ่าย",
            activity_title: "ชมตำหนักทองจินเตี้ยน (Golden Temple)",
            location_name: "ตำหนักทองจินเตี้ยน",
            description: "นำท่านสู่ **ตำหนักทองจินเตี้ยน** อาคารทองสัมฤทธิ์ที่ใหญ่ที่สุดในจีน สร้างด้วยทองสัมฤทธิ์โบราณบนยอดเขาหมิงเฟิง",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งถนนคนเดินหนานผิง & ซุ้มประตูม้าทองไก่หยก",
            location_name: "ถนนคนเดินหนานผิง (Nanping Pedestrian Street)",
            description: "อิสระเดินเล่น **ถนนคนเดินหนานผิง** และถ่ายภาพกับ **ซุ้มประตูม้าทองไก่หยก** สัญลักษณ์อันเก่าแก่ใจกลางนครคุนหมิง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "คุนหมิง - วัดหยวนทง - ทะเลสาบเตียนฉือ (วัดหลงเหมิน เขากวางเอ๋อร์)",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ไหว้พระขอพร วัดหยวนทง (Yuantong Temple)",
            location_name: "วัดหยวนทง (Yuantong Temple)",
            description: "นำท่านสักการะ **วัดหยวนทง** วัดพุทธที่ใหญ่และเก่าแก่ที่สุดในคุนหมิง อายุกว่า 1,200 ปี ไหว้พระพรหมไทยโบราณและองค์เจ้าแม่กวนอิม",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูอาหารจีนเสฉวน-ยูนนาน",
            location_name: "ภัตตาคารท้องถิ่นยูนนาน",
            description: "รับประทานอาหารกลางวัน ณ ภัตตาคาร ลิ้มลองอาหารพื้นเมืองยูนนานแท้ๆ"
          },
          {
            time_period: "บ่าย",
            activity_title: "นั่งกระเช้าขึ้น เขากวางเอ๋อร์ & ลอดประตูมังกรหลงเหมิน",
            location_name: "เขากวางเอ๋อร์ - ประตูมังกรหลงเหมิน",
            description: "นั่งกระเช้าไฟฟ้าขึ้น **เขากวางเอ๋อร์** ชมทัศนียภาพ **ทะเลสาบเตียนฉือ** และลอด **ประตูมังกรหลงเหมิน** เชื่อว่าลอดแล้วจะมีความเจริญรุ่งเรือง",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "รับประทานอาหารเย็น เมนูเป็ดปักกิ่งยูนนาน",
            location_name: "ภัตตาคารเป็ดปักกิ่งคุนหมิง",
            description: "ลิ้มรสชาติ **เป็ดปักกิ่งสไตล์ยูนนาน** หนังกรอบเนื้อนุ่ม พร้อมน้ำจิ้มรสเด็ด"
          }
        ]
      },
      {
        theme: "คุนหมิง - ตลาดดอกไม้โต่วหนาน - สนามบินคุนหมิงฉางสุ่ย - กรุงเทพฯ (สุวรรณภูมิ)",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมตลาดดอกไม้สดโต่วหนาน (Dounan Flower Market)",
            location_name: "ตลาดดอกไม้โต่วหนาน (Dounan Flower Market)",
            description: "นำท่านชม **ตลาดดอกไม้โต่วหนาน** ตลาดการค้าดอกไม้สดที่ใหญ่ที่สุดในเอเชีย เลือกชมและถ่ายภาพดอกไม้นานาพันธุ์"
          },
          {
            time_period: "10.30 น.",
            activity_title: "เดินทางสู่สนามบินคุนหมิงฉางสุ่ย",
            location_name: "สนามบินนานาชาติคุนหมิงฉางสุ่ย",
            description: "เดินทางสู่ **สนามบินคุนหมิงฉางสุ่ย** เช็คอินโหลดสัมภาระเตรียมตัวเดินทางกลับประเทศไทย"
          },
          {
            time_period: "13.15 น.",
            activity_title: "ออกเดินทางกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **MU747** ถึงสนามบินสุวรรณภูมิเวลา **14.55 น.** โดยสวัสดิภาพและความประทับใจ"
          }
        ]
      }
    ]
  },
  guangzhou: {
    tourName: "ตระการตา กวางโจว แคนตันทาวเวอร์ ถนนคนเดินเป่ยจิงหลู่",
    hotel: "Guangzhou Garden Hotel หรือเทียบเท่า 4 ดาว",
    airline: "Thai Airways (TG) / China Southern Airlines (CZ)",
    flightRoute: "BKK - CAN - BKK",
    outboundFlight: "CZ3082 BKK 11:55 - 15:50 CAN",
    returnFlight: "CZ3081 CAN 09:00 - 11:00 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - กวางโจว (สนามบินไป๋หยุน) - ชมวิวหอคอยกวางโจว (Canton Tower)",
        activities: [
          {
            time_period: "09.00 น.",
            activity_title: "เช็คอิน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ",
            description: "คณะพร้อมกัน ณ สนามบินสุวรรณภูมิ เช็คอินเที่ยวบิน **CZ3082** สู่เมืองกวางโจว"
          },
          {
            time_period: "15.50 น.",
            activity_title: "เดินทางถึงกวางโจว - ชมหอคอยแคนตันทาวเวอร์",
            location_name: "หอคอยแคนตันทาวเวอร์ (Canton Tower)",
            description: "เดินทางถึงสนามบินไป๋หยุน กวางโจว นำท่านถ่ายภาพ **หอคอยแคนตันทาวเวอร์ (Canton Tower)** แลนด์มาร์กความสูง 604 เมตรริมแม่น้ำจูเจียง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "กวางโจว - อนุสรณ์สถานดร.ซุนยัดเซ็น - วัดหกต้นไทร - ถนนคนเดินเป่ยจิงหลู่",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมอนุสรณ์สถาน ดร.ซุนยัดเซ็น & วัดหกต้นไทร",
            location_name: "อนุสรณ์สถาน ดร.ซุนยัดเซ็น - วัดหกต้นไทร",
            description: "นำท่านชม **อนุสรณ์สถาน ดร.ซุนยัดเซ็น** สถาปัตยกรรมแปดเหลี่ยมอันทรงคุณค่า และสักการะพระบรมสารีริกธาตุ ณ **วัดหกต้นไทร (Six Banyan Tree Temple)**",
            is_highlight: true
          },
          {
            time_period: "บ่าย/เย็น",
            activity_title: "ช้อปปิ้งถนนคนเดินเป่ยจิงหลู่ (Beijing Road)",
            location_name: "ถนนคนเดินเป่ยจิงหลู่",
            description: "อิสระช้อปปิ้ง **ถนนคนเดินเป่ยจิงหลู่** ชมร่องรอยถนนโบราณสมัยราชวงศ์ซ่งและหยวนที่ถูกเปิดซ้อนใต้กระจกแก้วใสใจกลางถนน",
            is_highlight: true
          }
        ]
      }
    ]
  },
  macao: {
    tourName: "ไฮไลต์ มาเก๊า - ฮ่องกง ไหว้พระขอพร",
    hotel: "The Kowloon Hotel หรือเทียบเท่า 4 ดาว",
    airline: "Greater Bay Airlines (HB) / Cathay Pacific (CX)",
    flightRoute: "BKK - HKG - BKK",
    outboundFlight: "HB296 BKK 01:55 - 06:00 HKG",
    returnFlight: "HB295 HKG 22:15 - 00:15 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - ฮ่องกง - ข้ามสะพานมาเก๊า HZMB - โบสถ์เซนต์พอล - เซนาโด้สแควร์ - วัดอาม่า",
        activities: [
          {
            time_period: "00.55 น.",
            activity_title: "ออกเดินทางสู่ เกาะฮ่องกง",
            location_name: "สนามบินสุวรรณภูมิ - สนามบินเช็กแลปก๊ก",
            description: "คณะพร้อมกัน ณ ท่าอากาศยานสุวรรณภูมิ ออกเดินทางสู่เกาะฮ่องกง โดยสายการบิน **Greater Bay Airlines (HB296)**"
          },
          {
            time_period: "06.00 น.",
            activity_title: "ข้ามสะพานมาเก๊า HZMB",
            location_name: "สะพานเชื่อมฮ่องกง-จูไห่-มาเก๊า (HZMB)",
            description: "เดินทางถึงสนามบินฮ่องกง นำท่านข้ามสะพาน **HZMB (Hong Kong-Zhuhai-Macao Bridge)** สะพานข้ามทะเลยาวที่สุดในโลกสู่มาเก๊า"
          },
          {
            time_period: "เช้า",
            activity_title: "ชมซากโบสถ์เซนต์พอล (Ruins of St. Paul's)",
            location_name: "โบสถ์เซนต์พอล (Ruins of St. Paul's)",
            description: "นำท่านถ่ายภาพ **โบสถ์เซนต์พอล (Ruins of St. Paul's)** ซากโบสถ์คริสต์สถาปัตยกรรมตะวันตกผสมผสานสัญลักษณ์ศาสนาพุทธ",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "เดินเล่นจัตุรัสเซนาโด้สแควร์ (Senado Square)",
            location_name: "เซนาโด้สแควร์ (Senado Square)",
            description: "นำท่านสู่ **เซนาโด้สแควร์ (Senado Square)** จัตุรัสใจกลางเมืองมาเก๊าที่ล้อมรอบด้วยอาคารทรงโคโลเนียลสไตล์ยุโรป",
            is_highlight: true
          }
        ]
      }
    ]
  }
};

/**
 * Build a fallback itinerary with real researched landmarks.
 */
export function buildFallbackPlan(
  mainCity: string,
  country: string,
  duration: number,
  startDate: string
): AIPlan {
  const cityInput = (mainCity || country || "").toLowerCase();
  
  // Try to find matching city preset key
  const matchKey = Object.keys(DESTINATION_DATA).find(k => 
    cityInput.includes(k) || 
    (k === "kunming" && (cityInput.includes("คุนหมิง") || cityInput.includes("kunming"))) ||
    (k === "guangzhou" && (cityInput.includes("กวางโจว") || cityInput.includes("guangzhou"))) ||
    (k === "macao" && (cityInput.includes("มาเก๊า") || cityInput.includes("ฮ่องกง")))
  );

  if (matchKey && DESTINATION_DATA[matchKey]) {
    const preset = DESTINATION_DATA[matchKey];
    const itinerary = Array.from({ length: duration }, (_, i) => {
      const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
      const dayNo = i + 1;
      
      // If duration > preset days, create unique fallback for extra days
      let dayPreset = preset.days[i];
      if (!dayPreset) {
        if (dayNo === duration) {
          dayPreset = {
            theme: `อิสระช้อปปิ้งเมือง ${mainCity} - เดินทางกลับกรุงเทพฯ (สนามบินสุวรรณภูมิ)`,
            activities: [
              {
                time_period: "เช้า",
                activity_title: `เช็คเอาท์โรงแรม & ช้อปปิ้งของฝาก ${mainCity}`,
                location_name: `ย่านการค้าใจกลางเมือง ${mainCity}`,
                description: `เช็คเอาท์จากที่พัก นำท่านสู่ **ย่านการค้าใจกลางเมือง ${mainCity}** เลือกซื้อของฝาก สินค้าพื้นเมือง และขนมท้องถิ่น`
              },
              {
                time_period: "ขากลับ",
                activity_title: "เดินทางกลับประเทศไทย (สนามบินสุวรรณภูมิ)",
                location_name: `สนามบินนานาชาติ ${mainCity} - สนามบินสุวรรณภูมิ`,
                description: `เดินทางสู่ **สนามบินนานาชาติเมือง ${mainCity}** เช็คอินเดินทางกลับกรุงเทพฯ (สุวรรณภูมิ) โดยสวัสดิภาพ`
              }
            ]
          };
        } else {
          dayPreset = {
            theme: `ท่องเที่ยวชมธรรมชาติและย่านเมืองเก่า ${mainCity} (วันที่ ${dayNo})`,
            activities: [
              {
                time_period: "เช้า",
                activity_title: `ชมจุดชมวิวธรรมชาติประจำเมือง ${mainCity}`,
                location_name: `อุทยานธรรมชาติ ${mainCity}`,
                description: `นำท่านชม **อุทยานธรรมชาติและจุดชมวิวเมือง ${mainCity}** สัมผัสอากาศสดชื่นและทัศนียภาพอันสวยงาม`,
                is_highlight: true
              },
              {
                time_period: "กลางวัน",
                activity_title: `รับประทานอาหารกลางวัน เมนูท้องถิ่น ${mainCity}`,
                location_name: `ร้านอาหารขึ้นชื่อเมือง ${mainCity}`,
                description: `ลิ้มลองอาหารรสเลิศและเมนูท้องถิ่นขึ้นชื่อในย่าน **เมือง ${mainCity}**`
              },
              {
                time_period: "บ่าย",
                activity_title: `เดินเที่ยวชมย่านเมืองเก่า ${mainCity}`,
                location_name: `ย่านเมืองเก่าโบราณ ${mainCity}`,
                description: `นำท่านชม **ย่านเมืองเก่าโบราณ ${mainCity}** สัมผัสสถาปัตยกรรมดั้งเดิมและวิถีชีวิตผู้คนท้องถิ่น`,
                is_highlight: true
              }
            ]
          };
        }
      }

      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: dayPreset.theme,
        hotel_name_suggestion: preset.hotel,
        breakfast_included: dayNo > 1,
        lunch_included: true,
        dinner_included: dayNo < duration,
        activities: dayPreset.activities
      };
    });

    return {
      tour_name: `${preset.tourName} ${duration} วัน ${Math.max(1, duration - 1)} คืน`,
      summary: `โปรแกรมท่องเที่ยวสัมผัสไฮไลต์แลนด์มาร์กจริงเมือง ${mainCity} ระยะเวลา ${duration} วัน`,
      airline: preset.airline,
      flight_route: preset.flightRoute,
      outbound_flight: preset.outboundFlight,
      return_flight: preset.returnFlight,
      itinerary
    };
  }

  // General dynamic fallback with distinct activities for each day
  const city = mainCity || "ไฮไลต์";
  const cntry = country || "";
  const destName = cntry ? `${city} (${cntry})` : city;

  const itinerary = Array.from({ length: duration }, (_, i) => {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
    const dayNo = i + 1;

    if (dayNo === 1) {
      return {
        day_number: 1,
        date: date.toISOString().split("T")[0],
        daily_theme: `กรุงเทพฯ (สนามบินสุวรรณภูมิ) - เดินทางถึง ${city} - เช็คอินที่พัก`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: false,
        lunch_included: true,
        dinner_included: true,
        activities: [
          {
            time_period: "เช้า / บ่าย",
            activity_title: `ออกเดินทางจากกรุงเทพฯ สู่เมือง ${city}`,
            location_name: `สนามบินสุวรรณภูมิ - สนามบิน ${city}`,
            description: `คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** ออกเดินทางสู่ **เมือง ${city}** ผ่านพิธีการตรวจคนเข้าเมือง`
          },
          {
            time_period: "เย็น",
            activity_title: `เช็คอินเข้าสู่ที่พัก & ชมวิวเมือง ${city}`,
            location_name: `ใจกลางเมือง ${city}`,
            description: `เดินทางเข้าสู่ที่พัก พักผ่อนและถ่ายภาพบรรยากาศยามเย็นใจกลาง **เมือง ${city}**`,
            is_highlight: true
          }
        ]
      };
    } else if (dayNo === duration) {
      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: `ช้อปปิ้งของฝากเมือง ${city} - เดินทางกลับกรุงเทพฯ (สนามบินสุวรรณภูมิ)`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: true,
        lunch_included: true,
        dinner_included: false,
        activities: [
          {
            time_period: "เช้า",
            activity_title: `ช้อปปิ้งของฝากย่านการค้าเมือง ${city}`,
            location_name: `ถนนคนเดินและย่านการค้า ${city}`,
            description: `อิสระเดินเล่น **ย่านการค้าเมือง ${city}** เลือกซื้อสินค้าพื้นเมือง ขนม และของฝากชื่อดัง`
          },
          {
            time_period: "บ่าย / เย็น",
            activity_title: `เดินทางกลับประเทศไทย (สนามบินสุวรรณภูมิ)`,
            location_name: `สนามบิน ${city} - สนามบินสุวรรณภูมิ`,
            description: `นำท่านเดินทางสู่สนามบิน เช็คอินเดินทางกลับกรุงเทพฯ (สุวรรณภูมิ) โดยสวัสดิภาพ`
          }
        ]
      };
    } else {
      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: `ไฮไลต์ท่องเที่ยวธรรมชาติต่างเมือง & สถาปัตยกรรมโบราณ ${city} (วันที่ ${dayNo})`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: true,
        lunch_included: true,
        dinner_included: true,
        activities: [
          {
            time_period: "เช้า",
            activity_title: `ชมแลนด์มาร์กประวัติศาสตร์ & มรดกทางวัฒนธรรม ${city}`,
            location_name: `วัดและสถานที่โบราณ ${city}`,
            description: `นำท่านชม **สถานที่โบราณและมรดกทางวัฒนธรรมประจำเมือง ${city}** ไหว้พระขอพรเพื่อความเป็นสิริมงคล`,
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: `รับประทานอาหารกลางวัน เมนูพิเศษประจำเมือง ${city}`,
            location_name: `ภัตตาคารท้องถิ่น ${city}`,
            description: `ลิ้มลองอาหารรสเลิศและเมนูเด็ดขึ้นชื่อประจำภูมิภาค **${city}**`
          },
          {
            time_period: "บ่าย",
            activity_title: `เที่ยวชมอุทยานและจุดชมวิวเมือง ${city}`,
            location_name: `จุดชมวิวเมือง ${city}`,
            description: `เดินทางสู่ **จุดชมวิวเมือง ${city}** ถ่ายภาพทัศนียภาพอันสวยงามตระการตา`,
            is_highlight: true
          }
        ]
      };
    }
  });

  return {
    tour_name: `โปรแกรมท่องเที่ยว ${destName} ${duration} วัน ${Math.max(1, duration - 1)} คืน`,
    summary: `แพลนท่องเที่ยวสัมผัสไฮไลต์แลนด์มาร์กสำคัญเมือง ${city} ระยะเวลา ${duration} วัน`,
    airline: `สายการบินบินตรงสู่ ${city}`,
    flight_route: `BKK - ${city} - BKK`,
    outbound_flight: `ออกเดินทางจากสนามบินสุวรรณภูมิ มุ่งสู่สนามบิน ${city}`,
    return_flight: `เดินทางออกจากสนามบิน ${city} กลับถึงกรุงเทพฯ (สุวรรณภูมิ)`,
    itinerary,
  };
}
