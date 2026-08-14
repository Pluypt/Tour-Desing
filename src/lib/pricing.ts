export type CostType = "fixed_group" | "per_person" | "per_day" | "per_room";

export type CostItem = {
  cost_type: string;
  quantity: number;
  unit_cost: number;
  total_cost?: number;
};

/**
 * Calculate total cost for a single cost item based on its type.
 */
export function calculateCostItemTotal(
  item: Pick<CostItem, "cost_type" | "quantity" | "unit_cost">,
  travelerCount: number,
  duration: number
): number {
  const qty = item.quantity || 1;
  const unit = item.unit_cost || 0;

  switch (item.cost_type) {
    case "fixed_group":
      return roundPrice(qty * unit);
    case "per_person":
      return roundPrice(travelerCount * qty * unit);
    case "per_day":
      return roundPrice(duration * qty * unit);
    case "per_room":
      return roundPrice(qty * unit);
    default:
      return roundPrice(qty * unit);
  }
}

export type PricingInput = {
  costItems: CostItem[];
  travelerCount: number;
  duration: number;
  pricingMethod?: string | null;
  targetProfitPercent?: number | null;
  targetProfitPerPerson?: number | null;
  manualSellingPricePerPerson?: number | null;
};

export type PricingResult = {
  totalFixedCost: number;
  totalVariableCost: number;
  totalCost: number;
  costPerPerson: number;
  sellingPricePerPerson: number;
  totalSellingPrice: number;
  profitAmount: number;
  profitPercent: number;
  depositAmount: number;
  remainingAmount: number;
};

/**
 * Calculate full tour pricing from cost items and pricing method.
 */
export function calculateTourPricing(input: PricingInput): PricingResult {
  const { costItems, travelerCount, duration, pricingMethod, targetProfitPercent, targetProfitPerPerson, manualSellingPricePerPerson } = input;
  const pax = Math.max(travelerCount || 1, 1);

  let totalFixedCost = 0;
  let totalVariableCost = 0;

  for (const item of costItems) {
    const itemTotal = calculateCostItemTotal(item, pax, duration);
    if (item.cost_type === "fixed_group" || item.cost_type === "per_room") {
      totalFixedCost += itemTotal;
    } else {
      totalVariableCost += itemTotal;
    }
  }

  const totalCost = roundPrice(totalFixedCost + totalVariableCost);
  const costPerPerson = roundPrice(totalCost / pax);

  let sellingPricePerPerson = costPerPerson;

  if (pricingMethod === "percent" && targetProfitPercent != null) {
    sellingPricePerPerson = roundPrice(costPerPerson * (1 + targetProfitPercent / 100));
  } else if (pricingMethod === "profit_per_person" && targetProfitPerPerson != null) {
    sellingPricePerPerson = roundPrice(costPerPerson + targetProfitPerPerson);
  } else if (pricingMethod === "manual" && manualSellingPricePerPerson != null) {
    sellingPricePerPerson = manualSellingPricePerPerson;
  }

  const totalSellingPrice = roundPrice(sellingPricePerPerson * pax);
  const profitAmount = roundPrice(totalSellingPrice - totalCost);
  const profitPercent = totalCost > 0 ? roundPrice((profitAmount / totalCost) * 100) : 0;
  const depositAmount = roundPrice(totalSellingPrice * 0.3);
  const remainingAmount = roundPrice(totalSellingPrice - depositAmount);

  return {
    totalFixedCost,
    totalVariableCost,
    totalCost,
    costPerPerson,
    sellingPricePerPerson,
    totalSellingPrice,
    profitAmount,
    profitPercent,
    depositAmount,
    remainingAmount,
  };
}

export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, currency = "THB"): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export type MarketPriceEstimateParams = {
  country?: string | null;
  city?: string | null;
  duration?: number | null;
  hotelLevel?: string | null;
  tripType?: string | null;
  travelerCount?: number | null;
};

/**
 * Estimate realistic retail market price when the user did not specify a price during tour creation.
 * Evaluates real-world airline tickets, hotel rates per night, transport, meals, and standard agency profit margin.
 */
