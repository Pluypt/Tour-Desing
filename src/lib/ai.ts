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
      const model = genAI.getGenerativeModel(
        {
          model: options.model || "gemini-1.5-flash",
          generationConfig: options.config?.responseMimeType ? { responseMimeType: options.config.responseMimeType } : undefined,
        },
        { timeout: 30000 }
      );

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
  suggested_price_per_person?: number;
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
 * Comprehensive real landmark and trendy itinerary database following:
 * 1. Day 1: Pure travel, flights, airport meetup, customs, hotel check-in, rest (NO tourist spots)
 * 2. Last Day: Pure travel, hotel check-out, airport transfer, departure back to Bangkok (NO tourist spots)
 * 3. Middle Days: Modern, trendy landmark check-ins, top photo spots and highlights
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
    tourName: "มหัศจรรย์ คุนหมิง ลี่เจียง แชงกรีล่า & จุดเช็คอินแลนด์มาร์กสุดฮิต",
    hotel: "Kunming Grand Park Hotel หรือเทียบเท่า 4 ดาว",
    airline: "China Eastern Airlines (MU) / Thai Airways (TG)",
    flightRoute: "BKK - KMG - BKK",
    outboundFlight: "MU748 BKK 15:55 - 19:30 KMG",
    returnFlight: "MU747 KMG 13:15 - 14:55 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - นครคุนหมิง (สนามบินฉางสุ่ย) - เช็คอินเข้าสู่ที่พัก พักผ่อนตามอัธยาศัย",
        activities: [
          {
            time_period: "13.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน China Eastern Airlines เจ้าหน้าที่คอยอำนวยความสะดวกเรื่องสัมภาระ"
          },
          {
            time_period: "15.55 น.",
            activity_title: "ออกเดินทางบินลัดฟ้าสู่นครคุนหมิง",
            location_name: "สนามบินนานาชาติคุนหมิงฉางสุ่ย (KMG)",
            description: "ออกเดินทางสู่ **นครคุนหมิง** โดยเที่ยวบิน **MU748** สัมผัสมนต์เสน่ห์แห่งเมืองฤดูใบไม้ผลิ"
          },
          {
            time_period: "19.30 น.",
            activity_title: "เดินทางถึงคุนหมิง - ผ่านพิธีการตรวจคนเข้าเมือง - เข้าสู่ที่พัก",
            location_name: "โรงแรมใจกลางนครคุนหมิง",
            description: "เดินทางถึง **สนามบินนานาชาติคุนหมิงฉางสุ่ย** ผ่านพิธีการตรวจคนเข้าเมืองและศุลกากร จากนั้นนำท่านเดินทางเข้าสู่โรงแรมที่พัก พักผ่อนตามอัธยาศัยเพื่อเตรียมพร้อมสำหรับการเดินทางในวันถัดไป",
            is_highlight: false
          }
        ]
      },
      {
        theme: "คุนหมิง - อุทยานมรดกโลกป่าหิน - เช็คอินแลนด์มาร์กดัง ซุ้มประตูม้าทองไก่หยก & ถนนคนเดินหนานผิง",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมความมหัศจรรย์ระดับโลก อุทยานป่าหิน (Stone Forest)",
            location_name: "อุทยานป่าหิน (Stone Forest National Park)",
            description: "นำท่านชม **อุทยานป่าหิน (Stone Forest)** มรดกโลกทางธรรมชาติ UNESCO สัมผัสเสาหินปูนธรรมชาติรูปร่างแปลกตางดงามตระการตา มุมถ่ายภาพแลนด์มาร์กชื่อดังระดับโลก",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูสุกี้เห็ดคุนหมิงสูตรดั้งเดิม",
            location_name: "ร้านอาหารพื้นเมืองคุนหมิง",
            description: "ลิ้มลองเมนูเด็ดขึ้นชื่อ **สุกี้เห็ดคุนหมิง** รวบรวมเห็ดป่าธรรมชาติยูนนานกว่า 10 ชนิดในน้ำซุปหอมกลมกล่อม"
          },
          {
            time_period: "บ่าย",
            activity_title: "เช็คอินคาเฟ่สุดชิค & ชมตำหนักทองจินเตี้ยน (Golden Temple)",
            location_name: "ตำหนักทองจินเตี้ยน & คาเฟ่เรือนกระจกยูนนาน",
            description: "นำท่านสู่ **ตำหนักทองจินเตี้ยน** อาคารทองสัมฤทธิ์โบราณที่ใหญ่ที่สุดในจีน และแวะถ่ายรูปมุม Aesthetic ณ คาเฟ่สไตล์ยูนนานร่วมสมัย",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "จุดเช็คอินไวรัล ซุ้มประตูม้าทองไก่หยก & ช้อปปิ้งถนนคนเดินหนานผิง",
            location_name: "ซุ้มประตูม้าทองไก่หยก & ถนนคนเดินหนานผิง (Nanping Street)",
            description: "ถ่ายรูปคู่กับ **ซุ้มประตูม้าทองไก่หยก** แลนด์มาร์กไฟนีออนสุดไอคอนิกยามค่ำคืน และอิสระช้อปปิ้ง **ถนนคนเดินหนานผิง** ลิ้มลองสตรีทฟู้ดและชานมไข่มุกยูนนานชื่อดัง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "คุนหมิง - ล่องเรือทะเลสาบเตียนฉือ - วัดหยวนทง - ตลาดดอกไม้โต่วหนาน จุดถ่ายรูปดอกไม้สุดอลังการ",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "สักการะขอพร วัดหยวนทง (Yuantong Temple)",
            location_name: "วัดหยวนทง (Yuantong Temple)",
            description: "นำท่านสักการะ **วัดหยวนทง** วัดพุทธโบราณที่ใหญ่และเก่าแก่ที่สุดในคุนหมิง อายุกว่า 1,200 ปี ชมสถาปัตยกรรมสวนน้ำและไหว้พระขอพรเพื่อความเป็นสิริมงคล",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน อาหารจีนสไตล์เสฉวน-ยูนนาน",
            location_name: "ภัตตาคารท้องถิ่นคุนหมิง",
            description: "รับประทานอาหารกลางวัน ลิ้มรสชาติเป็ดปักกิ่งยูนนานและอาหารพื้นเมืองรสเลิศ"
          },
          {
            time_period: "บ่าย",
            activity_title: "นั่งกระเช้าชมวิว ทะเลสาบเตียนฉือ & ประตูมังกรหลงเหมิน",
            location_name: "เขาซีซาน - ประตูมังกรหลงเหมิน",
            description: "นั่งกระเช้าลอยฟ้าขึ้น **เขาซีซาน** ชมทัศนียภาพกว้างไกลของ **ทะเลสาบเตียนฉือ** และเดินลอด **ประตูมังกรหลงเหมิน** เพื่อเสริมโชคลาภและความสำเร็จ",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "จุดถ่ายรูปยอดฮิต ตลาดดอกไม้สดโต่วหนาน (Dounan Flower Market)",
            location_name: "ตลาดดอกไม้โต่วหนาน (Dounan Flower Market)",
            description: "นำท่านสู่ **ตลาดดอกไม้โต่วหนาน** ตลาดดอกไม้สดที่ใหญ่ที่สุดในเอเชีย สวรรค์ของสายถ่ายรูปและทำคอนเทนต์ ชมทะเลดอกไม้นานาพรรณหลากสีสันสุดอลังการ",
            is_highlight: true
          }
        ]
      },
      {
        theme: "คุนหมิง - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินคุนหมิงฉางสุ่ย - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "08.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในคุนหมิง",
            description: "รับประทานอาหารเช้า ณ ห้องอาหารของโรงแรม จากนั้นจัดเก็บสัมภาระและเช็คเอาท์เตรียมตัวเดินทางสู่สนามบิน"
          },
          {
            time_period: "10.30 น.",
            activity_title: "เดินทางถึงสนามบินคุนหมิงฉางสุ่ย - เช็คอินสัมภาระ",
            location_name: "สนามบินนานาชาติคุนหมิงฉางสุ่ย (KMG)",
            description: "เดินทางถึง **สนามบินนานาชาติคุนหมิงฉางสุ่ย** เจ้าหน้าที่นำท่านเช็คอินบัตรโดยสารและโหลดสัมภาระ ผ่านพิธีการตรวจคนเข้าเมืองขาออก"
          },
          {
            time_period: "13.15 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **MU747** เดินทางถึง **ท่าอากาศยานสุวรรณภูมิ** เวลา **14.55 น.** โดยสวัสดิภาพพร้อมความประทับใจมิรู้ลืม"
          }
        ]
      }
    ]
  },
  macao: {
    tourName: "ฮิตติดเทรนด์ มาเก๊า & ฮ่องกง เช็คอินแลนด์มาร์กใหม่ ไหว้พระเสริมเฮง ถ่ายรูปมุมสวยยอดฮิต",
    hotel: "The Venetian Macao / The Kowloon Hotel หรือเทียบเท่า 4 ดาว",
    airline: "Greater Bay Airlines (HB) / Cathay Pacific (CX)",
    flightRoute: "BKK - HKG - BKK",
    outboundFlight: "HB296 BKK 01:55 - 06:00 HKG",
    returnFlight: "HB295 HKG 22:15 - 00:15 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - ฮ่องกง (เช็กแลปก๊ก) - ข้ามสะพาน HZMB สู่มาเก๊า - เช็คอินโรงแรม",
        activities: [
          {
            time_period: "22.30 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออกระหว่างประเทศ เคาน์เตอร์สายการบิน Greater Bay Airlines"
          },
          {
            time_period: "01.55 น.",
            activity_title: "บินลัดฟ้าสู่เกาะฮ่องกง",
            location_name: "สนามบินนานาชาติฮ่องกง (HKG)",
            description: "ออกเดินทางสู่ฮ่องกงด้วยเที่ยวบิน **HB296** บริการอาหารว่างและเครื่องดื่มบนเครื่อง"
          },
          {
            time_period: "06.00 น.",
            activity_title: "เดินทางถึงฮ่องกง - ข้ามสะพานข้ามทะเลยาวที่สุดในโลก HZMB สู่มาเก๊า - เข้าโรงแรมที่พัก",
            location_name: "สะพานเชื่อมฮ่องกง-จูไห่-มาเก๊า (HZMB) - โรงแรมมาเก๊า",
            description: "เดินทางถึงสนามบินฮ่องกง ผ่านพิธีการตรวจคนเข้าเมือง นำท่านข้ามสะพาน **HZMB (Hong Kong-Zhuhai-Macao Bridge)** สู่มาเก๊า จากนั้นนำท่านเข้าสู่โรงแรมที่พักเพื่อฝากสัมภาระและพักผ่อน",
            is_highlight: false
          }
        ]
      },
      {
        theme: "มาเก๊า - จุดถ่ายรูปไวรัล The Londoner & The Venetian - ซากโบสถ์เซนต์พอล - ไทปาวิลเลจ คาเฟ่พาสเทล",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "จุดเช็คอินยอดฮิต ซากโบสถ์เซนต์พอล (Ruins of St. Paul's) & เซนาโด้สแควร์",
            location_name: "ซากโบสถ์เซนต์พอล & เซนาโด้สแควร์ (Senado Square)",
            description: "นำท่านถ่ายรูปมุมไวรัล **ซากโบสถ์เซนต์พอล (Ruins of St. Paul's)** และเดินเล่น **เซนาโด้สแควร์ (Senado Square)** ตึกโคโลเนียลสีพาสเทล มรดกโลก UNESCO",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "ลิ้มลองเมนูเด็ด ทาร์ตไข่โปรตุเกส & อาหารแมคกานีสต้นตำรับ",
            location_name: "ร้านอาหารพื้นเมืองมาเก๊า",
            description: "รับประทานอาหารกลางวัน ลิ้มลองอาหารแมคกานีสฟิวชั่นรสเลิศ และชิม **ทาร์ตไข่ Lord Stow's** อบใหม่ร้อนๆ กรอบนอกนุ่มละมุน"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นหมู่บ้านไทปา (Taipa Village) & คาเฟ่ฮิตสุดคิวท์",
            location_name: "หมู่บ้านไทปา (Taipa Village)",
            description: "ชม **หมู่บ้านไทปา (Taipa Village)** ตรอกซอกซอยบ้านโบราณสไตล์โปรตุเกสสีพาสเทล แวะถ่ายรูปมุม Aesthetic และจิบกาแฟในคาเฟ่ดีไซน์ชิค",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "มุมถ่ายภาพยุโรปสุดอลังการ The Londoner & The Venetian Macao",
            location_name: "The Londoner Macao & The Venetian Macao",
            description: "นำท่านถ่ายรูปกับ **The Londoner Macao** หอนาฬิกาบิ๊กเบนจำลองขนาดเท่าของจริง และแสงสีระยิบระยับยามค่ำคืนของ **The Parisian & Venetian**",
            is_highlight: true
          }
        ]
      },
      {
        theme: "ฮ่องกง - ไหว้พระขอพร วัดหวังต้าเซียน & วัดกังหันแชกงหมิว - จุดชมวิว West Kowloon Art Park & ช้อปปิ้งจิมซาจุ่ย",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ผูกด้ายแดงขอพรความรัก วัดหวังต้าเซียน (Wong Tai Sin)",
            location_name: "วัดหวังต้าเซียน (Wong Tai Sin Temple)",
            description: "นำท่านสักการะ **วัดหวังต้าเซียน** ไหว้เทพเจ้าด้ายแดงเย่วโหลวขอพรความรัก และขอพรสุขภาพกับองค์หวังต้าเซียน",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน ติ่มซำฮ่องกงระดับมิชลิน",
            location_name: "ภัตตาคารติ่มซำชื่อดังฮ่องกง",
            description: "ลิ้มรสชาติติ่มซำฮ่องกงแท้ๆ ฮะเก๋ากุ้งเนื้อแน่น ซาลาเปาหมูแดงอบหอมกรุ่น"
          },
          {
            time_period: "บ่าย",
            activity_title: "หมุนกังหันนำโชค วัดแชกงหมิว & จุดเช็คอินสุดชิค West Kowloon Cultural District",
            location_name: "วัดแชกงหมิว (Che Kung Temple) & West Kowloon Art Park",
            description: "หมุนกังหันทองเหลืองนำพาโชคลาภ ณ **วัดแชกงหมิว** จากนั้นพาท่านไปถ่ายรูปมุมชิคริมอ่าววิคตอเรีย ณ **West Kowloon Art Park & พิพิธภัณฑ์ M+**",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "อิสระช้อปปิ้งย่านจิมซาจุ่ย (Tsim Sha Tsui) & ถนนคนเดิน K11 MUSEA",
            location_name: "K11 MUSEA & จิมซาจุ่ย (Tsim Sha Tsui)",
            description: "ช้อปปิ้งห้างสุดหรูริมน้ำ **K11 MUSEA** ห้างสรรพสินค้าดีไซน์ศิลปะระดับโลก และเดินเล่นริมอ่าวชมไฟ Symphony of Lights",
            is_highlight: true
          }
        ]
      },
      {
        theme: "ฮ่องกง - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินเช็กแลปก๊ก - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "17.00 น.",
            activity_title: "จัดเก็บสัมภาระ & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พัก",
            description: "คณะพร้อมกัน ณ ล็อบบี้โรงแรม จัดเก็บสัมภาระและเช็คเอาท์ รถมินิบัสรอรับเพื่อเดินทางสู่สนามบิน"
          },
          {
            time_period: "19.00 น.",
            activity_title: "เดินทางถึงสนามบินฮ่องกง - เช็คอิน & ผ่านพิธีการตรวจคนเข้าเมือง",
            location_name: "สนามบินนานาชาติฮ่องกง (HKG)",
            description: "เดินทางถึง **สนามบินนานาชาติฮ่องกง (เช็กแลปก๊ก)** เช็คอินเคาน์เตอร์สายการบิน Greater Bay Airlines โหลดสัมภาระและผ่านด่านตรวจคนเข้าเมือง"
          },
          {
            time_period: "22.15 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **HB295** ถึง **สนามบินสุวรรณภูมิ** เวลา **00.15 น.** โดยสวัสดิภาพ"
          }
        ]
      }
    ]
  },
  tokyo: {
    tourName: "เจแปนอินเทรนด์ โตเกียว ฟูจิ ชิบูย่าสกาย คาเฟ่ฮิต & จุดเช็คอินแลนด์มาร์กดัง",
    hotel: "Shinagawa Prince Hotel / Shinjuku Washington Hotel หรือเทียบเท่า 4 ดาว",
    airline: "Thai Airways (TG) / Japan Airlines (JL)",
    flightRoute: "BKK - NRT - BKK",
    outboundFlight: "TG642 BKK 23:50 - 08:10 NRT",
    returnFlight: "TG643 NRT 12:00 - 16:30 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - โตเกียว (สนามบินนาริตะ) - เดินทางสู่โรงแรมใจกลางโตเกียว - พักผ่อน",
        activities: [
          {
            time_period: "21.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน Thai Airways"
          },
          {
            time_period: "23.50 น.",
            activity_title: "ออกเดินทางบินตรงสู่สนามบินนาริตะ โตเกียว",
            location_name: "สนามบินนานาชาตินาริตะ (NRT)",
            description: "บินลัดฟ้าสู่โตเกียว ประเทศญี่ปุ่น โดยเที่ยวบิน **TG642** พักผ่อนบนเครื่องบิน"
          },
          {
            time_period: "08.10 น.",
            activity_title: "เดินทางถึงโตเกียว - ผ่านตม. - เข้าสู่โรงแรมที่พัก",
            location_name: "โรงแรมที่พักใจกลางโตเกียว",
            description: "เดินทางถึง **สนามบินนาริตะ** ผ่านพิธีการตรวจคนเข้าเมืองและศุลกากร นำท่านเดินทางเข้าสู่โรงแรมที่พักในโตเกียว ฝากสัมภาระและพักผ่อนตามอัธยาศัย",
            is_highlight: false
          }
        ]
      },
      {
        theme: "โตเกียว - วัดอาซากุสะ - จุดชมวิวไวรัล Shibuya Sky - ถ่ายรูปคาเฟ่ชิคย่านโอโมเตะซันโด & ฮาราจูกุ",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ไหว้พระขอพร วัดเซ็นโซจิ อาซากุสะ (Sensoji Temple)",
            location_name: "วัดเซ็นโซจิ อาซากุสะ (Sensoji Temple)",
            description: "นำท่านสักการะ **วัดเซ็นโซจิ (วัดอาซากุสะ)** ถ่ายรูปกับโคมแดงยักษ์คามินาริมง และเดินเล่นชิมขนมโบราณบนถนนนากามิเสะ",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูข้าวหน้าเนื้อย่างวากิวญี่ปุ่น",
            location_name: "ร้านอาหารญี่ปุ่นพรีเมียม",
            description: "ลิ้มลองเซ็ตเนื้อวากิวญี่ปุ่นย่างถ่านรสเลิศ หอมนุ่มละมุนลิ้น"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นชิลล์ย่านโอโมเตะซันโด (Omotesando) & คาเฟ่ Aesthetic Cat Street",
            location_name: "โอโมเตะซันโด (Omotesando) & Cat Street",
            description: "เช็คอินย่านสถาปัตยกรรมสุดเก๋ **โอโมเตะซันโด** และเดินเล่นถนน **Cat Street** สวรรค์ของสายมินิมอลและคาเฟ่ฮอปปิ้ง",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "จุดเช็คอินอันดับ 1 จุดชมวิว Shibuya Sky & ห้าแยกชิบูย่า",
            location_name: "Shibuya Sky & ชิบูย่า (Shibuya)",
            description: "ขึ้นชมวิวมหานครโตเกียวแบบ 360 องศาบนดาดฟ้า **Shibuya Sky** จุดถ่ายรูปพาโนรามาสุดไวรัล และถ่ายรูปคู่กับรูปปั้นฮาจิโกะ",
            is_highlight: true
          }
        ]
      },
      {
        theme: "โตเกียว - ภูเขาไฟฟูจิ - จุดถ่ายรูปเจดีย์แดงชูเรโตะ - หมู่บ้านน้ำใสโอชิโนะฮักไก - ช้อปปิ้งชินจูกุ",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "จุดชมวิวฟูจิยอดฮิต เจดีย์แดงชูเรโตะ (Chureito Pagoda)",
            location_name: "เจดีย์แดงชูเรโตะ (Chureito Pagoda)",
            description: "ชมภาพโปสการ์ดในฝัน **เจดีย์แดง 5 ชั้นชูเรโตะ** คู่กับฉากหลัง **ภูเขาไฟฟูจิ** อันสง่างาม มุมถ่ายรูปที่ทุกคนต้องมาเยือน",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูเซ็ตโฮโตอุด้งพื้นเมืองฟูจิ",
            location_name: "ภัตตาคารวิวฟูจิ",
            description: "รับประทานอาหารกลางวัน เซ็ตอุด้งเส้นสดร้อนๆ ในหม้อไฟท้องถิ่นรสเข้มข้น"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นหมู่บ้านน้ำใสโอชิโนะฮักไก (Oshino Hakkai)",
            location_name: "หมู่บ้านน้ำใสโอชิโนะฮักไก (Oshino Hakkai)",
            description: "สัมผัสความใสบริสุทธิ์ของบ่อน้ำศักดิ์สิทธิ์ที่ละลายจากหิมะบนยอดเขาฟูจิ ณ **หมู่บ้านน้ำใสโอชิโนะฮักไก** ถ่ายรูปบ้านโบราณมุงจาก",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งสินค้าแฟชั่น & ถ่ายรูปจอ 3D แมวยักษ์ ชินจูกุ (Shinjuku)",
            location_name: "ย่านชินจูกุ (Shinjuku)",
            description: "อิสระช้อปปิ้งแบรนด์เนม เครื่องสำอาง รองเท้า Sneaker ย่าน **ชินจูกุ (Shinjuku)** และถ่ายรูปกับจอ 3D แมวสามสียักษ์สุดน่ารัก",
            is_highlight: true
          }
        ]
      },
      {
        theme: "โตเกียว - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินนาริตะ - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "08.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในโตเกียว",
            description: "รับประทานอาหารเช้าสไตล์ญี่ปุ่น ณ โรงแรมที่พัก จัดเก็บสัมภาระและเช็คเอาท์ รถมินิบัสรอรับเพื่อเดินทางสู่สนามบินนาริตะ"
          },
          {
            time_period: "09.30 น.",
            activity_title: "เดินทางถึงสนามบินนาริตะ - เช็คอิน & ทำ Tax Refund",
            location_name: "สนามบินนานาชาตินาริตะ (NRT)",
            description: "เดินทางถึง **สนามบินนานาชาตินาริตะ** เช็คอินสัมภาระ ดำเนินการคืนภาษี (Tax Refund) และช้อปปิ้งขนมของฝากในสนามบิน"
          },
          {
            time_period: "12.00 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับสู่ประเทศไทย โดยเที่ยวบิน **TG643** ถึง **สนามบินสุวรรณภูมิ** เวลา **16.30 น.** โดยสวัสดิภาพและความประทับใจ"
          }
        ]
      }
    ]
  },
  chengdu: {
    tourName: "ชิค & คูล เฉิงตู ฉงชิ่ง เช็คอินหมีแพนด้ายักษ์ IFS เมืองไซเบอร์พังก์ & คาเฟ่สุดฮิต",
    hotel: "Chengdu Shangri-La / Grand Hyatt หรือเทียบเท่า 4 ดาว",
    airline: "Sichuan Airlines (3U) / Air China (CA)",
    flightRoute: "BKK - TFU - BKK",
    outboundFlight: "3U3934 BKK 18:40 - 22:45 TFU",
    returnFlight: "3U3933 TFU 15:15 - 17:40 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - เฉิงตู (สนามบินเทียนฟู่) - เข้าสู่ที่พักเมืองเฉิงตู",
        activities: [
          {
            time_period: "16.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** เคาน์เตอร์สายการบิน Sichuan Airlines เจ้าหน้าที่คอยต้อนรับและอำนวยความสะดวก"
          },
          {
            time_period: "18.40 น.",
            activity_title: "บินลัดฟ้าสู่นครเฉิงตู มณฑลเสฉวน",
            location_name: "สนามบินนานาชาติเฉิงตูเทียนฟู่ (TFU)",
            description: "ออกเดินทางสู่นครเฉิงตู โดยเที่ยวบิน **3U3934** สู่ดินแดนแห่งหมีแพนด้าและหม่าล่าต้นตำรับ"
          },
          {
            time_period: "22.45 น.",
            activity_title: "เดินทางถึงเฉิงตู - ผ่านพิธีการตรวจคนเข้าเมือง - เดินทางเข้าสู่โรงแรมที่พัก",
            location_name: "โรงแรมที่พักในเมืองเฉิงตู",
            description: "เดินทางถึง **สนามบินเฉิงตูเทียนฟู่** ผ่านด่านตรวจคนเข้าเมือง จากนั้นนำท่านเข้าสู่โรงแรมที่พัก พักผ่อนตามอัธยาศัย",
            is_highlight: false
          }
        ]
      },
      {
        theme: "เฉิงตู - ศูนย์เพาะพันธุ์หมีแพนด้า - ถ่ายรูปหมีแพนด้ายักษ์ปีนตึก IFS & ถนนไท่กู่หลี่",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมความน่ารัก ศูนย์อนุรักษ์และเพาะพันธุ์หมีแพนด้ายักษ์ (Chengdu Panda Base)",
            location_name: "ศูนย์เพาะพันธุ์หมีแพนด้าเฉิงตู",
            description: "นำท่านชม **ศูนย์เพาะพันธุ์หมีแพนด้าเฉิงตู** สัมผัสความน่ารักของแพนด้าตัวจริงอย่างใกล้ชิดในบรรยากาศป่าไผ่ธรรมชาติอันร่มรื่น",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูสุกี้หม่าล่าเสฉวนระดับพรีเมียม",
            location_name: "ร้านหม้อไฟชื่อดังเฉิงตู",
            description: "ลิ้มลองรสชาติต้นตำรับ **สุกี้หม่าล่าเสฉวน** กลิ่นหอมเครื่องเทศเสฉวนแท้ๆ พร้อมวัตถุดิบสดใหม่"
          },
          {
            time_period: "บ่าย",
            activity_title: "จุดเช็คอินยอดฮิต แพนด้ายักษ์ปีนตึก IFS & ช้อปปิ้งถนนคนเดินไท่กู่หลี่ (Taikoo Li)",
            location_name: "ตึก IFS Chengdu & ถนนไท่กู่หลี่ (Taikoo Li)",
            description: "ขึ้นดาดฟ้าถ่ายรูปกับ **แพนด้ายักษ์ปีนตึก IFS** แลนด์มาร์กอันดับหนึ่งของเฉิงตู และเดินเล่น **ไท่กู่หลี่ (Taikoo Li)** ย่านการค้าสถาปัตยกรรมโบราณผสมผสานความโมเดิร์น",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "เดินเล่นตรอกกว้างตรอกแคบ (Kuanzhai Alley) & คาเฟ่เสฉวนสุดเก๋",
            location_name: "ตรอกกว้างตรอกแคบ (Kuanzhai Alley)",
            description: "ชมบ้านเรือนสไตล์จีนโบราณยุคราชวงศ์ชิง ณ **ตรอกกว้างตรอกแคบ (Kuanzhai Alley)** ถ่ายรูปมุม Aesthetic จิบชาและชิมของว่างพื้นเมือง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "เฉิงตู - ฉงชิ่ง - รถไฟทะลุตึกหลี่จื่อป้า - ถ่ายรูปแสงสีเมืองไซเบอร์พังก์ หงหยาต้ง (Hongyadong)",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "นั่งรถไฟความเร็วสูงสู่มหานครฉงชิ่ง & ชมรถไฟทะลุตึกหลี่จื่อป้า (Liziba Station)",
            location_name: "สถานีรถไฟหลี่จื่อป้า (Liziba Station)",
            description: "นั่งรถไฟความเร็วสูงสู่ **ฉงชิ่ง** นำท่านถ่ายรูปจุดไวรัลระดับโลก **รถไฟโมโนเรลวิ่งทะลุตึกอพาร์ตเมนต์สถานีหลี่จื่อป้า** ความมหัศจรรย์ทางวิศวกรรม 3 มิติ",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน บะหมี่ฉงชิ่งเสียวเมี่ยน & เกี๊ยวเสฉวน",
            location_name: "ภัตตาคารท้องถิ่นฉงชิ่ง",
            description: "ลิ้มลองอาหารเสฉวนและบะหมี่ขึ้นชื่อรสเด็ดจัดจ้านสไตล์ฉงชิ่ง"
          },
          {
            time_period: "บ่าย",
            activity_title: "ชมย่านศิลปะสุดฮิต Eling Test Factory & คาเฟ่วิวพาโนรามาแม่น้ำแยงซี",
            location_name: "ย่านศิลปะ Eling Test Factory (Erling No. 2 Factory)",
            description: "นำท่านสู่ **Eling Test Factory No.2** โรงงานพิมพ์ธนบัตรเก่าที่ถูกรีโนเวทเป็นย่านอาร์ตสุดฮิป สวรรค์ของสายถ่ายรูปและคาเฟ่ชิค",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "แลนด์มาร์กไซเบอร์พังก์ระดับโลก หงหยาต้ง (Hongyadong) ยามค่ำคืน",
            location_name: "หงหยาต้ง (Hongyadong)",
            description: "ชมความอลังการของ **หงหยาต้ง (Hongyadong)** อาคารไม้โบราณ 11 ชั้นริมหน้าผาที่เปิดไฟสว่างไสวสีทอง ดุจดั่งฉากในแอนิเมชัน Spirited Away",
            is_highlight: true
          }
        ]
      },
      {
        theme: "เฉิงตู - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินเทียนฟู่ - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "10.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในเฉิงตู",
            description: "รับประทานอาหารเช้า ณ โรงแรมที่พัก จัดเก็บสัมภาระและเช็คเอาท์ รถมินิบัสรอรับเพื่อเดินทางสู่สนามบินเทียนฟู่"
          },
          {
            time_period: "12.00 น.",
            activity_title: "เดินทางถึงสนามบินเฉิงตูเทียนฟู่ - เช็คอินสัมภาระ",
            location_name: "สนามบินนานาชาติเฉิงตูเทียนฟู่ (TFU)",
            description: "เดินทางถึง **สนามบินนานาชาติเฉิงตูเทียนฟู่** เจ้าหน้าที่นำท่านเช็คอินบัตรโดยสารและโหลดสัมภาระ ผ่านการตรวจคนเข้าเมือง"
          },
          {
            time_period: "15.15 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **3U3933** เดินทางถึง **สนามบินสุวรรณภูมิ** เวลา **17.40 น.** โดยสวัสดิภาพพร้อมความสุขและความทรงจำสุดประทับใจ"
          }
        ]
      }
    ]
  }
};

