const THAI_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

/**
 * Formats date range into concise Thai travel standard.
 * e.g. "1-3 พ.ย. 2569", "30 ต.ค. - 3 พ.ย. 2569", "1 พ.ย. 2569"
 */
export function formatTravelDateRange(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  duration?: number | null
): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return "";

  let startYear = start.getFullYear();
  if (startYear < 2500) startYear += 543;

  let end: Date | null = null;
  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (!isNaN(parsedEnd.getTime())) end = parsedEnd;
  }
  if (!end && duration && duration > 1) {
    end = new Date(start.getTime() + (duration - 1) * 24 * 60 * 60 * 1000);
  }

  const startDay = start.getDate();
  const startMonth = THAI_MONTH_SHORT[start.getMonth()];

  if (!end) {
    return `${startDay} ${startMonth} ${startYear}`;
  }

  let endYear = end.getFullYear();
  if (endYear < 2500) endYear += 543;
  const endDay = end.getDate();
  const endMonth = THAI_MONTH_SHORT[end.getMonth()];

  if (startYear === endYear && start.getMonth() === end.getMonth()) {
    if (startDay === endDay) {
      return `${startDay} ${startMonth} ${startYear}`;
    }
    return `${startDay}-${endDay} ${startMonth} ${startYear}`;
  } else if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  } else {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }
}

/**
 * Standard Tour Plan Title Formatter:
 * Formula: ชื่อเมือง+(ประเทศ)+วันที่เดินทาง+ชื่อลูกค้า
 * Example: โตเกียว (ญี่ปุ่น) 1-3 พ.ย. 2569 คุณชล
 */
export function formatTourPlanTitle(params: {
  city?: string | null;
  country?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  duration?: number | null;
  customerName?: string | null;
}): string {
  let city = (params.city || "").trim();
  let country = (params.country || "").trim();
  let customerName = (params.customerName || "").trim();

  // Clean city from previous prefixes or suffixes if any
  city = city.replace(/^โปรแกรมท่องเที่ยว\s*/i, "")
             .replace(/^มหัศจรรย์\s*/i, "")
             .replace(/^สุดอินเทรนด์\s*/i, "")
             .trim();

  // If city already contains country like "โตเกียว (ญี่ปุ่น)", avoid duplicating
  let cityCountryPart = city;
  if (country) {
    if (!city.includes(`(${country})`) && !city.includes(country)) {
      cityCountryPart = city ? `${city} (${country})` : country;
    }
  }

  // Format date range
  const dateRangeStr = formatTravelDateRange(params.startDate, params.endDate, params.duration);

  // Format customer name
  let formattedCustomer = customerName;
  if (
    formattedCustomer &&
    formattedCustomer !== "ลูกค้าทั่วไป" &&
    formattedCustomer !== "General Customer" &&
    formattedCustomer !== "Private Tour"
  ) {
    if (
      !formattedCustomer.startsWith("คุณ") &&
      !formattedCustomer.startsWith("บจก") &&
      !formattedCustomer.startsWith("บริษัท") &&
      !formattedCustomer.startsWith("คณะ")
    ) {
      formattedCustomer = `คุณ${formattedCustomer}`;
    }
  } else {
    formattedCustomer = "";
  }

  const parts = [cityCountryPart, dateRangeStr, formattedCustomer].filter(Boolean);
  return parts.join(" ");
}
