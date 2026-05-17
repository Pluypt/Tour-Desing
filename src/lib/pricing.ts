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