/**
 * Build dynamic itinerary guaranteeing:
 * - Day 1: Pure travel / transit (No tourist spots)
 * - Last Day: Pure travel / return (No tourist spots)
 * - Middle Days: Trendy landmark check-ins & modern aesthetic highlights
 */
export function formatHotelByLevel(cityKey: string, hotelLevelInput?: string | null): string {
  const levelStr = (hotelLevelInput || "3 ดาว").toString().trim();
  const is3Star = levelStr.includes("3");
  const is5Star = levelStr.includes("5") || levelStr.toLowerCase().includes("luxury");
  const starLabel = is3Star ? "3 ดาว" : is5Star ? "5 ดาว" : "4 ดาว";

  const key = cityKey.toLowerCase();
  if (key.includes("kunming") || key.includes("คุนหมิง") || key.includes("ลี่เจียง")) {
    if (is3Star) return "Holiday Inn Express Kunming / IBIS Kunming Center หรือเทียบเท่า 3 ดาว";
    if (is5Star) return "InterContinental Kunming / Grand Hyatt Kunming หรือเทียบเท่า 5 ดาว";
    return "Kunming Grand Park Hotel / Delta Hotels by Marriott Kunming หรือเทียบเท่า 4 ดาว";
  }

  if (key.includes("chengdu") || key.includes("เฉิงตู") || key.includes("ฉงชิ่ง")) {
    if (is3Star) return "Ibis Chengdu Chunxi Road / Holiday Inn Express Chengdu หรือเทียบเท่า 3 ดาว";
    if (is5Star) return "Shangri-La Chengdu / Grand Hyatt Chengdu หรือเทียบเท่า 5 ดาว";
    return "Chengdu Tianfu Sunshine Hotel / Holiday Inn Chengdu Oriental Plaza หรือเทียบเท่า 4 ดาว";
  }

  if (key.includes("macao") || key.includes("macau") || key.includes("มาเก๊า") || key.includes("ฮ่องกง")) {
    if (is3Star) return "Hotel Sintra Macao / Harbourview Hotel Macao หรือเทียบเท่า 3 ดาว";
    if (is5Star) return "The Venetian Macao / The Parisian Macao หรือเทียบเท่า 5 ดาว";
    return "The Kowloon Hotel / Hotel Royal Macau หรือเทียบเท่า 4 ดาว";
  }

  if (key.includes("tokyo") || key.includes("โตเกียว") || key.includes("ญี่ปุ่น")) {
    if (is3Star) return "APA Hotel Shinjuku / Hotel Villa Fontaine Tokyo หรือเทียบเท่า 3 ดาว";
    if (is5Star) return "Grand Hyatt Tokyo / The Ritz-Carlton Tokyo หรือเทียบเท่า 5 ดาว";
    return "Shinagawa Prince Hotel / Shinjuku Washington Hotel หรือเทียบเท่า 4 ดาว";
  }

  if (is3Star) return `Hotel Standard City Center หรือเทียบเท่า 3 ดาว`;
  if (is5Star) return `Grand Luxury Hotel & Resort หรือเทียบเท่า 5 ดาว`;
  return `Grand Hotel City Center หรือเทียบเท่า ${starLabel}`;
}

