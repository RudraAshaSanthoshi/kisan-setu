export type UserRole = "FARMER" | "CENTRE_STAFF" | "ADMIN";

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  preferredLanguage: string;
  assignedCentreId?: string;
  district?: string;
  state?: string;
  created_at: string;
}

export interface ProcurementCentre {
  id: string;
  centreCode: string;
  name: string;
  district: string;
  state: string;
  address: string;
  latitude?: number;
  longitude?: number;
  dailyCapacityQuintals: number;
  hourlySlotCapacity: number;
  isActive: boolean;
}

export interface CropMaster {
  id: string;
  cropCode: string;
  nameEn: string;
  nameHi: string;
  season: string;
  mspPerQuintal: number;
  maxMoisturePercentage: number;
}