export function estimateMarketPrice(params: MarketPriceEstimateParams): {
  sellingPricePerPerson: number;
  totalSellingPrice: number;
  costPerPerson: number;
} {
  const duration = Math.max(1, params.duration || 4);
  const nights = Math.max(1, duration - 1);
  const pax = Math.max(1, params.travelerCount || 2);
  const dest = `${params.city || ""} ${params.country || ""}`.toLowerCase();
  const hotelStr = (params.hotelLevel || "4").toLowerCase();
  const isPrivate = (params.tripType || "Private").toLowerCase().includes("private");

  // Determine hotel cost per room/night
  let hotelPerNight = 2800; // default 4-star
  if (hotelStr.includes("5") || hotelStr.includes("ห้าดาว") || hotelStr.includes("luxury")) {
    hotelPerNight = 5500;
  } else if (hotelStr.includes("3") || hotelStr.includes("สามดาว") || hotelStr.includes("standard")) {
    hotelPerNight = 1800;
  }

  // Base regional benchmarks
  let baseFlightCost = 11000;
  let dailyMealsAndTransport = 2200;
  let entranceAndGuideFee = 3500;

  if (dest.includes("japan") || dest.includes("ญี่ปุ่น") || dest.includes("tokyo") || dest.includes("osaka") || dest.includes("hokkaido")) {
    baseFlightCost = 17500;
    hotelPerNight = hotelStr.includes("5") ? 7500 : (hotelStr.includes("3") ? 3200 : 4800);
    dailyMealsAndTransport = 3500;
    entranceAndGuideFee = 4500;
  } else if (dest.includes("hong kong") || dest.includes("ฮ่องกง") || dest.includes("macao") || dest.includes("macau") || dest.includes("มาเก๊า")) {
    baseFlightCost = 8500;
    hotelPerNight = hotelStr.includes("5") ? 6500 : (hotelStr.includes("3") ? 2500 : 3800);
    dailyMealsAndTransport = 2500;
    entranceAndGuideFee = 3000;
  } else if (dest.includes("korea") || dest.includes("เกาหลี") || dest.includes("seoul") || dest.includes("busan")) {
    baseFlightCost = 12500;
    hotelPerNight = hotelStr.includes("5") ? 6000 : (hotelStr.includes("3") ? 2200 : 3500);
    dailyMealsAndTransport = 2600;
    entranceAndGuideFee = 3200;
  } else if (dest.includes("taiwan") || dest.includes("ไต้หวัน") || dest.includes("taipei")) {
    baseFlightCost = 9500;
    hotelPerNight = hotelStr.includes("5") ? 5000 : (hotelStr.includes("3") ? 2000 : 3000);
    dailyMealsAndTransport = 2200;
    entranceAndGuideFee = 2800;
  } else if (dest.includes("vietnam") || dest.includes("เวียดนาม") || dest.includes("danang") || dest.includes("hanoi") || dest.includes("sapa") || dest.includes("phu quoc")) {
    baseFlightCost = 6500;
    hotelPerNight = hotelStr.includes("5") ? 4000 : (hotelStr.includes("3") ? 1400 : 2200);
    dailyMealsAndTransport = 1600;
    entranceAndGuideFee = 2200;
  } else if (dest.includes("europe") || dest.includes("ยุโรป") || dest.includes("swiss") || dest.includes("france") || dest.includes("italy") || dest.includes("uk")) {
    baseFlightCost = 36000;
    hotelPerNight = hotelStr.includes("5") ? 9500 : (hotelStr.includes("3") ? 4500 : 6500);
    dailyMealsAndTransport = 5500;
    entranceAndGuideFee = 8500;
  } else if (dest.includes("china") || dest.includes("จีน") || dest.includes("kunming") || dest.includes("lijiang") || dest.includes("chengdu") || dest.includes("guangzhou") || dest.includes("shanghai") || dest.includes("beijing") || dest.includes("chongqing")) {
    baseFlightCost = 11500;
    hotelPerNight = hotelStr.includes("5") ? 5200 : (hotelStr.includes("3") ? 1700 : 2800);
    dailyMealsAndTransport = 2200;
    entranceAndGuideFee = 3800;
  }

  // Calculate per person cost (2 pax per room)
  const hotelCostPerPax = (hotelPerNight * nights) / Math.max(1, Math.min(2, pax));
  const dailyTotalPerPax = dailyMealsAndTransport * duration;
  const privateGroupSurcharge = isPrivate && pax < 6 ? Math.round((6 - pax) * 1200) : 0;

  const rawCostPerPax = baseFlightCost + hotelCostPerPax + dailyTotalPerPax + entranceAndGuideFee + privateGroupSurcharge;

  // 18% - 25% target gross profit margin for standard retail tour pricing
  const profitMultiplier = 1.22;
  let calculatedSellingPrice = Math.round((rawCostPerPax * profitMultiplier) / 100) * 100;

  // Round to psychological retail pricing (e.g. ending in 900 or 500)
  const roundedToThousand = Math.floor(calculatedSellingPrice / 1000) * 1000;
  calculatedSellingPrice = roundedToThousand + 900;
  if (calculatedSellingPrice < rawCostPerPax) {
    calculatedSellingPrice += 1000;
  }

  const totalSellingPrice = calculatedSellingPrice * pax;

  return {
    costPerPerson: Math.round(rawCostPerPax),
    sellingPricePerPerson: calculatedSellingPrice,
    totalSellingPrice: totalSellingPrice,
  };
}