export function sanitizeHotelName(hotelName: string | undefined, hotelLevelInput?: string | null): string {
  const targetLevel = (hotelLevelInput || "3 ดาว").toString().trim();
  if (!hotelName) return formatHotelByLevel("", targetLevel);

  const is3Star = targetLevel.includes("3");
  const is4Star = targetLevel.includes("4");
  const is5Star = targetLevel.includes("5") || targetLevel.toLowerCase().includes("luxury");

  if (is3Star) {
    if (hotelName.includes("4 ดาว") || hotelName.includes("5 ดาว")) {
      return hotelName.replace(/4 ดาว|5 ดาว|4 Star|5 Star/g, "3 ดาว");
    }
  } else if (is4Star) {
    if (hotelName.includes("3 ดาว") || hotelName.includes("5 ดาว")) {
      return hotelName.replace(/3 ดาว|5 ดาว|3 Star|5 Star/g, "4 ดาว");
    }
  } else if (is5Star) {
    if (hotelName.includes("3 ดาว") || hotelName.includes("4 ดาว")) {
      return hotelName.replace(/3 ดาว|4 ดาว|3 Star|4 Star/g, "5 ดาว");
    }
  }

  return hotelName;
}

export function buildFallbackPlan(
  mainCity: string,
  country: string,
  duration: number,
  startDate: string,
  hotelLevel?: string
): AIPlan {
  const cityInput = (mainCity || country || "").toLowerCase();
  
  const matchKey = Object.keys(DESTINATION_DATA).find(k => 
    cityInput.includes(k) || 
    (k === "kunming" && (cityInput.includes("คุนหมิง") || cityInput.includes("คุณหมิง") || cityInput.includes("ลี่เจียง") || cityInput.includes("kunming"))) ||
    (k === "chengdu" && (cityInput.includes("เฉิงตู") || cityInput.includes("ฉงชิ่ง") || cityInput.includes("chengdu"))) ||
    (k === "macao" && (cityInput.includes("มาเก๊า") || cityInput.includes("ฮ่องกง") || cityInput.includes("macau") || cityInput.includes("macao"))) ||
    (k === "tokyo" && (cityInput.includes("โตเกียว") || cityInput.includes("ญี่ปุ่น") || cityInput.includes("tokyo") || cityInput.includes("japan")))
  );

  const selectedHotel = formatHotelByLevel(matchKey || mainCity, hotelLevel);

  if (matchKey && DESTINATION_DATA[matchKey]) {
    const preset = DESTINATION_DATA[matchKey];
    const totalDays = Math.max(2, duration);

    const itinerary = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
      const dayNo = i + 1;

      // Day 1 is always preset day 0 (pure travel)
      if (dayNo === 1) {
        return {
          day_number: 1,
          date: date.toISOString().split("T")[0],
          daily_theme: preset.days[0].theme,
          hotel_name_suggestion: selectedHotel,
          breakfast_included: false,
          lunch_included: true,
          dinner_included: true,
          activities: preset.days[0].activities
        };
      }

      // Last Day is always pure travel return
      if (dayNo === totalDays) {
        const lastDayPreset = preset.days[preset.days.length - 1];
        return {
          day_number: dayNo,
          date: date.toISOString().split("T")[0],
          daily_theme: lastDayPreset.theme,
          hotel_name_suggestion: selectedHotel,
          breakfast_included: true,
          lunch_included: false,
          dinner_included: false,
          activities: lastDayPreset.activities
        };
      }

      // Middle Days: pick from middle preset days or generate trendy landmark day
      const middleIdx = (dayNo - 2) % (preset.days.length - 2) + 1;
      const midPreset = preset.days[middleIdx] || preset.days[1];

      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: midPreset.theme,
        hotel_name_suggestion: selectedHotel,
        breakfast_included: true,
        lunch_included: true,
        dinner_included: true,
        activities: midPreset.activities
      };
    });

    return {
      tour_name: `${preset.tourName} ${totalDays} วัน ${totalDays - 1} คืน`,
      summary: `โปรแกรมท่องเที่ยวสุดอินเทรนด์ สัมผัสแลนด์มาร์กใหม่และมุมถ่ายรูปสุดฮิต เมือง ${mainCity} ${totalDays} วัน`,
      airline: preset.airline,
      flight_route: preset.flightRoute,
      outbound_flight: preset.outboundFlight,
      return_flight: preset.returnFlight,
      itinerary
    };
  }

  // General dynamic fallback for other destinations
  const city = mainCity || "เมืองท่องเที่ยว";
  const cntry = country || "";
  const destName = cntry ? `${city} (${cntry})` : city;
  const totalDays = Math.max(2, duration);

  const itinerary = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
    const dayNo = i + 1;

    if (dayNo === 1) {
      return {
        day_number: 1,
        date: date.toISOString().split("T")[0],
        daily_theme: `กรุงเทพฯ (สนามบินสุวรรณภูมิ) - เดินทางถึง ${city} - เช็คอินเข้าสู่โรงแรมที่พัก`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: false,
        lunch_included: true,
        dinner_included: true,
        activities: [
          {
            time_period: "เช้า / บ่าย",
            activity_title: `พร้อมกัน ณ สนามบินสุวรรณภูมิ - เดินทางสู่ ${city}`,
            location_name: `สนามบินสุวรรณภูมิ - สนามบิน ${city}`,
            description: `คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินและออกเดินทางสู่ **เมือง ${city}**`
          },
          {
            time_period: "บ่าย / เย็น",
            activity_title: `เดินทางถึง ${city} - ผ่านพิธีการตรวจคนเข้าเมือง - เข้าสู่ที่พัก`,
            location_name: `โรงแรมที่พักในเมือง ${city}`,
            description: `เดินทางถึง **สนามบินเมือง ${city}** ผ่านพิธีการตรวจคนเข้าเมืองและศุลกากร นำท่านเดินทางเข้าสู่โรงแรมที่พัก พักผ่อนตามอัธยาศัยเพื่อเตรียมความพร้อมสำหรับวันถัดไป`,
            is_highlight: false
          }
        ]
      };
    } else if (dayNo === totalDays) {
      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: `${city} - เช็คเอาท์โรงแรม - เดินทางสู่สนามบิน - กรุงเทพฯ (สนามบินสุวรรณภูมิ)`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: true,
        lunch_included: false,
        dinner_included: false,
        activities: [
          {
            time_period: "เช้า",
            activity_title: `รับประทานอาหารเช้า & เช็คเอาท์จากที่พัก`,
            location_name: `โรงแรมที่พักใน ${city}`,
            description: `รับประทานอาหารเช้า ณ โรงแรมที่พัก จากนั้นจัดเก็บสัมภาระและเช็คเอาท์ รถมินิบัสรอรับเพื่อเดินทางสู่สนามบิน`
          },
          {
            time_period: "บ่าย / เย็น",
            activity_title: `เช็คอินสัมภาระ & เดินทางกลับกรุงเทพฯ (สุวรรณภูมิ)`,
            location_name: `สนามบิน ${city} - สนามบินสุวรรณภูมิ`,
            description: `เดินทางถึงสนามบิน เช็คอินสัมภาระและออกเดินทางกลับกรุงเทพฯ (สุวรรณภูมิ) โดยสวัสดิภาพพร้อมความประทับใจ`
          }
        ]
      };
    } else {
      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: `ไฮไลต์แลนด์มาร์กใหม่ & จุดเช็คอินถ่ายรูปยอดฮิต เมือง ${city} (วันที่ ${dayNo})`,
        hotel_name_suggestion: `โรงแรมระดับ 4 ดาว ใจกลางเมือง ${city}`,
        breakfast_included: true,
        lunch_included: true,
        dinner_included: true,
        activities: [
          {
            time_period: "เช้า",
            activity_title: `เช็คอินแลนด์มาร์กอันดับ 1 & มุมถ่ายภาพ Aesthetic เมือง ${city}`,
            location_name: `แลนด์มาร์กชื่อดังเมือง ${city}`,
            description: `นำท่านชม **แลนด์มาร์กชื่อดังและสถาปัตยกรรมโดดเด่นประจำเมือง ${city}** ถ่ายรูปมุมไวรัลยอดนิยมบนแพลตฟอร์มโซเชียลมีเดีย`,
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: `รับประทานอาหารกลางวัน เมนูมิชลินไกด์ / ร้านดังประจำเมือง ${city}`,
            location_name: `ร้านอาหารขึ้นชื่อเมือง ${city}`,
            description: `ลิ้มลองอาหารจานเด็ดและเมนูรสเลิศขึ้นชื่อในย่าน **เมือง ${city}**`
          },
          {
            time_period: "บ่าย",
            activity_title: `เดินเล่นย่านศิลปะร่วมสมัย & คาเฟ่ฮอปปิ้งสุดชิค ${city}`,
            location_name: `ย่านครีเอทีฟและคาเฟ่ ${city}`,
            description: `นำท่านสู่ **ย่านครีเอทีฟและคาเฟ่ดีไซน์มินิมอลเมือง ${city}** พักผ่อนจิบเครื่องดื่มและถ่ายรูปมุมสวยสไตล์มินิมอล`,
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: `จุดชมวิวแสงสียามค่ำคืน & ถนนคนเดินคนเมือง ${city}`,
            location_name: `จุดชมวิวและถนนคนเดิน ${city}`,
            description: `ชมทัศนียภาพแสงสีไฟนีออนยามค่ำคืนใจกลาง **เมือง ${city}** และอิสระเลือกซื้อของฝากสินค้าแฟชั่น`,
            is_highlight: true
          }
        ]
      };
    }
  });

  return {
    tour_name: `โปรแกรมท่องเที่ยวสุดอินเทรนด์ ${destName} ${totalDays} วัน ${totalDays - 1} คืน`,
    summary: `แพลนท่องเที่ยวสัมผัสไฮไลต์ใหม่และจุดถ่ายรูปยอดฮิตเมือง ${city} ระยะเวลา ${totalDays} วัน`,
    airline: `สายการบินบินตรงสู่ ${city}`,
    flight_route: `BKK - ${city} - BKK`,
    outbound_flight: `ออกเดินทางจากสนามบินสุวรรณภูมิ สู่สนามบิน ${city}`,
    return_flight: `ออกเดินทางจากสนามบิน ${city} กลับถึงสนามบินสุวรรณภูมิ`,
    itinerary,
  };
}
