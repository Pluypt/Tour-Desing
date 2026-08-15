import { estimateMarketPrice } from "./pricing";

export type TripComPackageBenchmark = {
  id: string;
  title: string;
  durationDays: number;
  durationNights: number;
  hotelLevel: string;
  estimatedPricePerPerson: number;
  tripType: string;
  highlights: string[];
  tripComUrl: string;
  priceDiffPercentage: number; // Comparison vs current plan selling price
  competitiveStatus: "Cheaper" | "Competitive" | "Premium";
};

export type TripComBenchmarkResult = {
  destinationName: string;
  city: string;
  country: string;
  targetDurationDays: number;
  targetHotelLevel: string;
  currentPlanPricePerPerson: number;
  marketPriceRange: {
    minPrice: number;
    avgPrice: number;
    maxPrice: number;
  };
  tripComSearchUrl: string;
  packages: TripComPackageBenchmark[];
  marketAnalysisSummary: string;
};

/**
 * Generate benchmark tour package comparison data based on Trip.com market standards.
 */
export function getTripComBenchmark(params: {
  city: string;
  country: string;
  durationDays: number;
  hotelLevel?: string;
  currentSellingPrice?: number;
  travelerCount?: number;
}): TripComBenchmarkResult {
  const city = params.city || "คุนหมิง";
  const country = params.country || "จีน";
  const duration = Math.max(2, params.durationDays || 4);
  const nights = duration - 1;
  const hotelLevel = params.hotelLevel || "4 ดาว";
  const pax = Math.max(1, params.travelerCount || 2);
  const destCombined = `${city} ${country}`.trim();

  // Baseline estimate for exact duration
  const baseEstimate = estimateMarketPrice({
    city,
    country,
    duration,
    hotelLevel,
    travelerCount: pax,
    tripType: "Private Tour"
  });

  const currentPrice = params.currentSellingPrice && params.currentSellingPrice > 0 
    ? params.currentSellingPrice 
    : baseEstimate.sellingPricePerPerson;

  // Build Trip.com Search Link
  const keyword = encodeURIComponent(`${city} ${duration}วัน ${nights}คืน`);
  const tripComSearchUrl = `https://th.trip.com/tours/search?keyword=${keyword}`;

  // Generate comparison packages for Duration - 1, Exact Duration, and Duration + 1
  const durationsToCompare = [
    Math.max(2, duration - 1),
    duration,
    duration + 1
  ];

  const packages: TripComPackageBenchmark[] = durationsToCompare.map((d, idx) => {
    const dNights = d - 1;
    const est = estimateMarketPrice({
      city,
      country,
      duration: d,
      hotelLevel,
      travelerCount: pax,
      tripType: idx === 1 ? "Private Tour" : (idx === 0 ? "Join Tour Group" : "VIP Custom Tour")
    });

    let title = "";
    let highlights: string[] = [];
    const destLower = destCombined.toLowerCase();

    if (destLower.includes("คุนหมิง") || destLower.includes("kunming")) {
      if (d <= 3) {
        title = `ทัวร์คุนหมิง ป่าหิน ม้าทองไก่หยก ${d} วัน ${dNights} คืน (Trip.com Best Value)`;
        highlights = ["อุทยานป่าหินมรดกโลก", "ซุ้มประตูม้าทองไก่หยก", "ถนนคนเดินหนานผิง"];
      } else if (d === 4) {
        title = `ทัวร์คุนหมิง ลี่เจียง ทะเลสาบเตียนฉือ ${d} วัน ${dNights} คืน (Trip.com Popular)`;
        highlights = ["อุทยานป่าหิน", "วัดหยวนทง", "ตลาดดอกไม้โต่วหนาน", "เช็คอินคาเฟ่ยอดฮิต"];
      } else {
        title = `ทัวร์คุนหมิง ลี่เจียง แชงกรีล่า ภูเขาหิมะมังกรหยก ${d} วัน ${dNights} คืน (Trip.com Premium)`;
        highlights = ["ภูเขาหิมะมังกรหยก", "หุบเขาพระจันทร์สีน้ำเงิน", "เมืองโบราณลี่เจียง", "วัดซงจ้านหลิน"];
      }
    } else if (destLower.includes("เฉิงตู") || destLower.includes("chengdu")) {
      if (d <= 3) {
        title = `ทัวร์เฉิงตู หมีแพนด้า ถนนคนเดินจิ๋นหลี่ ${d} วัน ${dNights} คืน (Trip.com Starter)`;
        highlights = ["ศูนย์อนุรักษ์หมีแพนด้า", "ถนนคนเดินจิ๋นหลี่", "เช็คอินหมีแพนด้ายักษ์ IFS"];
      } else if (d === 4) {
        title = `ทัวร์เฉิงตู จิ่วจ้ายโกว ภูเขาหิมะต๋ากู่ปิ๋งชวน ${d} วัน ${dNights} คืน (Trip.com Best Seller)`;
        highlights = ["อุทยานจิ่วจ้ายโกว", "ภูเขาหิมะต๋ากู่ปิ๋งชวน", "สุกี้หม่าล่าเฉิงตู"];
      } else {
        title = `ทัวร์เฉิงตู จิ่วจ้ายโกว หวงหลง พระใหญ่เล่อซาน ${d} วัน ${dNights} คืน (Trip.com Full Route)`;
        highlights = ["จิ่วจ้ายโกว", "อุทยานหวงหลง", "พระใหญ่เล่อซาน", "ชมโชว์เปลี่ยนหน้ากาก"];
      }
    } else if (destLower.includes("มาเก๊า") || destLower.includes("macao") || destLower.includes("ฮ่องกง")) {
      title = `ทัวร์มาเก๊า ฮ่องกง เวเนเชี่ยน วัดแชกงหมิว ${d} วัน ${dNights} คืน (Trip.com Top Choice)`;
      highlights = ["ซากประตูโบสถ์เซนต์พอล", "เดอะเวเนเชี่ยน มาเก๊า", "วัดแชกงหมิว", "นั่งกระเช้านองปิง 360"];
    } else if (destLower.includes("โตเกียว") || destLower.includes("tokyo") || destLower.includes("ญี่ปุ่น")) {
      title = `ทัวร์โตเกียว ฟูจิ คาวากูจิโกะ ชิบุย่า ${d} วัน ${dNights} คืน (Trip.com Japan Choice)`;
      highlights = ["ภูเขาไฟฟูจิ", "หมู่บ้านโอชิโนะฮัคไค", "ย่านชิบุย่า & ชินจูกุ", "วัดอาซากุสะ"];
    } else {
      title = `ทัวร์ ${city} (${country}) ไฮไลต์สุดพรีเมียม ${d} วัน ${dNights} คืน (Trip.com Recommended)`;
      highlights = [`แลนด์มาร์กสำคัญประจำเมือง ${city}`, `โรงแรมระดับ ${hotelLevel}`, "อาหารพื้นเมืองขึ้นชื่อ"];
    }

    const estPrice = est.sellingPricePerPerson;
    const diffPercent = Math.round(((currentPrice - estPrice) / estPrice) * 100);

    let status: "Cheaper" | "Competitive" | "Premium" = "Competitive";
    if (diffPercent < -8) {
      status = "Cheaper";
    } else if (diffPercent > 12) {
      status = "Premium";
    }

    return {
      id: `tripcom-benchmark-${d}`,
      title,
      durationDays: d,
      durationNights: dNights,
      hotelLevel,
      estimatedPricePerPerson: estPrice,
      tripType: idx === 1 ? "Private Tour (ตรงกับแพลนนี้)" : (idx === 0 ? "Join Tour Group" : "VIP Custom Tour"),
      highlights,
      tripComUrl: `https://th.trip.com/tours/search?keyword=${encodeURIComponent(`${city} ${d}วัน`)}`,
      priceDiffPercentage: diffPercent,
      competitiveStatus: status
    };
  });

  const matchingPackage = packages[1] || packages[0];
  const minPrice = Math.min(...packages.map(p => p.estimatedPricePerPerson));
  const maxPrice = Math.max(...packages.map(p => p.estimatedPricePerPerson));
  const avgPrice = matchingPackage.estimatedPricePerPerson;

  let summary = "";
  if (currentPrice < avgPrice) {
    summary = `ราคาเสนอขายของคุณ (${currentPrice.toLocaleString()} บาท) มีความคุ้มค่าและถูกกว่าราคาเฉลี่ยตลาด Trip.com สำหรับทัวร์ ${duration} วัน อยู่ประมาณ ${Math.abs(matchingPackage.priceDiffPercentage)}% ช่วยสร้างจุดเด่นในการปิดการขายได้ง่าย`;
  } else if (currentPrice > avgPrice) {
    summary = `ราคาเสนอขายของคุณ (${currentPrice.toLocaleString()} บาท) เป็นราคาระดับพรีเมียม สูงกว่าราคาเฉลี่ยทั่วไปของ Trip.com ประมาณ ${matchingPackage.priceDiffPercentage}% เหมาะสำหรับขายทริปแบบ VIP Private Tour ที่มีบริการพิเศษเฉพาะกลุ่ม`;
  } else {
    summary = `ราคาเสนอขายของคุณ (${currentPrice.toLocaleString()} บาท) อยู่ในเกณฑ์มาตรฐานของตลาด Trip.com สำหรับทัวร์ ${duration} วัน และโรงแรมระดับ ${hotelLevel}`;
  }

  return {
    destinationName: destCombined,
    city,
    country,
    targetDurationDays: duration,
    targetHotelLevel: hotelLevel,
    currentPlanPricePerPerson: currentPrice,
    marketPriceRange: {
      minPrice,
      avgPrice,
      maxPrice
    },
    tripComSearchUrl,
    packages,
    marketAnalysisSummary: summary
  };
}
