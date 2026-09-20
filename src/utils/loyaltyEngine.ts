import { Customer, LoyaltyTier, LoyaltyLog } from '../types';

export interface LoyaltyRewardOffer {
  id: string;
  name: string;
  hindiName: string;
  pointsRequired: number;
  discountValue: number;
  description: string;
  badge?: string;
  freeItemName?: string;
}

export interface LoyaltyProgramConfig {
  spendAmountForPoints: number; // Spend this many ₹ (e.g. 100)
  pointsAwarded: number;        // To receive this many points (e.g. 1)
  pointValueInRupees: number;   // Each point is worth this many ₹ (e.g. 1.0)
  minSpendToEarn: number;       // Min purchase to earn points (e.g. 100)
  minPointsToRedeem: number;    // Min points required to redeem (e.g. 10)
  maxRedemptionPercent: number; // Max bill % that can be paid via points (e.g. 100)
  // Tier Multipliers & Thresholds
  silverMultiplier: number;     // default 1.0
  goldMultiplier: number;       // default 1.25
  platinumMultiplier: number;   // default 1.5
  goldThresholdPoints: number;  // default 500
  platinumThresholdPoints: number; // default 1500
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyProgramConfig = {
  spendAmountForPoints: 100,
  pointsAwarded: 1,
  pointValueInRupees: 1.0,
  minSpendToEarn: 100,
  minPointsToRedeem: 10,
  maxRedemptionPercent: 100,
  silverMultiplier: 1.0,
  goldMultiplier: 1.25,
  platinumMultiplier: 1.5,
  goldThresholdPoints: 500,
  platinumThresholdPoints: 1500,
};

const LOYALTY_CONFIG_KEY = 'mamjist_loyalty_program_rules_v1';

/**
 * Retrieve active loyalty configuration from localStorage or default
 */
export function getLoyaltyConfig(): LoyaltyProgramConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_LOYALTY_CONFIG };
  try {
    const raw = localStorage.getItem(LOYALTY_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_LOYALTY_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      spendAmountForPoints: Number(parsed.spendAmountForPoints) > 0 ? Number(parsed.spendAmountForPoints) : 100,
      pointsAwarded: Number(parsed.pointsAwarded) > 0 ? Number(parsed.pointsAwarded) : 1,
      pointValueInRupees: Number(parsed.pointValueInRupees) > 0 ? Number(parsed.pointValueInRupees) : 1.0,
      minSpendToEarn: Number(parsed.minSpendToEarn) >= 0 ? Number(parsed.minSpendToEarn) : 100,
      minPointsToRedeem: Number(parsed.minPointsToRedeem) >= 0 ? Number(parsed.minPointsToRedeem) : 10,
      maxRedemptionPercent: Number(parsed.maxRedemptionPercent) > 0 ? Number(parsed.maxRedemptionPercent) : 100,
      silverMultiplier: Number(parsed.silverMultiplier) > 0 ? Number(parsed.silverMultiplier) : 1.0,
      goldMultiplier: Number(parsed.goldMultiplier) > 0 ? Number(parsed.goldMultiplier) : 1.25,
      platinumMultiplier: Number(parsed.platinumMultiplier) > 0 ? Number(parsed.platinumMultiplier) : 1.5,
      goldThresholdPoints: Number(parsed.goldThresholdPoints) > 0 ? Number(parsed.goldThresholdPoints) : 500,
      platinumThresholdPoints: Number(parsed.platinumThresholdPoints) > 0 ? Number(parsed.platinumThresholdPoints) : 1500,
    };
  } catch {
    return { ...DEFAULT_LOYALTY_CONFIG };
  }
}

/**
 * Persist loyalty rules and broadcast update to all tabs/components
 */
export function saveLoyaltyConfig(config: LoyaltyProgramConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOYALTY_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('loyalty-config-changed', { detail: config }));
  } catch (e) {
    console.error('Failed to save loyalty config:', e);
  }
}

/**
 * Reset loyalty program rules to factory defaults
 */
export function resetLoyaltyConfig(): LoyaltyProgramConfig {
  saveLoyaltyConfig(DEFAULT_LOYALTY_CONFIG);
  return { ...DEFAULT_LOYALTY_CONFIG };
}

export const LOYALTY_OFFERS: LoyaltyRewardOffer[] = [
  {
    id: 'offer-pts-50',
    name: '₹50 Instant Mill Voucher',
    hindiName: '₹50 त्वरित छूट',
    pointsRequired: 50,
    discountValue: 50,
    description: 'Flat ₹50 discount on current bill',
    badge: 'Popular'
  },
  {
    id: 'offer-pts-100',
    name: '₹100 Flat Cash Discount',
    hindiName: '₹100 नकद छूट',
    pointsRequired: 100,
    discountValue: 100,
    description: 'Flat ₹100 deduction on invoice total'
  },
  {
    id: 'offer-haldi-free',
    name: 'Free 500g Golden Haldi Pouch',
    hindiName: 'मुफ्त 500 ग्राम सेलम हल्दी',
    pointsRequired: 120,
    discountValue: 140, // Retail value of 500g Haldi
    description: 'Redeem points for 1 complimentary Salem Haldi (worth ₹140)',
    freeItemName: 'Salem Special Golden Haldi Powder (500 Gm)',
    badge: 'Spice Gift'
  },
  {
    id: 'offer-pts-250',
    name: '₹250 Festival Reward Discount',
    hindiName: '₹250 त्यौहारी उपहार छूट',
    pointsRequired: 200,
    discountValue: 250,
    description: 'Special 1.25x value conversion for loyalty members',
    badge: 'Bonus Value'
  },
  {
    id: 'offer-atta-free',
    name: 'Free 5 Kg Sharbati Atta Bag',
    hindiName: 'मुफ्त 5 कि.ग्रा. शरबती आटा',
    pointsRequired: 300,
    discountValue: 220, // Retail value of 5kg Atta
    description: 'Complimentary 5 Kg Chakki Fresh Sharbati Atta bag',
    freeItemName: 'Chakki Fresh Sharbati Atta (5 Kg Bag)',
    badge: 'Mill Special'
  },
  {
    id: 'offer-pts-500',
    name: '₹600 Wholesale Super Bonus',
    hindiName: '₹600 सुपर बोनस',
    pointsRequired: 500,
    discountValue: 600,
    description: 'Massive ₹600 discount for frequent kirana & catering buyers',
    badge: 'VIP B2B'
  }
];

