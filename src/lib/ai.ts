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
const DESTINATION_DATA: Record<string, {
  tourName: string;
  hotel: string;
  days: Array<{
    theme: string;
    activities: Array<{ time_period: string; activity_title: string; location_name: string; description: string; is_highlight?: boolean }>;
  }>;
}> = {
  macao: {
    tourName: "ไฮไลต์ มาเก๊า - ฮ่องกง ไหว้พระขอพร 3 วัน 2 คืน",
    hotel: "The Kowloon Hotel หรือเทียบเท่า 4 ดาว",
    days: [
      {
        theme: "กรุงเทพฯ (สนามบินสุวรรณภูมิ) - ฮ่องกง - ข้ามสะพานมาเก๊า HZMB - โบสถ์เซนต์พอล - เซนาโด้สแควร์ - วัดอาม่า - เจ้าแม่กวนอิมริมทะเล",
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
            description: "เดินทางถึงสนามบินฮ่องกง นำท่านข้ามสะพาน **HZMB (Hong Kong-Zhuhai-Macao Bridge)** สะพานข้ามทะเลยาวที่สุดในโลกสู่เขตบริหารพิเศษมาเก๊า"
          },
          {
            time_period: "เช้า",
            activity_title: "ชมซากโบสถ์เซนต์พอล (Ruins of St. Paul's)",
            location_name: "โบสถ์เซนต์พอล (Ruins of St. Paul's)",
            description: "นำท่านถ่ายภาพ **โบสถ์เซนต์พอล (Ruins of St. Paul's)** หรือที่ชาวมาเก๊าเรียกว่า 'ต้าซานปา' ซากโบสถ์คริสต์สถาปัตยกรรมตะวันตกผสมผสานสัญลักษณ์ศาสนาพุทธ แลนด์มาร์กอันดับหนึ่งของมาเก๊า",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "เดินเล่นจัตุรัสเซนาโด้สแควร์ (Senado Square)",
            location_name: "เซนาโด้สแควร์ (Senado Square)",
            description: "นำท่านสู่ **เซนาโด้สแควร์ (Senado Square)** จัตุรัสใจกลางเมืองมาเก๊าที่ล้อมรอบด้วยอาคารทรงโคโลเนียลสไตล์ยุโรป มรดกโลก UNESCO ลิ้มลองทาร์ตไข่มาเก๊าแท้ๆ",
            is_highlight: true
          },
          {
            time_period: "บ่าย",
            activity_title: "ไหว้พระขอพร วัดอาม่า (A-Ma Temple)",
            location_name: "วัดอาม่า (A-Ma Temple)",
            description: "นำท่านกราบไหว้ขอพร ณ **วัดอาม่า (A-Ma Temple)** หนึ่งในวัดศักดิ์สิทธิ์และเก่าแก่ที่สุดของมาเก๊า ขอพรเรื่องการงาน การเงิน และความเป็นสิริมงคล",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "กราบองค์เจ้าแม่กวนอิมริมทะเล",
            location_name: "เจ้าแม่กวนอิมริมทะเล (Kun Iam Statue)",
            description: "นำท่านถ่ายรูปกับ **เจ้าแม่กวนอิมริมทะเล (Kun Iam Statue)** องค์พระทองสัมฤทธิ์ประดิษฐานบนบัวทองคำริมอ่าวมาเก๊า",
            is_highlight: true
          }
        ]
      },
      {
        theme: "หาดรีพัลส์เบย์ - วัดเจ้าแม่กวนอิมอ่องฮ่ำ - วัดแชกงหมิว - วัดหวังต้าเซียน",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ขอพรหาดรีพัลส์เบย์ & เจ้าแม่กวนอิมอ่องฮ่ำ",
            location_name: "อ่าวรีพัลส์เบย์ (Repulse Bay)",
            description: "นำท่านสู่ **อ่าวรีพัลส์เบย์ (Repulse Bay)** อธิษฐานขอพร **เจ้าแม่กวนอิมอ่องฮ่ำ** ข้ามสะพานสีแดงต่ออายุ และโยนเหรียญเข้าปากปลาโชคลาภ",
            is_highlight: true
          },
          {
            time_period: "กลางวัน",
            activity_title: "หมุนกังหันนำโชค วัดแชกงหมิว",
            location_name: "วัดแชกงหมิว (Che Kung Temple)",
            description: "นำท่านไหว้พระขอพร **วัดแชกงหมิว (วัดกังหันนำโชค)** หมุนกังหันพัดพาโชคลาภ ขจัดสิ่งอัปมงคล และนำพาความสุขความเจริญ",
            is_highlight: true
          },
          {
            time_period: "บ่าย",
            activity_title: "ผูกด้ายแดงขอพรความรัก วัดหวังต้าเซียน",
            location_name: "วัดหวังต้าเซียน (Wong Tai Sin Temple)",
            description: "นำท่านสักการะ **วัดหวังต้าเซียน** วัดชื่อดังที่มีชื่อเสียงด้านการผูกด้ายแดงขอพรเรื่องความรัก และการเสี่ยงเซียมซีที่แม่นยำที่สุดในฮ่องกง",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "อิสระช้อปปิ้ง ย่านจิมซาจุ่ย",
            location_name: "ถนนคนเดินจิมซาจุ่ย (Tsim Sha Tsui)",
            description: "เพลิดเพลินกับการช้อปปิ้งย่าน **จิมซาจุ่ย (Tsim Sha Tsui)** ชมวิวเส้นขอบฟ้าและอ่าววิกตอเรีย (Victoria Harbour)"
          }
        ]
      },
      {
        theme: "อิสระช้อปปิ้ง Citygate Outlets - สนามบินฮ่องกง - กรุงเทพฯ (สุวรรณภูมิ)",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ช้อปปิ้งแบรนด์เนม Citygate Outlets",
            location_name: "ห้างซิตี้เกท เอาท์เล็ท (Citygate Outlets)",
            description: "เช็คเอาท์จากโรงแรม นำท่านสู่ **Citygate Outlets** ห้างเอาท์เล็ทขนาดใหญ่ใกล้สนามบิน เลือกซื้อสินค้าแบรนด์เนมชั้นนำในราคาสุดพิเศษ"
          },
          {
            time_period: "22.15 น.",
            activity_title: "เดินทางกลับประเทศไทย (สุวรรณภูมิ)",
            location_name: "สนามบินฮ่องกง - สนามบินสุวรรณภูมิ",
            description: "เดินทางสู่สนามบินฮ่องกง เช็คอินเดินทางกลับกรุงเทพฯ โดยสายการบิน **Greater Bay Airlines (HB295)** ถึงสนามบินสุวรรณภูมิเวลา 00.15 น.+1 โดยสวัสดิภาพ"
          }
        ]
      }
    ]
  },
  tokyo: {
    tourName: "มหัศจรรย์ โตเกียว ฟูจิ คาวากูจิโกะ 5 วัน 3 คืน",
    hotel: "Shinagawa Prince Hotel หรือเทียบเท่า 4 ดาว",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - โตเกียว (สนามบินนาริตะ) - วัดเซ็นโซจิ อาซากุสะ - ย่านชินจูกุ",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "เดินทางถึง เมืองโตเกียว ประเทศญี่ปุ่น",
            location_name: "สนามบินนานาชาตินาริตะ",
            description: "เดินทางถึง **สนามบินนาริตะ โตเกียว** ผ่านพิธีการตรวจคนเข้าเมืองและต้อนรับโดยทีมงาน"
          },
          {
            time_period: "บ่าย",
            activity_title: "ชมวัดเซ็นโซจิ อาซากุสะ (Sensoji Temple)",
            location_name: "วัดอาซากุสะ - ถนนนากามิเสะ",
            description: "นำท่านชม **วัดเซ็นโซจิ (Sensoji Temple)** หรือวัดอาซากุสะ ถ่ายภาพกับโคมแดงยักษ์ ถนนช้อปปิ้งนากามิเสะ ซื้อของฝากและขนมญี่ปุ่นโบราณ",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "ช้อปปิ้งย่านชินจูกุ (Shinjuku)",
            location_name: "ย่านชินจูกุ โตเกียว",
            description: "อิสระช้อปปิ้ง **ย่านชินจูกุ (Shinjuku)** ถ่ายภาพกับจอ 3D แมวยักษ์ ช้อปปิ้งเครื่องสำอางและสินค้าแฟชั่นชั้นนำ",
            is_highlight: true
          }
        ]
      }
    ]
  },
  chengdu: {
    tourName: "มรดกโลก เฉิงตู หมีแพนด้า ถนนโบราณจิ๋นหลี่ 4 วัน 3 คืน",
    hotel: "Chengdu Holiday Inn Express หรือเทียบเท่า 4 ดาว",
    days: [
      {
        theme: "กรุงเทพฯ (สุวรรณภูมิ) - เฉิงตู - ศูนย์อนุรักษ์หมีแพนด้า - ถนนโบราณจิ๋นหลี่",
        activities: [
          {
            time_period: "เช้า",
            activity_title: "ชมความน่ารัก ณ ศูนย์อนุรักษ์หมีแพนด้าเฉิงตู",
            location_name: "ศูนย์อนุรักษ์หมีแพนด้าเฉิงตู (Chengdu Panda Base)",
            description: "นำท่านเยี่ยมชม **ศูนย์อนุรักษ์หมีแพนด้าเฉิงตู** ชมความน่ารักของหมีแพนด้ายักษ์และแพนด้าแดงในป่าไผ่ธรรมชาติ",
            is_highlight: true
          },
          {
            time_period: "เย็น",
            activity_title: "เดินเที่ยวถนนโบราณจิ๋นหลี่ (Jinli Ancient Street)",
            location_name: "ถนนโบราณจิ๋นหลี่",
            description: "สัมผัสบรรยากาศย่านเมืองเก่าสามก๊ก **ถนนโบราณจิ๋นหลี่** ชมโคมไฟสไตล์โบราณ ชิมหมาล่าเสียบไม้ และของกินพื้นเมืองเสฉวน",
            is_highlight: true
          }
        ]
      }
    ]
  }
};

