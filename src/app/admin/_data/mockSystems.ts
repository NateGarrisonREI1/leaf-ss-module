export type LeafTierKey = "good" | "better" | "best";

export type CatalogSystem = {
  id: string;
  category:
    | "HVAC"
    | "Water Heater"
    | "Windows"
    | "Doors"
    | "Lighting"
    | "Insulation"
    | "Other";
  name: string;
  highlights: string[];

  // used elsewhere
  defaultAssumptions: {
    estCost?: number;
    estAnnualSavings?: number;
    estPaybackYears?: number;
  };

  // optional tags used for incentives matching, etc.
  tags?: string[];

  /**
   * ✅ NEW:
   * If present, this can override the master LEAF SS config *for the snapshot that uses this catalog system*.
   * This is how you make catalog-driven “Good/Better/Best” ranges.
   */
  leafSSOverrides?: {
    tiers?: Partial<
      Record<
        LeafTierKey,
        {
          leafPriceRange?: { min: number; max: number };
          baseMonthlySavings?: { min: number; max: number };

          // optional: card labels per tier (used in report UI)
          recommendedName?: string;
          statusPillText?: string;
        }
      >
    >;
  };
};

export const MOCK_SYSTEMS: CatalogSystem[] = [
  {
    id: "sys_hvac_gas_furnace_direct",
    category: "HVAC",
    name: "Direct Gas Furnace Replacement",
    highlights: ["Like-for-like replacement", "Fast install", "Lower upfront cost"],
    tags: ["hvac", "gas_furnace", "direct_replacement"],
    defaultAssumptions: { estCost: 6000, estAnnualSavings: 240, estPaybackYears: 10 },

    // ✅ Here’s the “catalog drives the snapshot ranges” part:
    leafSSOverrides: {
      tiers: {
        good: {
          leafPriceRange: { min: 4500, max: 6000 },
          baseMonthlySavings: { min: 12, max: 22 },
          recommendedName: "Standard-efficiency gas furnace",
          statusPillText: "Direct replacement",
        },
        better: {
          leafPriceRange: { min: 5000, max: 7000 },
          baseMonthlySavings: { min: 14, max: 28 },
          recommendedName: "High-efficiency gas furnace",
          statusPillText: "High efficiency",
        },
        best: {
          leafPriceRange: { min: 6500, max: 9000 },
          baseMonthlySavings: { min: 18, max: 35 },
          recommendedName: "Premium high-efficiency gas furnace",
          statusPillText: "Best-in-class",
        },
      },
    },
  },

  {
    id: "sys_hvac_hp_direct",
    category: "HVAC",
    name: "Direct HVAC Heat Pump Replacement",
    highlights: ["Replaces furnace + AC", "Comfort upgrade", "Lower CO₂"],
    tags: ["hvac", "heat_pump", "direct_replacement"],
    defaultAssumptions: { estCost: 14000, estAnnualSavings: 900, estPaybackYears: 12 },
    leafSSOverrides: {
      tiers: {
        good: {
          leafPriceRange: { min: 11000, max: 14000 },
          baseMonthlySavings: { min: 35, max: 55 },
          recommendedName: "Standard ducted heat pump",
          statusPillText: "Electrify upgrade",
        },
        better: {
          leafPriceRange: { min: 13000, max: 17000 },
          baseMonthlySavings: { min: 45, max: 70 },
          recommendedName: "High-efficiency ducted heat pump",
          statusPillText: "High efficiency",
        },
        best: {
          leafPriceRange: { min: 16000, max: 22000 },
          baseMonthlySavings: { min: 55, max: 90 },
          recommendedName: "Premium cold-climate heat pump",
          statusPillText: "Best-in-class",
        },
      },
    },
  },

  // keep your other systems below (unchanged), or add leafSSOverrides to them later:
];