/**
 * Calculate loyalty tier based on lifetime points and configured thresholds
 */
export function calculateTier(lifetimePoints: number, customConfig?: LoyaltyProgramConfig): LoyaltyTier {
  const config = customConfig || getLoyaltyConfig();
  if (lifetimePoints >= config.platinumThresholdPoints) return 'Platinum';
  if (lifetimePoints >= config.goldThresholdPoints) return 'Gold';
  return 'Silver';
}

export const getCustomerTier = calculateTier;

/**
 * Get tier perk multiplier (e.g. Platinum earns 1.5x points)
 */
export function getTierMultiplier(tier: LoyaltyTier, customConfig?: LoyaltyProgramConfig): number {
  const config = customConfig || getLoyaltyConfig();
  switch (tier) {
    case 'Platinum': return config.platinumMultiplier;
    case 'Gold': return config.goldMultiplier;
    default: return config.silverMultiplier;
  }
}

/**
 * Calculate points earned for a purchase amount according to custom rules:
 * Base: For every [spendAmountForPoints] spent, award [pointsAwarded] points,
 * multiplied by tier multiplier.
 */
export function calculatePointsEarned(
  spendAmount: number, 
  tier: LoyaltyTier = 'Silver',
  customConfig?: LoyaltyProgramConfig
): number {
  const config = customConfig || getLoyaltyConfig();
  if (spendAmount < config.minSpendToEarn || spendAmount <= 0) return 0;
  const baseUnits = Math.floor(spendAmount / config.spendAmountForPoints);
  const basePoints = baseUnits * config.pointsAwarded;
  const multiplier = getTierMultiplier(tier, config);
  return Math.floor(basePoints * multiplier);
}

/**
 * Convert points to rupee discount value based on configured pointValueInRupees
 */
export function calculatePointsDiscount(points: number, customConfig?: LoyaltyProgramConfig): number {
  const config = customConfig || getLoyaltyConfig();
  return Math.max(0, points) * config.pointValueInRupees;
}

/**
 * Convert rupee discount to points required
 */
export function calculatePointsRequiredForDiscount(discountRupees: number, customConfig?: LoyaltyProgramConfig): number {
  const config = customConfig || getLoyaltyConfig();
  if (config.pointValueInRupees <= 0) return 0;
  return Math.ceil(discountRupees / config.pointValueInRupees);
}

/**
 * Applies points deduction and returns updated customer with new loyalty transaction log
 */
export function applyLoyaltyRedemption(
  customer: Customer,
  pointsToRedeem: number,
  invoiceNo: string,
  customConfig?: LoyaltyProgramConfig
): { updatedCustomer: Customer; discountApplied: number } {
  const config = customConfig || getLoyaltyConfig();
  const redeemable = Math.min(customer.loyaltyPoints, Math.max(0, pointsToRedeem));
  const newBalance = customer.loyaltyPoints - redeemable;
  const discountApplied = redeemable * config.pointValueInRupees;

  const logEntry: LoyaltyLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    type: 'REDEEMED',
    points: redeemable,
    description: `Redeemed ${redeemable} points on Bill #${invoiceNo} (₹${discountApplied.toFixed(2)} Off)`,
    balanceAfter: newBalance
  };

  const updatedCustomer: Customer = {
    ...customer,
    loyaltyPoints: newBalance,
    loyaltyHistory: [logEntry, ...(customer.loyaltyHistory || [])]
  };

  return {
    updatedCustomer,
    discountApplied
  };
}

/**
 * Awards earned points to customer after completed sale
 */
export function awardLoyaltyPoints(
  customer: Customer,
  pointsEarned: number,
  invoiceNo: string,
  customConfig?: LoyaltyProgramConfig
): Customer {
  if (pointsEarned <= 0) return customer;
  const config = customConfig || getLoyaltyConfig();

  const newBalance = customer.loyaltyPoints + pointsEarned;
  const newLifetime = customer.lifetimePoints + pointsEarned;
  const newTier = calculateTier(newLifetime, config);

  const logEntry: LoyaltyLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    type: 'EARNED',
    points: pointsEarned,
    description: `Earned ${pointsEarned} points from Bill #${invoiceNo}`,
    balanceAfter: newBalance
  };

  return {
    ...customer,
    loyaltyPoints: newBalance,
    lifetimePoints: newLifetime,
    loyaltyTier: newTier,
    loyaltyHistory: [logEntry, ...(customer.loyaltyHistory || [])]
  };
}
