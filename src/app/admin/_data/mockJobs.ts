export type ExistingSystem = {
  id: string;
  type: string;       // HVAC, Water Heater, Windows, etc
  subtype: string;    // Gas Furnace, Heat Pump, etc
  ageYears: number;
  operational: "Yes" | "No";
  wear: 1 | 2 | 3 | 4 | 5;
  maintenance: "Good" | "Average" | "Poor";
};

export type Job = {
  id: string;
  reportId: string;
  customerName: string;
  address?: string;
  sqft?: number;
  yearBuilt?: number;
  createdAt: string; // ISO
  systems: ExistingSystem[];
};

export const MOCK_JOBS: Job[] = [
  {
    id: "job_1001",
    reportId: "LEAF-0001",
    customerName: "Nate Garrison",
    address: "995 SE 21st Ave, Hillsboro, OR 97123",
    sqft: 1450,
    yearBuilt: 1925,
    createdAt: "2025-12-25T18:00:00.000Z",
    systems: [
      {
        id: "sys_hvac_1",
        type: "HVAC",
        subtype: "Gas Furnace",
        ageYears: 18,
        operational: "Yes",
        wear: 3,
        maintenance: "Average",
      },
      {
        id: "sys_wh_1",
        type: "Water Heater",
        subtype: "Tank (Natural Gas)",
        ageYears: 10,
        operational: "Yes",
        wear: 2,
        maintenance: "Good",
      },
      {
        id: "sys_windows_1",
        type: "Windows",
        subtype: "Mixed / Unknown",
        ageYears: 30,
        operational: "Yes",
        wear: 4,
        maintenance: "Average",
      },
    ],
  },
  {
    id: "job_1002",
    reportId: "LEAF-0002",
    customerName: "Example Customer",
    address: "123 Main St, Portland, OR 97201",
    sqft: 2100,
    yearBuilt: 1998,
    createdAt: "2025-12-20T18:00:00.000Z",
    systems: [
      {
        id: "sys_roof_1",
        type: "Insulation",
        subtype: "Attic (Unknown R)",
        ageYears: 20,
        operational: "Yes",
        wear: 3,
        maintenance: "Average",
      },
      {
        id: "sys_lighting_1",
        type: "Lighting",
        subtype: "Mixed (LED + Incandescent)",
        ageYears: 8,
        operational: "Yes",
        wear: 2,
        maintenance: "Good",
      },
    ],
  },
];
