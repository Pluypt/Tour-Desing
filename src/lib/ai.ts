import { GoogleGenerativeAI } from "@google/generative-ai";
import { formatTourPlanTitle } from "./titleHelper";

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
export function validateAIPlan(plan: unknown, expectedDuration?: number): plan is AIPlan {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;
  if (!Array.isArray(p.itinerary) || p.itinerary.length === 0) return false;
  if (expectedDuration && p.itinerary.length !== expectedDuration) return false;
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
  shenzhen: {
    tourName: "โปรแกรมท่องเที่ยวสุดอินเทรนด์ เซินเจิ้น (จีน) 4 วัน 3 คืน",
    hotel: "Shenzhen Marco Polo Hotel / Grand Skylight Hotel หรือเทียบเท่า 4 ดาว",
    airline: "Shenzhen Airlines (ZH) / China Southern Airlines (CZ)",
    flightRoute: "BKK - SZX - BKK",
    outboundFlight: "ZH9004 BKK 11:25 - 15:15 SZX",
    returnFlight: "ZH9003 SZX 16:40 - 18:35 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - เมืองเซินเจิ้น - ตึกตระหง่าน Ping An Finance Centre - ถนนคนเดิน Dongmen Pedestrian Street",
        activities: [
          {
            time_period: "09.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน Shenzhen Airlines เจ้าหน้าที่คอยอำนวยความสะดวกเรื่องสัมภาระ"
          },
          {
            time_period: "11.25 น.",
            activity_title: "ออกเดินทางบินตรงสู่มหานครเซินเจิ้น",
            location_name: "สนามบินนานาชาติเซินเจิ้นเป่าอัน (SZX)",
            description: "ออกเดินทางสู่ **มหานครเซินเจิ้น** โดยเที่ยวบิน **ZH9004** สัมผัสมหานครแห่งนวัตกรรมและเทคโนโลยีระดับโลก"
          },
          {
            time_period: "15.15 น.",
            activity_title: "เดินทางถึงเซินเจิ้น - ผ่านพิธีการตรวจคนเข้าเมือง",
            location_name: "สนามบินนานาชาติเซินเจิ้นเป่าอัน (SZX)",
            description: "เดินทางถึง **สนามบินนานาชาติเซินเจิ้นเป่าอัน** ผ่านพิธีการตรวจคนเข้าเมืองและศุลกากร นำท่านเข้าสู่โรงแรมที่พัก"
          },
          {
            time_period: "เย็น",
            activity_title: "ชมตึกสูงปิงอัน Ping An Finance Centre & ช้อปปิ้งถนนคนเดิน Dongmen Pedestrian Street",
            location_name: "ตึกปิงอัน & ถนนคนเดินตงเหมิน",
            description: "ชมความอลังการของ **ตึกปิงอัน (Ping An Finance Centre)** แลนด์มาร์กที่สูงที่สุดในเซินเจิ้น และอิสระช้อปปิ้งย่าน **ถนนคนเดินตงเหมิน (Dongmen Pedestrian Street)** แหล่งรวมแฟชั่น สตรีทฟู้ด และร้านค้าชื่อดัง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "เซินเจิ้น - ท่องโลกสิ่งมหัศจรรย์ Window of the World - ย่านศิลปะ OCT-LOFT - โชว์น้ำพุเริงระบำ Sea World Shekou",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "เข้าชมอุทยานจำลองระดับโลก Window of the World (หน้าต่างสู่โลกกว้าง)",
            location_name: "Window of the World (หน้าต่างสู่โลกกว้าง)",
            description: "นำท่านเข้าชม **Window of the World (หน้าต่างสู่โลกกว้าง)** สวนสนุกและเมืองจำลองแลนด์มาร์กระดับโลกกว่า 130 แห่งทั่วโลก เช่น หอไอเฟล พีระมิด หอเอนปิซา และเทพีเสรีภาพ",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูพิเศษเป็ดปักกิ่งเซินเจิ้น",
            location_name: "ร้านอาหารขึ้นชื่อเมืองเซินเจิ้น",
            description: "ลิ้มลองเมนูเด็ด **เป็ดปักกิ่งหนังกรอบ** และอาหารจีนกวางตุ้งรสเลิศ ณ ร้านอาหารชื่อดัง"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นย่านครีเอทีฟสุดฮิป OCT-LOFT Creative Culture Park",
            location_name: "OCT-LOFT Creative Culture Park",
            description: "นำท่านสัมผัสย่านศิลปะ **OCT-LOFT Creative Culture Park** ดัดแปลงจากย่านโรงงานเก่าเป็นศูนย์รวมสตูดิโอศิลปะ ร้านหนังสือ คาเฟ่ฮิปๆ และดีไซน์แกลเลอรี",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "เช็คอินไลฟ์สไตล์ริมทะเล Sea World Shekou & ชมโชว์การแสดงน้ำพุแสงสีเสียง",
            location_name: "Sea World Shekou",
            description: "นำท่านสู่ **Sea World Shekou** ย่านความบันเทิงริมทะเล ถ่ายรูปคู่กับเรือสำราญโบราณ Minghua และชมโชว์น้ำพุเริงระบำตระการตายามค่ำคืน",
            is_highlight: true
          }
        ]
      },
      {
        theme: "เซินเจิ้น - ชมวิวเมือง ณ สวนสาธารณะเลียนฮวาซาน (Lianhuashan Park) - ช้อปปิ้งตลาดไอที Huaqiangbei",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมทัศนียภาพเมือง ณ สวนสาธารณะเลียนฮวาซาน (Lianhuashan Park) & อนุสาวรีย์เติ้งเสี่ยวผิง",
            location_name: "สวนสาธารณะเลียนฮวาซาน (Lianhuashan Park)",
            description: "นำท่านขึ้นสู่ยอดเขา **สวนสาธารณะเลียนฮวาซาน (Lianhuashan Park)** ถ่ายรูปคู่กับอนุสาวรีย์ทองสัมฤทธิ์ของเติ้งเสี่ยวผิง และชมทัศนียภาพพานอรามาของเซินเจิ้น",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูติ่มซำกวางตุ้งขนานแท้",
            location_name: "ภัตตาคารติ่มซำเซินเจิ้น",
            description: "รับประทาน **ติ่มซำกวางตุ้ง** ขนมจีบ ฮะเก๋ากุ้งสด ซาลาเปาไส้ไหล และเมนูอบกรอบรสเลิศ"
          },
          {
            time_period: "บ่าย",
            activity_title: "ท่องโลกไอทีและแกดเจ็ต Huaqiangbei (ฮัวเฉียงเป่ย)",
            location_name: "ตลาดไอทีฮัวเฉียงเป่ย (Huaqiangbei)",
            description: "นำท่านสู่ **ตลาดฮัวเฉียงเป่ย (Huaqiangbei)** ศูนย์กลางการค้าอิเล็กทรอนิกส์ ไอที แกดเจ็ต และนวัตกรรมเทคโนโลยีที่ใหญ่ที่สุดในโลก",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ชมแสงสีไฟนีออน & อาหารเย็น ณ ย่านศูนย์การค้าการบินพลาซ่า",
            location_name: "ย่านการค้าช็อปปิ้งมอลล์เซินเจิ้น",
            description: "เพลิดเพลินกับบรรยากาศยามค่ำคืน รับประทานอาหารเย็น และเลือกซื้อของฝากก่อนกลับ"
          }
        ]
      },
      {
        theme: "เซินเจิ้น - พิพิธภัณฑ์เมืองเซินเจิ้น (Shenzhen Museum) - สนามบินนานาชาติเซินเจิ้น - กรุงเทพฯ",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "เข้าชมพิพิธภัณฑ์เมืองเซินเจิ้น (Shenzhen Museum)",
            location_name: "พิพิธภัณฑ์เมืองเซินเจิ้น (Shenzhen Museum)",
            description: "นำท่านเข้าชม **พิพิธภัณฑ์เมืองเซินเจิ้น (Shenzhen Museum)** เรียนรู้ประวัติศาสตร์การพัฒนาจากหมู่บ้านประมงเล็กๆ สู่มหานครเทคโนโลยีระดับโลก"
          },
          {
            time_period: "13.30 น.",
            activity_title: "เดินทางสู่สนามบินนานาชาติเซินเจิ้นเป่าอัน",
            location_name: "สนามบินนานาชาติเซินเจิ้นเป่าอัน (SZX)",
            description: "นำท่านเดินทางสู่สนามบิน ดำเนินการเช็คอินสัมภาระและผ่านขั้นตอนตรวจคนเข้าเมือง"
          },
          {
            time_period: "16.40 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับสู่กรุงเทพฯ โดยเที่ยวบิน **ZH9003** เดินทางถึงสนามบินสุวรรณภูมิ โดยสวัสดิภาพพร้อมความประทับใจ"
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
  beijing: {
    tourName: "มหัศจรรย์ ปักกิ่ง กำแพงเมืองจีน พระราชวังต้องห้าม & เช็คอินแลนด์มาร์กใหม่",
    hotel: "Beijing Marriott Hotel / Grand Millennium Beijing หรือเทียบเท่า 4 ดาว",
    airline: "Air China (CA) / Thai Airways (TG)",
    flightRoute: "BKK - PEK - BKK",
    outboundFlight: "CA960 BKK 19:15 - 01:10 (+1) PEK",
    returnFlight: "CA959 PEK 13:40 - 18:00 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - นครปักกิ่ง (สนามบินเป่ยจิงแคปิตอล) - เช็คอินเข้าสู่ที่พัก",
        activities: [
          {
            time_period: "16.30 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน Air China"
          },
          {
            time_period: "19.15 น.",
            activity_title: "ออกเดินทางบินตรงสู่นครหลวงปักกิ่ง",
            location_name: "สนามบินนานาชาติเป่ยจิงแคปิตอล (PEK)",
            description: "ออกเดินทางสู่นครหลวงปักกิ่ง โดยเที่ยวบิน **CA960** เดินทางถึงปักกิ่งเวลา 01.10 น."
          },
          {
            time_period: "01.10 น.",
            activity_title: "เดินทางถึงปักกิ่ง - ผ่านพิธีการตรวจคนเข้าเมือง - เข้าสู่โรงแรมที่พัก",
            location_name: "โรงแรมที่พักใจกลางนครปักกิ่ง",
            description: "เดินทางถึง **สนามบินนานาชาติเป่ยจิงแคปิตอล** นำท่านเดินทางเข้าสู่โรงแรมที่พัก พักผ่อนเพื่อเตรียมตัวสำหรับวันถัดไป",
            is_highlight: false
          }
        ]
      },
      {
        theme: "ปักกิ่ง - จัตุรัสเทียนอันเหมิน - พระราชวังต้องห้ามกู้กง - หอฟ้าเทียนถาน - ถนนคนเดินหวังฝูจิ่ง",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมความยิ่งใหญ่ จัตุรัสเทียนอันเหมิน (Tiananmen Square) & พระราชวังต้องห้าม (Forbidden City)",
            location_name: "จัตุรัสเทียนอันเหมิน & พระราชวังต้องห้าม",
            description: "นำท่านชม **จัตุรัสเทียนอันเหมิน** จัตุรัสใจกลางเมืองที่ใหญ่ที่สุดในโลก จากนั้นลอดซุ้มประตูเข้าสู่ **พระราชวังต้องห้ามกู้กง (Forbidden City)** มรดกโลก UNESCO ชมท้องพระโรงทองคำและสถาปัตยกรรมราชวงศ์หมิงและชิง",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูเป็ดปักกิ่งสูตรต้นตำรับชาววัง",
            location_name: "ภัตตาคารเป็ดปักกิ่งชื่อดัง",
            description: "ลิ้มลอง **เป็ดปักกิ่งแท้** หนังกรอบบาง ห่อแผ่นแป้งนุ่ม ราดซอสหวานสูตรพิเศษและเครื่องเคียง"
          },
          {
            time_period: "บ่าย",
            activity_title: "สักการะขอพร หอฟ้าเทียนถาน (Temple of Heaven)",
            location_name: "หอฟ้าเทียนถาน (Temple of Heaven)",
            description: "นำท่านชม **หอฟ้าเทียนถาน** สถานที่ประกอบพิธีบวงสรวงสวรรค์ของจักรพรรดิโบราณ ชมตำหนักกลมไม้ไร้ตะปูอันวิจิตรอลังการ",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งถนนคนเดินหวังฝูจิ่ง (Wangfujing) & ถ่ายรูปตึก CCTV",
            location_name: "ถนนคนเดินหวังฝูจิ่ง (Wangfujing Street)",
            description: "อิสระช้อปปิ้ง **ถนนคนเดินหวังฝูจิ่ง** แหล่งรวมสินค้าแฟชั่น ของฝาก และสตรีทฟู้ดปักกิ่ง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "ปักกิ่ง - 1 ใน 7 สิ่งมหัศจรรย์ของโลก กำแพงเมืองจีน (ด่านมู่เถียนยวี่) - ชมสนามกีฬารังนกโอลิมปิก",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "พิชิต 1 ใน 7 สิ่งมหัศจรรย์ กำแพงเมืองจีน ด่านมู่เถียนยวี่ (Mutianyu Great Wall)",
            location_name: "กำแพงเมืองจีน ด่านมู่เถียนยวี่",
            description: "นำท่านนั่งกระเช้าขึ้นสู่ **กำแพงเมืองจีน ด่านมู่เถียนยวี่** สัมผัสความยิ่งใหญ่ของแนวกำแพงหินทอดยาวบนสันเขาสลับซับซ้อน ทัศนียภาพงดงามตระการตา",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน สุกี้หม้อไฟมองโกลปักกิ่ง",
            location_name: "ภัตตาคารสุกี้มองโกล",
            description: "รับประทาน **สุกี้หม้อไฟมองโกล** เนื้อแกะและเนื้อวัวสไลซ์บาง จุ่มในน้ำซุปสมุนไพรร้อนๆ"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นพระราชวังฤดูร้อน อี้เหอหยวน (Summer Palace)",
            location_name: "พระราชวังฤดูร้อน อี้เหอหยวน",
            description: "ชม **พระราชวังฤดูร้อนอี้เหอหยวน** อุทยานหลวงริมทะเลสาบคุนหมิง ชมระเบียงทางเดินไม้ยาวที่สุดในโลก และเรือหินอ่อนของพระนางซูสีไทเฮา",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ถ่ายรูปเช็คอิน สนามกีฬาแห่งชาติรังนก (Bird's Nest) & Water Cube ยามค่ำคืน",
            location_name: "สนามกีฬาแห่งชาติรังนก (Beijing National Stadium)",
            description: "ชมแสงสีสุดตระการตาบริเวณ **สนามกีฬาแห่งชาติรังนก** และศูนย์กีฬาทางน้ำ **Water Cube** แลนด์มาร์กสถาปัตยกรรมโอลิมปิกระดับโลก",
            is_highlight: true
          }
        ]
      },
      {
        theme: "ปักกิ่ง - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินเป่ยจิงแคปิตอล - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "09.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในปักกิ่ง",
            description: "รับประทานอาหารเช้า ณ ห้องอาหารของโรงแรม จากนั้นจัดเก็บสัมภาระและเช็คเอาท์เพื่อเดินทางสู่สนามบิน"
          },
          {
            time_period: "11.00 น.",
            activity_title: "เดินทางถึงสนามบินเป่ยจิงแคปิตอล - เช็คอินสัมภาระ",
            location_name: "สนามบินนานาชาติเป่ยจิงแคปิตอล (PEK)",
            description: "เดินทางถึงสนามบิน เช็คอินบัตรโดยสารและโหลดสัมภาระ ผ่านพิธีการตรวจคนเข้าเมือง"
          },
          {
            time_period: "13.40 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับสู่กรุงเทพฯ โดยเที่ยวบิน **CA959** ถึงสนามบินสุวรรณภูมิ เวลา 18.00 น. โดยสวัสดิภาพ"
          }
        ]
      }
    ]
  },
  guangzhou: {
    tourName: "ไฮไลต์ กวางโจว เช็คอินแคนตันทาวเวอร์ ล่องเรือแม่น้ำจูเจียง ช้อปปิ้งถนนคนเดินเป่ยจิงลู่",
    hotel: "Guangzhou Marriott Hotel / Crowne Plaza Guangzhou หรือเทียบเท่า 4 ดาว",
    airline: "China Southern Airlines (CZ) / Thai Airways (TG)",
    flightRoute: "BKK - CAN - BKK",
    outboundFlight: "CZ3082 BKK 11:55 - 15:45 CAN",
    returnFlight: "CZ3081 CAN 17:15 - 19:15 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - กวางโจว (สนามบินไป๋อวิ๋น) - หอคอยแคนตันทาวเวอร์ - ล่องเรือแม่น้ำจูเจียง",
        activities: [
          {
            time_period: "09.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน China Southern Airlines"
          },
          {
            time_period: "11.55 น.",
            activity_title: "ออกเดินทางบินตรงสู่นครกวางโจว",
            location_name: "สนามบินนานาชาติกวางโจวไป๋อวิ๋น (CAN)",
            description: "บินลัดฟ้าสู่นครกวางโจว โดยเที่ยวบิน **CZ3082** เดินทางถึงกวางโจวเวลา 15.45 น."
          },
          {
            time_period: "เย็น",
            activity_title: "ชมหอคอย Canton Tower & ล่องเรือสำราญชมแม่น้ำจูเจียง (Pearl River Cruise)",
            location_name: "หอคอยแคนตันทาวเวอร์ & แม่น้ำจูเจียง",
            description: "ชมความงามของ **หอคอย Canton Tower** หอคอยสูงระฟ้าแลนด์มาร์กของกวางโจว และล่องเรือสำราญชมแสงสีไฟนีออนสองฝั่ง **แม่น้ำจูเจียง (Pearl River)** ยามค่ำคืน",
            is_highlight: true
          }
        ]
      },
      {
        theme: "กวางโจว - อนุสาวรีย์แพะห้าตัว สวนเยว่ซิ่ว - คฤหาสน์ตระกูลเฉิน - ถนนคนเดินเป่ยจิงลู่",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมอนุสาวรีย์แพะห้าตัว สวนเยว่ซิ่ว (Yuexiu Park) & ซานฟางซีฟาง",
            location_name: "สวนเยว่ซิ่ว (Yuexiu Park)",
            description: "นำท่านสู่ **สวนเยว่ซิ่ว (Yuexiu Park)** ถ่ายรูปคู่กับ **อนุสาวรีย์แพะห้าตัว (Five Rams Sculpture)** สัญลักษณ์แห่งเมืองกวางโจว",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน ติ่มซำกวางตุ้งชื่อดัง กวางโจว",
            location_name: "ภัตตาคารติ่มซำกวางโจว",
            description: "ลิ้มลองติ่มซำกวางตุ้งขนานแท้ ฮะเก๋ากุ้ง ขนมจีบหมู และก๋วยเตี๋ยวหลอดกุ้งกรอบ"
          },
          {
            time_period: "บ่าย",
            activity_title: "เข้าชมคฤหาสน์ตระกูลเฉิน (Chen Clan Ancestral Hall)",
            location_name: "คฤหาสน์ตระกูลเฉิน (Chen Clan Ancestral Hall)",
            description: "ชมสถาปัตยกรรมงานแกะสลักไม้ หิน อิฐ และกระเบื้องเคลือบสุดวิจิตร ณ **คฤหาสน์ตระกูลเฉิน** มรดกทางวัฒนธรรมอันล้ำค่า",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งถนนคนเดินเป่ยจิงลู่ (Beijing Road) & ชมถนนโบราณพันปี",
            location_name: "ถนนคนเดินเป่ยจิงลู่ (Beijing Road)",
            description: "ช้อปปิ้งสินค้าแฟชั่น เสื้อผ้า ของฝาก ณ **ถนนคนเดินเป่ยจิงลู่ (Beijing Road)** และชมร่องรอยถนนหินโบราณสมัยราชวงศ์ซ่งใต้กระจกใสใจกลางถนน",
            is_highlight: true
          }
        ]
      },
      {
        theme: "กวางโจว - เกาะซาเหมี่ยน (Shamian Island) - ตลาดค้าส่งเสื้อผ้าซาเหอ - ย่านถนนคนเดินซ่างเซี่ยจิ่ว",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "เดินเล่นถ่ายรูปสไตล์ยุโรป เกาะซาเหมี่ยน (Shamian Island)",
            location_name: "เกาะซาเหมี่ยน (Shamian Island)",
            description: "นำท่านเดินเล่นถ่ายรูปบน **เกาะซาเหมี่ยน** ย่านตึกโบราณสไตล์โคโลเนียลยุโรปร่มรื่นไปด้วยต้นไม้ใหญ่ สวรรค์ของสายถ่ายรูป Portrait",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูห่านย่างกวางโจวหนังกรอบ",
            location_name: "ภัตตาคารห่านย่างชื่อดัง",
            description: "รับประทานอาหารกลางวัน ลิ้มรสชาติ **ห่านย่างกวางโจว** เนื้อนุ่มหนังกรอบราดซอสบ๊วย"
          },
          {
            time_period: "บ่าย / เย็น",
            activity_title: "ช้อปปิ้งถนนคนเดินซ่างเซี่ยจิ่ว (Shangxiajiu Pedestrian Street)",
            location_name: "ถนนคนเดินซ่างเซี่ยจิ่ว (Shangxiajiu)",
            description: "อิสระช้อปปิ้งย่าน **ถนนคนเดินซ่างเซี่ยจิ่ว** ชมสถาปัตยกรรมอาคารสไตล์ฉีโหลว (Qilou) และลิ้มลองขนมหวานกวางตุ้งชื่อดัง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "กวางโจว - เช็คเอาท์โรงแรม - เดินทางสู่สนามบินไป๋อวิ๋น - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "11.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในกวางโจว",
            description: "รับประทานอาหารเช้า ณ โรงแรมที่พัก จากนั้นจัดเก็บสัมภาระและเช็คเอาท์"
          },
          {
            time_period: "14.00 น.",
            activity_title: "เดินทางถึงสนามบินกวางโจวไป๋อวิ๋น - เช็คอินสัมภาระ",
            location_name: "สนามบินนานาชาติกวางโจวไป๋อวิ๋น (CAN)",
            description: "เดินทางถึงสนามบิน เช็คอินบัตรโดยสารและโหลดสัมภาระ ผ่านพิธีการตรวจคนเข้าเมือง"
          },
          {
            time_period: "17.15 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **CZ3081** ถึงสนามบินสุวรรณภูมิ เวลา 19.15 น. โดยสวัสดิภาพ"
          }
        ]
      }
    ]
  },
  seoul: {
    tourName: "สุดอินเทรนด์ โซล เกาหลีใต้ เช็คอินพระราชวังเคียงบกกุง ฮงแด เมียงดง & คาเฟ่สุดฮิต",
    hotel: "L7 Myeongdong / Novotel Ambassador Seoul หรือเทียบเท่า 4 ดาว",
    airline: "Korean Air (KE) / Asiana Airlines (OZ) / Thai Airways (TG)",
    flightRoute: "BKK - ICN - BKK",
    outboundFlight: "KE658 BKK 23:30 - 07:00 (+1) ICN",
    returnFlight: "KE657 ICN 17:40 - 21:40 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - โซล (สนามบินอินชอน) - เช็คอินเข้าโรงแรมที่พัก",
        activities: [
          {
            time_period: "20.30 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **ท่าอากาศยานสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน Korean Air"
          },
          {
            time_period: "23.30 น.",
            activity_title: "ออกเดินทางบินตรงสู่กรุงโซล ประเทศเกาหลีใต้",
            location_name: "สนามบินนานาชาติอินชอน (ICN)",
            description: "ออกเดินทางสู่กรุงโซล โดยเที่ยวบิน **KE658** พักผ่อนบนเครื่องบิน"
          },
          {
            time_period: "07.00 น.",
            activity_title: "เดินทางถึงสนามบินอินชอน - ผ่านตม. - เข้าสู่กรุงโซล",
            location_name: "สนามบินนานาชาติอินชอน & โรงแรมที่พัก",
            description: "เดินทางถึง **สนามบินอินชอน** ผ่านพิธีการตรวจคนเข้าเมือง จากนั้นเดินทางเข้าสู่กรุงโซล ฝากสัมภาระและพักผ่อน",
            is_highlight: false
          }
        ]
      },
      {
        theme: "โซล - สวมชุดฮันบก พระราชวังเคียงบกกุง - หมู่บ้านบุกชอนฮันอก - ช้อปปิ้งย่านเมียงดง",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "สวมชุดฮันบกเข้าชม พระราชวังเคียงบกกุง (Gyeongbokgung Palace)",
            location_name: "พระราชวังเคียงบกกุง (Gyeongbokgung Palace)",
            description: "สวมชุดฮันบกเกาหลีโบราณเข้าชม **พระราชวังเคียงบกกุง** พระราชวังหลวงที่ใหญ่ที่สุดในเกาหลี ชมพิธีเปลี่ยนเวรราชองครักษ์และถ่ายรูปมุมสวยสไตล์ย้อนยุค",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูไก่ตุ๋นโสมเกาหลีโบราณ (Samgyetang)",
            location_name: "ร้านไก่ตุ๋นโสมชื่อดังโซล",
            description: "ลิ้มลอง **ไก่ตุ๋นโสมเกาหลี** อัดแน่นด้วยข้าวเหนียว โสมเกาหลี และสมุนไพรบำรุงสุขภาพ"
          },
          {
            time_period: "บ่าย",
            activity_title: "เดินเล่นหมู่บ้านโบราณ บุกชอนฮันอก (Bukchon Hanok Village) & ย่านคาเฟ่อิกซอนดง",
            location_name: "หมู่บ้านบุกชอนฮันอก & อิกซอนดง",
            description: "ถ่ายรูปบ้านเรือนเกาหลีโบราณ ณ **หมู่บ้านบุกชอนฮันอก** และเดินเล่นตรอกคาเฟ่สุดฮิป **ย่านอิกซอนดง (Ikseon-dong)**",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งย่านเมียงดง (Myeongdong) & ตระเวนชิม Street Food เกาหลี",
            location_name: "ตลาดเมียงดง (Myeongdong)",
            description: "อิสระช้อปปิ้งเครื่องสำอาง แฟชั่น และของฝาก ณ **ย่านเมียงดง** พร้อมลิ้มลองสตรีทฟู้ดเกาหลียอดฮิต ต๊อกบกกี คอร์นด็อก และชีสย่าง",
            is_highlight: true
          }
        ]
      },
      {
        theme: "โซล - หอคอย N Seoul Tower คล้องกุญแจคู่รัก - ช้อปปิ้งย่านวัยรุ่น ฮงแด (Hongdae)",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมวิวเมืองและจุดคล้องกุญแจคู่รัก N Seoul Tower (เขานัมซาน)",
            location_name: "N Seoul Tower (หอคอยนัมซาน)",
            description: "ขึ้นสู่ยอดเขานัมซานชม **N Seoul Tower** ชมทัศนียภาพกว้างไกลของกรุงโซล และเช็คอินจุดคล้องกุญแจคู่รักอันโด่งดัง",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน หมูย่างเกาหลีบาร์บีคิว (Samgyeopsal)",
            location_name: "ร้านหมูย่างเกาหลีพรีเมียม",
            description: "รับประทาน **หมูย่างเกาหลีแท้** เสิร์ฟพร้อมผักสด กิมจิ และเครื่องเคียงเกาหลีไม่อั้น"
          },
          {
            time_period: "บ่าย / เย็น",
            activity_title: "ช้อปปิ้งและชมสตรีทเพอร์ฟอร์แมนซ์ ย่านฮงแด (Hongdae Street)",
            location_name: "ย่านฮงแด (Hongdae Walking Street)",
            description: "อิสระช้อปปิ้งย่านมหาวิทยาลัยฮงอิก **ฮงแด (Hongdae)** แหล่งรวมเสื้อผ้าอินเทรนด์ คาเฟ่เก๋ๆ และการแสดงเปิดหมวกของวัยรุ่นเกาหลี",
            is_highlight: true
          }
        ]
      },
      {
        theme: "โซล - ซุปเปอร์มาร์เก็ตละลายเงินวอน - สนามบินอินชอน - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "11.00 น.",
            activity_title: "ช้อปปิ้งของฝาก ซุปเปอร์มาร์เก็ตละลายเงินวอน & เช็คเอาท์",
            location_name: "Korean Duty Free / Local Supermarket",
            description: "แวะซื้อของฝากยอดนิยม สาหร่ายเกาหลี ขนม บะหมี่กึ่งสำเร็จรูป และเครื่องสำอางก่อนเดินทางสู่สนามบิน"
          },
          {
            time_period: "14.30 น.",
            activity_title: "เดินทางถึงสนามบินนานาชาติอินชอน - เช็คอินสัมภาระ & Tax Refund",
            location_name: "สนามบินนานาชาติอินชอน (ICN)",
            description: "เดินทางถึงสนามบินอินชอน เช็คอินสัมภาระ ดำเนินการคืนภาษี (Tax Refund) และผ่านขั้นตอนตรวจคนเข้าเมือง"
          },
          {
            time_period: "17.40 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับสู่กรุงเทพฯ โดยเที่ยวบิน **KE657** เดินทางถึงสนามบินสุวรรณภูมิ เวลา 21.40 น. โดยสวัสดิภาพ"
          }
        ]
      }
    ]
  },
  singapore: {
    tourName: "มหัศจรรย์ สิงคโปร์ มารีน่าเบย์แซนด์ส การ์เด้นส์บายเดอะเบย์ & น้ำตก Jewel Changi",
    hotel: "Marina Bay Sands / Pan Pacific Singapore หรือเทียบเท่า 4 ดาว",
    airline: "Singapore Airlines (SQ) / Thai Airways (TG)",
    flightRoute: "BKK - SIN - BKK",
    outboundFlight: "SQ705 BKK 09:40 - 13:05 SIN",
    returnFlight: "SQ714 SIN 17:30 - 19:00 BKK",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - สิงคโปร์ (ชางงี) - เมอร์ไลออนพาร์ค - ชมโชว์แสงสี Spectra Marina Bay Sands",
        activities: [
          {
            time_period: "07.00 น.",
            activity_title: "พร้อมกัน ณ สนามบินสุวรรณภูมิ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบิน Singapore Airlines"
          },
          {
            time_period: "09.40 น.",
            activity_title: "ออกเดินทางบินตรงสู่ประเทศสิงคโปร์",
            location_name: "สนามบินนานาชาติชางงี (SIN)",
            description: "ออกเดินทางสู่สิงคโปร์ โดยเที่ยวบิน **SQ705** เดินทางถึงสนามบินชางงีเวลา 13.05 น."
          },
          {
            time_period: "บ่าย",
            activity_title: "ถ่ายรูปเช็คอินแลนด์มาร์ก เมอร์ไลออนพาร์ค (Merlion Park)",
            location_name: "เมอร์ไลออนพาร์ค (Merlion Park)",
            description: "นำท่านถ่ายรูปคู่กับ **รูปปั้นสิงโตพ่นน้ำ เมอร์ไลออน (Merlion)** สัญลักษณ์อันดับหนึ่งของสิงคโปร์ พร้อมชมวิวอ่าวมารีน่า",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ชมโชว์ม่านน้ำแสงสีเสียง Spectra - A Light & Water Show ณ Marina Bay Sands",
            location_name: "Marina Bay Sands Event Plaza",
            description: "ชมการแสดงน้ำพุ เลเซอร์ และแสงสีเสียงสุดอลังการริมอ่าวมารีน่า **Spectra Light & Water Show**",
            is_highlight: true
          }
        ]
      },
      {
        theme: "สิงคโปร์ - การ์เด้นส์บายเดอะเบย์ (Gardens by the Bay) - วัดพระเขี้ยวแก้ว ไชน่าทาวน์ - ย่านคลาร์กคีย์",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "เข้าชมเรือนกระจกระดับโลก Gardens by the Bay (Flower Dome & Cloud Forest)",
            location_name: "การ์เด้นส์บายเดอะเบย์ (Gardens by the Bay)",
            description: "นำท่านเข้าชม **Gardens by the Bay** ชมน้ำตกในร่มยักษ์ Cloud Forest และพรรณไม้เมืองหนาวใน Flower Dome พร้อมถ่ายรูปกับ Supertree Grove",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "รับประทานอาหารกลางวัน เมนูข้าวมันไก่สิงคโปร์ Boon Tong Kee",
            location_name: "ร้านข้าวมันไก่ชื่อดังสิงคโปร์",
            description: "ลิ้มลอง **ข้าวมันไก่ไหหลำสิงคโปร์** เนื้อไก่นุ่มฉ่ำ ข้าวมันหอมกรุ่น เสิร์ฟพร้อมน้ำจิ้มสูตรเด็ด"
          },
          {
            time_period: "บ่าย",
            activity_title: "สักการะขอพร วัดพระเขี้ยวแก้ว (Buddha Tooth Relic Temple) ย่านไชน่าทาวน์",
            location_name: "วัดพระเขี้ยวแก้ว & ไชน่าทาวน์ (Chinatown)",
            description: "นำท่านกราบสักการะพระบรมสารีริกธาตุ ณ **วัดพระเขี้ยวแก้ว** วัดสถาปัตยกรรมราชวงศ์ถังอันงดงาม และเดินเล่นชมย่านช็อปปิ้งไชน่าทาวน์",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ล่องเรือบัมโบ๊ท ชมวิวแม่น้ำสิงคโปร์ & ย่านแสงสียามค่ำคืน คลาร์กคีย์ (Clarke Quay)",
            location_name: "คลาร์กคีย์ (Clarke Quay)",
            description: "นั่งเรือ **Singapore River Cruise** ชมสถาปัตยกรรมตึกเก่าและตึกสูงระฟ้า และเพลิดเพลินกับบรรยากาศริมน้ำย่านคลาร์กคีย์",
            is_highlight: true
          }
        ]
      },
      {
        theme: "สิงคโปร์ - น้ำตก Jewel Changi - สนามบินชางงี - กรุงเทพฯ (สนามบินสุวรรณภูมิ)",
        activities: [
          {
            time_period: "10.00 น.",
            activity_title: "รับประทานอาหารเช้า & เช็คเอาท์โรงแรม",
            location_name: "โรงแรมที่พักในสิงคโปร์",
            description: "รับประทานอาหารเช้า ณ โรงแรมที่พัก จัดเก็บสัมภาระและเช็คเอาท์"
          },
          {
            time_period: "12.30 น.",
            activity_title: "ชมความมหัศจรรย์น้ำตกยักษ์ในร่ม Jewel Changi (Rain Vortex)",
            location_name: "Jewel Changi Airport (HSBC Rain Vortex)",
            description: "ชม **HSBC Rain Vortex** น้ำตกในร่มที่สูงที่สุดในโลก ณ ห้าง Jewel Changi พร้อมอิสระช้อปปิ้งของฝากแบรนด์ดังระดับโลก",
            is_highlight: true
          },
          {
            time_period: "17.30 น.",
            activity_title: "ออกเดินทางบินตรงกลับสู่กรุงเทพฯ",
            location_name: "สนามบินสุวรรณภูมิ (BKK)",
            description: "ออกเดินทางกลับกรุงเทพฯ โดยเที่ยวบิน **SQ714** ถึงสนามบินสุวรรณภูมิ เวลา 19.00 น. โดยสวัสดิภาพ"
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

function cleanMarkdownText(str: string): string {
  if (!str) return "";
  return str
    .replace(/^#+\s*/, "")
    .replace(/^(?:->|→|–|-|\*|•|\d+\.)\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

function detectTimePeriod(text: string, defaultPeriod: string = "เช้า"): string {
  const lower = text.toLowerCase();
  const hourMatch = lower.match(/(\d{1,2})[\.:](\d{2})/);
  if (hourMatch) {
    const hr = parseInt(hourMatch[1]);
    if (hr >= 0 && hr < 11) return "เช้า";
    if (hr >= 11 && hr < 14) return "กลางวัน";
    if (hr >= 14 && hr < 17) return "บ่าย";
    if (hr >= 17) return "เย็น";
  }
  if (lower.includes("เช้ามืด") || lower.includes("ช่วงเช้า") || lower.includes("เช้า") || lower.includes("morning")) return "เช้า";
  if (lower.includes("กลางวัน") || lower.includes("เที่ยง") || lower.includes("noon") || lower.includes("lunch")) return "กลางวัน";
  if (lower.includes("ช่วงบ่าย") || lower.includes("บ่าย") || lower.includes("afternoon")) return "บ่าย";
  if (lower.includes("ช่วงเย็น") || lower.includes("เย็น") || lower.includes("ค่ำ") || lower.includes("ดึก") || lower.includes("evening")) return "เย็น";
  return defaultPeriod;
}

function generateDescriptiveDetail(title: string, city: string): string {
  const t = title.toLowerCase();
  if (t.includes("ออกเดินทาง") && (t.includes("กรุงเทพ") || t.includes("สุวรรณภูมิ"))) {
    return `คณะพร้อมกัน ณ ท่าอากาศยานสุวรรณภูมิ ออกเดินทางสู่เมือง ${city} โดยสวัสดิภาพ`;
  }
  if (t.includes("ถึง") && (t.includes("สนามบิน") || t.includes(city.toLowerCase()) || t.includes("เฉิงตู") || t.includes("โตเกียว"))) {
    return `เดินทางถึงสนามบินปลายทาง ผ่านขั้นตอนการตรวจคนเข้าเมืองและรับสัมภาระ เจ้าหน้าที่และรถส่วนตัวรอต้อนรับนำท่านเดินทางเข้าสู่ที่พักเพื่อฝากสัมภาระและเตรียมพร้อมท่องเที่ยว`;
  }
  if (t.includes("เช็กเอาต์") || t.includes("เช็คเอาท์")) {
    return `รับประทานอาหารเช้า ณ โรงแรมที่พัก จากนั้นจัดเก็บสัมภาระและเช็คเอาต์เพื่อเตรียมตัวเดินทาง`;
  }
  if (t.includes("บินกลับ") || t.includes("เดินทางกลับกรุงเทพ") || t.includes("สนามบิน")) {
    return `นำท่านเดินทางสู่สนามบิน ดำเนินการเช็คอินสัมภาระและออกเดินทางบินตรงกลับสู่กรุงเทพฯ โดยสวัสดิภาพพร้อมความประทับใจตลอดการเดินทาง`;
  }
  if (t.includes("kuanzhai") || t.includes("ตรอกกว้าง") || t.includes("ถนนโบราณ")) {
    return `นำท่านเดินเล่นชม ตรอกกว้างตรอกแคบ (Kuanzhai Alley) ย่านถนนคนเดินโบราณสมัยราชวงศ์ชิง สัมผัสวัฒนธรรมโรงน้ำชา คาเฟ่เก๋ๆ และมุมถ่ายรูปสุดคลาสสิก`;
  }
  if (t.includes("bipenggou") || t.includes("ปี้เผิงโกว")) {
    return `นำท่านนั่งรถ Shuttle Bus เที่ยวชมอุทยานปี้เผิงโกว (Bipenggou) สัมผัสความงามของยอดเขาหิมะ ผืนป่าสน และทะเลสาบสีมรกต เช่น ทะเลสาบหลงหวังไห่ (Longwanghai) และซ่างไห่จื่อ (Shanghaizi)`;
  }
  if (t.includes("chunxi") || t.includes("taikoo") || t.includes("ifs") || t.includes("ช้อปปิ้ง")) {
    return `อิสระช้อปปิ้งย่านการค้าใจกลางเมือง ถ่ายรูปเช็คอินกับแลนด์มาร์กชื่อดัง และลิ้มลองสตรีทฟู้ดและร้านอาหารท้องถิ่นตามอัธยาศัย`;
  }
  return `นำท่านเที่ยวชมและสัมผัสบรรยากาศอันงดงาม ณ **${title}** ถ่ายภาพเป็นที่ระลึกและเพลิดเพลินกับไฮไลต์ประจำสถานที่`;
}

function isNewAttractionOrEvent(line: string): boolean {
  const c = cleanMarkdownText(line).toLowerCase();
  if (c.includes("alley") || c.includes("road") || c.includes("park") || c.includes("temple") || c.includes("monastery") || c.includes("bipenggou")) return true;
  if (c.includes("taikoo") || c.includes("ifs") || c.includes("chunxi") || c.includes("kuanzhai") || c.includes("longwanghai") || c.includes("ปี้เผิงโกว")) return true;
  if (c.includes("ออกเดินทาง") || c.includes("เดินทางถึง") || c.includes("บินกลับ") || c.includes("เช็กเอาต์") || c.includes("เช็คเอาท์")) return true;
  if (c.includes("ชมภูเขา") || c.includes("จุดหลัก") || c.includes("เดินเล่น") || c.includes("ท่องเที่ยว") || c.includes("ช้อปปิ้ง")) return true;
  return false;
}

export function parseCustomerNoteToItinerary(
  customerNote: string,
  mainCity: string,
  startDate: string,
  hotelLevel?: string
): Array<{
  day_number: number;
  date: string;
  daily_theme: string;
  hotel_name_suggestion: string;
  breakfast_included: boolean;
  lunch_included: boolean;
  dinner_included: boolean;
  activities: Array<{ time_period: string; activity_title: string; location_name: string; description: string; is_highlight: boolean }>;
}> | null {
  if (!customerNote || !customerNote.trim()) return null;
  const note = customerNote.trim();

  const thaiNumMap: Record<string, number> = {
    "แรก": 1, "หนึ่ง": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5, "หก": 6, "เจ็ด": 7, "แปด": 8, "เก้า": 9, "สิบ": 10
  };

  const dayHeaderRegex = /^(?:#+\s*)?(?:DAY|Day|วัน(?!จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|เสาร์|อาทิตย์)(?:ที่)?)\s*(\d+|แรก|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:[\s\:\-\—\|]*)(.*)$/gim;
  const rawMatches = [...note.matchAll(dayHeaderRegex)];
  if (rawMatches.length === 0) return null;

  const monthRegex = /มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม/i;
  const matches = rawMatches.filter(m => !( /\d+\s*[\-\—\–]\s*\d+/.test(m[0]) && monthRegex.test(m[0]) ));

  if (matches.length === 0) return null;

  const days: any[] = [];
  const defaultHotel = formatHotelByLevel(mainCity, hotelLevel);
  const startMs = new Date(startDate && !isNaN(new Date(startDate).getTime()) ? startDate : new Date().toISOString()).getTime();

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const numRaw = match[1];
    const dayNo = parseInt(numRaw) || thaiNumMap[numRaw] || (i + 1);

    const startIndex = match.index! + match[0].length;
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : note.length;
    const dayBody = note.slice(startIndex, endIndex).trim();

    let dayTitle = cleanMarkdownText(match[2] || "");
    dayTitle = dayTitle.replace(/^\d{1,2}\s*[ก-ฮ\.]+\s*(?:\||\—|\-)\s*/i, "").trim();

    const isFreeDay = /free\s*day|วันอิสระ/i.test(dayTitle);

    const lines = dayBody
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("---") && !l.startsWith("***") && !l.startsWith("___"));

    let breakfast = !isFreeDay && dayNo > 1;
    let lunch = !isFreeDay;
    let dinner = !isFreeDay;
    let hotelName = defaultHotel;

    const isMetaLine = (l: string) => {
      const c = cleanMarkdownText(l);
      return /^(?:ไม่มีรถทัวร์|ลูกค้าเที่ยวเอง|แนะนำสถานที่|ไม่รวมอาหาร|ไม่รวมค่าเดินทาง|ปัจจุบันบัตร|ราคาอ้างอิง|หมายเหตุ)/i.test(c);
    };

    const activities: any[] = [];

    if (isFreeDay) {
      const spots = lines
        .filter(l => !isMetaLine(l))
        .map(cleanMarkdownText)
        .filter(l => l.length > 1);

      activities.push({
        time_period: "เช้า",
        activity_title: "อิสระท่องเที่ยวเต็มวันตามอัธยาศัย (FREE DAY)",
        location_name: `ตัวเมือง ${mainCity}`,
        description: `เปิดประสบการณ์ท่องเที่ยวเมือง **${mainCity}** ตามอัธยาศัยอย่างอิสระ สัมผัสวิถีชีวิต วัฒนธรรมท้องถิ่น และจุดเช็คอินยอดนิยม (ไม่รวมค่าอาหารและค่าเดินทางในวันอิสระ)`,
        is_highlight: true
      });

      if (spots.length > 0) {
        const spotNames = spots.join(" • ");
        activities.push({
          time_period: "บ่าย / เย็น",
          activity_title: "แนะนำแลนด์มาร์กยอดนิยม & ย่านช้อปปิ้งสตรีทฟู้ด",
          location_name: spots.slice(0, 3).join(" & "),
          description: `สถานที่แนะนำสำหรับวันอิสระ: **${spotNames}** อิสระช้อปปิ้ง ชิมอาหารพื้นเมือง และถ่ายรูปมุมสวยตามอัธยาศัย`,
          is_highlight: true
        });
      }
    } else {
      const periods = ["เช้า", "กลางวัน", "บ่าย", "เย็น"];
      let periodIdx = 0;
      let currentAct: any = null;

      for (let j = 0; j < lines.length; j++) {
        const rawLine = lines[j];
        if (isMetaLine(rawLine)) continue;

        const clean = cleanMarkdownText(rawLine);
        if (!clean) continue;

        if (/^(?:ที่พัก|โรงแรม)\s*:/i.test(clean)) {
          const hVal = clean.replace(/^(?:ที่พัก|โรงแรม)\s*:\s*/i, "").trim();
          if (hVal) hotelName = hVal;
          continue;
        }
        if (/^อาหาร\s*:/i.test(clean)) {
          breakfast = clean.includes("เช้า");
          lunch = clean.includes("กลางวัน");
          dinner = clean.includes("เย็น");
          continue;
        }

        const timeMatch = rawLine.match(/(?:ประมาณ\s*)?(\d{1,2}[\.:]\d{2}(?:\s*[\–\-]\s*\d{1,2}[\.:]\d{2})?\s*(?:น\.|AM|PM)?)/i);
        const isBullet = /^(?:->|→|–|-|\*|•)/.test(rawLine);
        const isNewPOI = isNewAttractionOrEvent(rawLine);

        if (timeMatch) {
          // Check if previous activity was outbound/return flight and this is arrival time (e.g. 15:05 departed, 17:20 arrived)
          if (currentAct && (currentAct.activity_title.includes("บินกลับ") || currentAct.activity_title.includes("ออกเดินทาง")) && (clean.includes("ถึงกรุงเทพ") || clean.includes("ถึง"))) {
            currentAct.time_period = `${currentAct.time_period} - ${timeMatch[1].trim()}`;
            currentAct.description += ` ${clean}`;
            continue;
          }

          if (currentAct) activities.push(currentAct);
          const timeText = timeMatch[1].trim();
          let rest = cleanMarkdownText(rawLine.replace(timeMatch[0], "").replace(/^ประมาณ\s*/i, ""));
          const period = detectTimePeriod(timeText, periods[periodIdx % 4]);
          periodIdx++;

          currentAct = {
            time_period: timeText || period,
            activity_title: rest || `กิจกรรมช่วง ${period}`,
            location_name: rest.slice(0, 40) || mainCity,
            description: "",
            is_highlight: true
          };
        } else if (isNewPOI && !isBullet) {
          if (currentAct) activities.push(currentAct);
          const period = detectTimePeriod(clean, periods[periodIdx % 4]);
          periodIdx++;

          currentAct = {
            time_period: period,
            activity_title: clean,
            location_name: clean.slice(0, 40),
            description: "",
            is_highlight: true
          };
        } else if (isBullet && isNewPOI) {
          if (currentAct && (!currentAct.activity_title || currentAct.activity_title.includes("กิจกรรม") || currentAct.activity_title.includes("ถึง"))) {
            if (clean.includes("รับคณะ") || clean.includes("ฝากกระเป๋า") || clean.includes("เข้าที่พัก")) {
              currentAct.description = (currentAct.description ? currentAct.description + " " : "") + clean;
              continue;
            }
          }
          if (currentAct) activities.push(currentAct);
          const period = detectTimePeriod(clean, periods[periodIdx % 4]);
          periodIdx++;

          currentAct = {
            time_period: period,
            activity_title: clean,
            location_name: clean.slice(0, 40),
            description: "",
            is_highlight: true
          };
        } else {
          if (currentAct) {
            currentAct.description = (currentAct.description ? currentAct.description + " " : "") + clean;
          } else {
            const period = detectTimePeriod(clean, periods[periodIdx % 4]);
            periodIdx++;

            currentAct = {
              time_period: period,
              activity_title: clean,
              location_name: clean.slice(0, 40),
              description: "",
              is_highlight: true
            };
          }
        }
      }

      if (currentAct) activities.push(currentAct);

      // Enhance descriptions so they are never blank or duplicates
      for (const act of activities) {
        if (!act.description || act.description.trim() === act.activity_title.trim()) {
          act.description = generateDescriptiveDetail(act.activity_title, mainCity);
        } else {
          act.description = cleanMarkdownText(act.description);
          if (act.description.length < 30) {
            act.description = `นำท่านสู่ **${act.activity_title}** ${act.description}`;
          }
        }
      }
    }

    const dateStr = new Date(startMs + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    days.push({
      day_number: i + 1,
      date: dateStr,
      daily_theme: dayTitle || `ท่องเที่ยวเมือง ${mainCity} วันที่ ${i + 1}`,
      hotel_name_suggestion: hotelName,
      breakfast_included: breakfast,
      lunch_included: lunch,
      dinner_included: dinner,
      activities: activities.length > 0 ? activities : [
        {
          time_period: "ตลอดวัน",
          activity_title: dayTitle || `ท่องเที่ยวเมือง ${mainCity}`,
          location_name: mainCity,
          description: `นำท่านท่องเที่ยวไฮไลต์เมือง ${mainCity}`,
          is_highlight: true
        }
      ]
    });
  }

  return days.length > 0 ? days : null;
}

export function buildFallbackPlan(
  mainCity: string,
  country: string,
  duration: number,
  startDate: string,
  hotelLevel?: string,
  customerNote?: string,
  customerName?: string
): AIPlan {
  const standardTitle = formatTourPlanTitle({
    city: mainCity,
    country: country,
    startDate: startDate,
    duration: duration,
    customerName: customerName,
  });

  if (customerNote) {
    const parsedDays = parseCustomerNoteToItinerary(customerNote, mainCity, startDate, hotelLevel);
    if (parsedDays && parsedDays.length > 0) {
      return {
        tour_name: standardTitle,
        summary: `โปรแกรมท่องเที่ยว เมือง ${mainCity} (${country}) จำนวน ${parsedDays.length} วัน`,
        airline: "China Eastern Airlines / Thai Airways",
        flight_route: `BKK - ${mainCity} - BKK`,
        outbound_flight: `ออกเดินทางจากกรุงเทพฯ สู่ ${mainCity}`,
        return_flight: `ออกเดินทางจาก ${mainCity} กลับสู่กรุงเทพฯ`,
        itinerary: parsedDays
      };
    }
  }

  const cityInput = (mainCity || country || "").toLowerCase();
  
  const matchKey = Object.keys(DESTINATION_DATA).find(k => 
    cityInput.includes(k) || 
    (k === "kunming" && (cityInput.includes("คุนหมิง") || cityInput.includes("คุณหมิง") || cityInput.includes("ลี่เจียง") || cityInput.includes("kunming"))) ||
    (k === "chengdu" && (cityInput.includes("เฉิงตู") || cityInput.includes("ฉงชิ่ง") || cityInput.includes("chengdu"))) ||
    (k === "beijing" && (cityInput.includes("ปักกิ่ง") || cityInput.includes("beijing") || cityInput.includes("peking"))) ||
    (k === "guangzhou" && (cityInput.includes("กวางโจว") || cityInput.includes("guangzhou") || cityInput.includes("กวางเจา"))) ||
    (k === "seoul" && (cityInput.includes("โซล") || cityInput.includes("เกาหลี") || cityInput.includes("seoul") || cityInput.includes("korea"))) ||
    (k === "singapore" && (cityInput.includes("สิงคโปร์") || cityInput.includes("singapore"))) ||
    (k === "macao" && (cityInput.includes("มาเก๊า") || cityInput.includes("ฮ่องกง") || cityInput.includes("macau") || cityInput.includes("macao") || cityInput.includes("hong kong"))) ||
    (k === "shenzhen" && (cityInput.includes("เซินเจิ้น") || cityInput.includes("shenzhen"))) ||
    (k === "tokyo" && (cityInput.includes("โตเกียว") || cityInput.includes("ญี่ปุ่น") || cityInput.includes("tokyo") || cityInput.includes("japan") || cityInput.includes("โอซาก้า") || cityInput.includes("osaka")))
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
      tour_name: standardTitle,
      summary: `โปรแกรมท่องเที่ยวสัมผัสแลนด์มาร์กใหม่ เมือง ${mainCity} ${totalDays} วัน`,
      airline: preset.airline,
      flight_route: preset.flightRoute,
      outbound_flight: preset.outboundFlight,
      return_flight: preset.returnFlight,
      itinerary
    };
  }

  // General dynamic fallback for other destinations (strictly real structured content without placeholders)
  const city = mainCity || "เมืองท่องเที่ยว";
  const cntry = country || "";
  const totalDays = Math.max(2, duration);

  const itinerary = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000);
    const dayNo = i + 1;

    if (dayNo === 1) {
      return {
        day_number: 1,
        date: date.toISOString().split("T")[0],
        daily_theme: `กรุงเทพฯ (สนามบินสุวรรณภูมิ) - เดินทางถึง ${city} - เช็คอินเข้าสู่โรงแรมที่พัก`,
        hotel_name_suggestion: selectedHotel,
        breakfast_included: false,
        lunch_included: true,
        dinner_included: true,
        activities: [
          {
            time_period: "เช้า / บ่าย",
            activity_title: `พร้อมกัน ณ สนามบินสุวรรณภูมิ - เดินทางสู่ ${city}`,
            location_name: `สนามบินสุวรรณภูมิ - สนามบิน ${city}`,
            description: `คณะพร้อมกัน ณ **สนามบินสุวรรณภูมิ** อาคารผู้โดยสารขาออก เช็คอินเคาน์เตอร์สายการบินและออกเดินทางสู่ **เมือง ${city}**`
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
        hotel_name_suggestion: selectedHotel,
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
            description: `เดินทางถึงสนามบิน เช็คอินสัมภาระและออกเดินทางกลับกรุงเทพฯ (สุวรรณภูมิ) โดยสวัสดิภาพพร้อมความประทับใจตลอดการเดินทาง`
          }
        ]
      };
    } else {
      const themes = [
        {
          themeTitle: `${city} - ชมสถาปัตยกรรมและวัฒนธรรมเมืองเก่า - ย่านถนนคนเดินโบราณ`,
          act1: { time: "เช้า", title: `สักการะสิ่งศักดิ์สิทธิ์และชมสถาปัตยกรรมสำคัญเมือง ${city}`, loc: `วัดและโบราณสถานสำคัญเมือง ${city}`, desc: `นำท่านสัมผัสประวัติศาสตร์และวัฒนธรรมอันทรงคุณค่า ชมสถาปัตยกรรมดั้งเดิมอันงดงามและสักการะสิ่งศักดิ์สิทธิ์ประจำเมือง **${city}**` },
          act2: { time: "กลางวัน", title: `รับประทานอาหารกลางวัน เมนูอาหารพื้นเมืองต้นตำรับ`, loc: `ภัตตาคารอาหารพื้นเมือง ${city}`, desc: `ลิ้มลองเมนูเด็ดขึ้นชื่อรสชาติต้นตำรับที่คัดสรรวัตถุดิบท้องถิ่นสดใหม่ ณ ร้านอาหารชื่อดังของเมือง **${city}**` },
          act3: { time: "บ่าย", title: `เดินเล่นชมย่านเมืองเก่าและตึกสถาปัตยกรรมประวัติศาสตร์`, loc: `ย่านเมืองเก่า ${city}`, desc: `สัมผัสวิถีชีวิตดั้งเดิม เดินชมอาคารบ้านเรือนโบราณที่อนุรักษ์ไว้อย่างสมบูรณ์ พร้อมถ่ายภาพมุมสวยเป็นที่ระลึก` },
          act4: { time: "เย็น", title: `ช้อปปิ้งตลาดไนท์มาร์เก็ตและลิ้มลองสตรีทฟู้ดยอดฮิต`, loc: `ถนนคนเดินและตลาดกลางคืน ${city}`, desc: `เพลิดเพลินกับบรรยากาศยามค่ำคืน อิสระเลือกซื้อสินค้าของฝาก ขนมพื้นเมือง และสตรีทฟู้ดเลิศรส` }
        },
        {
          themeTitle: `${city} - สัมผัสทัศนียภาพธรรมชาติ - จุดชมวิวมุมสูงพานอรามา - ช้อปปิ้งย่านการค้า`,
          act1: { time: "เช้า", title: `ชมทัศนียภาพสวนธรรมชาติและทิวทัศน์อันร่มรื่นเมือง ${city}`, loc: `สวนสาธารณะและอุทยานธรรมชาติ ${city}`, desc: `นำท่านสู่อุทยานธรรมชาติใจกลางเมือง สัมผัสอากาศบริสุทธิ์และทัศนียภาพพื้นที่สีเขียวอันงดงาม ถ่ายภาพคู่กับแลนด์มาร์กธรรมชาติ` },
          act2: { time: "กลางวัน", title: `รับประทานอาหารกลางวัน เซ็ตเมนูพิเศษประจำภูมิภาค`, loc: `ภัตตาคารท้องถิ่น ${city}`, desc: `รับประทานอาหารกลางวันรสเลิศ พร้อมชมบรรยากาศสบายๆ ของเมือง **${city}**` },
          act3: { time: "บ่าย", title: `ขึ้นชมทัศนียภาพพานอรามา ณ จุดชมวิวแลนด์มาร์กสำคัญ`, loc: `จุดชมวิวทัศนียภาพ ${city}`, desc: `ชมทัศนียภาพมุมสูงแบบกว้างไกลสุดสายตา บันทึกภาพมุมมองรอบทิศทางของเมือง **${city}**` },
          act4: { time: "เย็น", title: `อิสระช้อปปิ้งสินค้าแฟชั่นและของที่ระลึก ณ ย่านการค้าชื่อดัง`, loc: `ย่านการค้าและศูนย์การค้า ${city}`, desc: `เพลิดเพลินกับการเลือกซื้อของฝาก สินค้าหัตถกรรมพื้นบ้าน และแบรนด์สินค้าแฟชั่นยอดนิยม` }
        }
      ];

      const chosenTheme = themes[(dayNo - 2) % themes.length];

      return {
        day_number: dayNo,
        date: date.toISOString().split("T")[0],
        daily_theme: chosenTheme.themeTitle,
        hotel_name_suggestion: selectedHotel,
        breakfast_included: true,
        lunch_included: true,
        dinner_included: true,
        activities: [
          { time_period: chosenTheme.act1.time, activity_title: chosenTheme.act1.title, location_name: chosenTheme.act1.loc, description: chosenTheme.act1.desc, is_highlight: true },
          { time_period: chosenTheme.act2.time, activity_title: chosenTheme.act2.title, location_name: chosenTheme.act2.loc, description: chosenTheme.act2.desc, is_highlight: false },
          { time_period: chosenTheme.act3.time, activity_title: chosenTheme.act3.title, location_name: chosenTheme.act3.loc, description: chosenTheme.act3.desc, is_highlight: true },
          { time_period: chosenTheme.act4.time, activity_title: chosenTheme.act4.title, location_name: chosenTheme.act4.loc, description: chosenTheme.act4.desc, is_highlight: true }
        ]
      };
    }
  });

  return {
    tour_name: standardTitle,
    summary: `แพลนท่องเที่ยวเมือง ${city} (${cntry}) ระยะเวลา ${totalDays} วัน`,
    airline: `สายการบินบินตรงสู่ ${city}`,
    flight_route: `BKK - ${city} - BKK`,
    outbound_flight: `ออกเดินทางจากสนามบินสุวรรณภูมิ สู่สนามบิน ${city}`,
    return_flight: `ออกเดินทางจากสนามบิน ${city} กลับถึงสนามบินสุวรรณภูมิ`,
    itinerary,
  };
}