export function buildFallbackPlan(
  mainCity: string,
  country: string,
  duration: number,
  startDate: string
): AIPlan {
  const city = mainCity || "ไฮไลต์";
  const cntry = country || "";
  const destName = cntry ? `${city} (${cntry})` : city;

  const itinerary = Array.from({ length: duration }, (_, i) => {
    const date = new Date(
      new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000
    );
    const dayNo = i + 1;

    let dailyTheme = `เดินทางสู่เมือง ${city} - เที่ยวชมแลนด์มาร์กสำคัญประจำวัน`;
    if (dayNo === 1) {
      dailyTheme = `กรุงเทพฯ (สนามบินสุวรรณภูมิ) - ออกเดินทางสู่ ${city} - เช็คอินแลนด์มาร์กแรก`;
    } else if (dayNo === duration) {
      dailyTheme = `เก็บตกย่านช้อปปิ้งเมือง ${city} - เดินทางกลับกรุงเทพฯ (สนามบินสุวรรณภูมิ)`;
    }

    return {
      day_number: dayNo,
      date: date.toISOString().split("T")[0],
      daily_theme: dailyTheme,
      hotel_name_suggestion: `โรงแรมระดับมาตรฐานในเมือง ${city} หรือเทียบเท่า`,
      breakfast_included: dayNo > 1,
      lunch_included: true,
      dinner_included: dayNo < duration,
      activities: [
        {
          time_period: dayNo === 1 ? "เช้า / บ่าย" : "เช้า",
          activity_title: `เที่ยวชมแลนด์มาร์กและสถานที่สำคัญในเมือง ${city}`,
          location_name: `แลนด์มาร์กไฮไลต์ ${city}`,
          description: `นำท่านเดินทางสู่ **สถานที่ท่องเที่ยวสำคัญประจำเมือง ${city}** ถ่ายภาพเช็คอินจุดไฮไลต์ยอดนิยม`,
          is_highlight: true
        },
        {
          time_period: "กลางวัน",
          activity_title: `รับประทานอาหารกลางวัน เมนูท้องถิ่น ${city}`,
          location_name: `ร้านอาหารขึ้นชื่อเมือง ${city}`,
          description: `ลิ้มลองอาหารรสเลิศและเมนูท้องถิ่นขึ้นชื่อในย่าน **เมือง ${city}**`
        },
        {
          time_period: "บ่าย / เย็น",
          activity_title: `อิสระเดินเล่นย่านวัฒนธรรมและช้อปปิ้ง ${city}`,
          location_name: `ย่านการค้าเมือง ${city}`,
          description: `นำท่านสู่ **ย่านการค้าและถนนคนเดินเมือง ${city}** เลือกซื้อของฝาก สินค้าพื้นเมือง และพักผ่อนตามอัธยาศัย`,
          is_highlight: true
        }
      ]
    };
  });

  return {
    tour_name: `โปรแกรมท่องเที่ยว ${destName} ${duration} วัน ${Math.max(1, duration - 1)} คืน`,
    summary: `แพลนท่องเที่ยวสัมผัสไฮไลต์แลนด์มาร์กสำคัญเมือง ${city} ระยะเวลา ${duration} วัน`,
    airline: "สายการบินชั้นนำ (Standard Airlines)",
    flight_route: `BKK - ${city} - BKK`,
    outbound_flight: "ออกเดินทางจากสุวรรณภูมิ (เวลาตามรอบเที่ยวบิน)",
    return_flight: "เดินทางกลับถึงสุวรรณภูมิ โดยสวัสดิภาพ",
    itinerary,
  };
}
