export type Snapshot = {
  id: string;
  name: string;

  systemType: string;

  existing: {
    annualCost: number;
    efficiency: number;
  };

  proposed: {
    annualCost: number;
    efficiency: number;
  };

  results: {
    annualSavings: number;
    efficiencyGain: number;
  };
};
export const localSnapshots: Snapshot[] = [
  {
    id: "snap-001",
    name: "HVAC Upgrade – Gas Furnace → Heat Pump",
    systemType: "HVAC",

    existing: {
      annualCost: 2200,
      efficiency: 0.65,
    },

    proposed: {
      annualCost: 1200,
      efficiency: 0.92,
    },

    results: {
      annualSavings: 1000,
      efficiencyGain: 0.27,
    },
  },
];
