export interface FarmerProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  district: string;
  state: string;
  preferredLanguage: string;
  savedMandiId: string;
  bankAccountLast4: string;
  bankName: string;
}

export interface CropOption {
  id: string;
  name: string;
  localName: string;
  mspRatePerQtl: number;
  season: string;
  iconName: string;
}

export interface ProcurementCentre {
  id: string;
  name: string;
  address: string;
  district: string;
  distanceKm: number;
  availableSlotsToday: number;
  expectedWaitMins: number;
  status: "OPEN" | "BUSY" | "FULL";
}

export interface TimeSlot {
  id: string;
  timeRange: string;
  remainingCapacity: number;
  totalCapacity: number;
  status: "AVAILABLE" | "LIMITED" | "FULL";
}

export interface BookingRecord {
  id: string;
  tokenNumber: string;
  cropId: string;
  cropName: string;
  quantityQtl: number;
  centreId: string;
  centreName: string;
  bookingDate: string;
  timeSlot: string;
  status: "UPCOMING" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  queueNumber?: number;
  currentlyServing?: number;
  farmersAhead?: number;
  estimatedWaitMins?: number;
  assignedCounter?: string;
}

export interface QueueState {
  tokenNumber: string;
  queuePosition: number;
  currentlyServing: number;
  farmersAhead: number;
  estimatedWaitMins: number;
  assignedCounter: string;
  operatingStatus: "SMOOTH" | "MODERATE_WAIT" | "DELAYED";
  delayNotice?: string;
  progressSteps: {
    token: number;
    status: "COMPLETED" | "CURRENT" | "WAITING";
    isUser: boolean;
  }[];
}

export interface WeighbridgeProcurement {
  id: string;
  slipNumber: string;
  cropName: string;
  centreName: string;
  date: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  netWeightQtl: number;
  moisturePercentage: number;
  qualityGrade: "Grade A" | "Grade B" | "Standard";
  mspRatePerQtl: number;
  totalPayoutAmount: number;
  status: "CHECKED_IN" | "WEIGHED" | "QUALITY_APPROVED" | "COMPLETED" | "PAYMENT_INITIATED" | "CREDITED";
  bankUtr?: string;
}

export interface PaymentRecord {
  id: string;
  procurementSlip: string;
  cropName: string;
  quantityQtl: number;
  ratePerQtl: number;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "CREDITED";
  initiatedDate: string;
  creditedDate?: string;
  bankUtr?: string;
  bankName: string;
  accountEnding: string;
}

export interface FarmerNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "SLOT" | "QUEUE" | "PAYMENT" | "SYSTEM";
}

// ==================================================
// CENTRAL DEMO DATA INSTANCE
// ==================================================

export const DEMO_FARMER_PROFILE: FarmerProfile = {
  id: "f1111111-1111-1111-1111-111111111111",
  fullName: "Gurpreet Singh",
  phoneNumber: "+91 98765 43210",
  email: "gurpreet.farmer@kisansetu.in",
  district: "Ludhiana",
  state: "Punjab",
  preferredLanguage: "pa",
  savedMandiId: "b1000000-0000-0000-0000-000000000001",
  bankAccountLast4: "4829",
  bankName: "State Bank of India",
};

export const DEMO_CROPS: CropOption[] = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Wheat (Kanak)", localName: "ਕਣਕ / गेहूं", mspRatePerQtl: 2275, season: "Rabi 2025", iconName: "Wheat" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Paddy / Rice (Basmati/PR-126)", localName: "ਝੋਨਾ / धान", mspRatePerQtl: 2203, season: "Kharif 2025", iconName: "Sprout" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "Mustard (Sarson)", localName: "ਸਰ੍ਹੋਂ / सरसों", mspRatePerQtl: 5650, season: "Rabi 2025", iconName: "Flower" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Gram (Chana)", localName: "ਛੋਲੇ / चना", mspRatePerQtl: 5440, season: "Rabi 2025", iconName: "Leaf" },
  { id: "c1000000-0000-0000-0000-000000000005", name: "Maize (Makki)", localName: "ਮੱਕੀ / मक्का", mspRatePerQtl: 2090, season: "Kharif 2025", iconName: "Sun" },
];

export const DEMO_CENTRES: ProcurementCentre[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    name: "Khanna Main Grain Mandi",
    address: "GT Road, Khanna, District Ludhiana, Punjab",
    district: "Ludhiana",
    distanceKm: 4.2,
    availableSlotsToday: 38,
    expectedWaitMins: 25,
    status: "OPEN",
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    name: "Ludhiana West Mandi",
    address: "Ferozepur Road, Ludhiana, Punjab",
    district: "Ludhiana",
    distanceKm: 6.8,
    availableSlotsToday: 24,
    expectedWaitMins: 35,
    status: "OPEN",
  },
  {
    id: "b1000000-0000-0000-0000-000000000003",
    name: "Samrala Mandi Centre",
    address: "Chandigarh Road, Samrala, Ludhiana, Punjab",
    district: "Ludhiana",
    distanceKm: 12.4,
    availableSlotsToday: 15,
    expectedWaitMins: 15,
    status: "OPEN",
  },
  {
    id: "b1000000-0000-0000-0000-000000000004",
    name: "Jagraon Grain Market",
    address: "Moga Road, Jagraon, Ludhiana, Punjab",
    district: "Ludhiana",
    distanceKm: 18.2,
    availableSlotsToday: 8,
    expectedWaitMins: 45,
    status: "OPEN",
  },
];

export const DEMO_SLOTS: TimeSlot[] = [
  { id: "slot-1", timeRange: "09:00 AM – 09:30 AM", remainingCapacity: 12, totalCapacity: 25, status: "AVAILABLE" },
  { id: "slot-2", timeRange: "09:30 AM – 10:00 AM", remainingCapacity: 4, totalCapacity: 25, status: "LIMITED" },
  { id: "slot-3", timeRange: "10:00 AM – 10:30 AM", remainingCapacity: 0, totalCapacity: 25, status: "FULL" },
  { id: "slot-4", timeRange: "10:30 AM – 11:00 AM", remainingCapacity: 15, totalCapacity: 25, status: "AVAILABLE" },
  { id: "slot-5", timeRange: "11:00 AM – 11:30 AM", remainingCapacity: 8, totalCapacity: 25, status: "AVAILABLE" },
  { id: "slot-6", timeRange: "11:30 AM – 12:00 PM", remainingCapacity: 18, totalCapacity: 25, status: "AVAILABLE" },
  { id: "slot-7", timeRange: "02:00 PM – 02:30 PM", remainingCapacity: 22, totalCapacity: 25, status: "AVAILABLE" },
  { id: "slot-8", timeRange: "02:30 PM – 03:00 PM", remainingCapacity: 10, totalCapacity: 25, status: "AVAILABLE" },
];

export const DEMO_ACTIVE_BOOKING: BookingRecord = {
  id: "BK-26032-8841",
  tokenNumber: "#KS-26032-00841",
  cropId: "paddy",
  cropName: "Paddy (PR-126)",
  quantityQtl: 42.0,
  centreId: "CENTRE-01",
  centreName: "Khanna Main Grain Mandi",
  bookingDate: "Today",
  timeSlot: "10:30 AM – 11:00 AM",
  status: "CHECKED_IN",
  queueNumber: 27,
  currentlyServing: 19,
  farmersAhead: 8,
  estimatedWaitMins: 35,
  assignedCounter: "Weighbridge Gate #2",
};

export const DEMO_QUEUE_STATE: QueueState = {
  tokenNumber: "#KS-26032-00841",
  queuePosition: 27,
  currentlyServing: 19,
  farmersAhead: 8,
  estimatedWaitMins: 35,
  assignedCounter: "Weighbridge Gate #2",
  operatingStatus: "SMOOTH",
  delayNotice: "Normal Mandi Operations. Gate #2 traffic moving steadily.",
  progressSteps: [
    { token: 19, status: "CURRENT", isUser: false },
    { token: 20, status: "WAITING", isUser: false },
    { token: 21, status: "WAITING", isUser: false },
    { token: 22, status: "WAITING", isUser: false },
    { token: 23, status: "WAITING", isUser: false },
    { token: 24, status: "WAITING", isUser: false },
    { token: 25, status: "WAITING", isUser: false },
    { token: 26, status: "WAITING", isUser: false },
    { token: 27, status: "WAITING", isUser: true },
  ],
};

export const DEMO_BOOKINGS_HISTORY: BookingRecord[] = [
  DEMO_ACTIVE_BOOKING,
  {
    id: "BK-2024-9912",
    tokenNumber: "#KS-2024-09912",
    cropId: "wheat",
    cropName: "Wheat (Kanak)",
    quantityQtl: 50.0,
    centreId: "CENTRE-01",
    centreName: "Khanna Main Grain Mandi",
    bookingDate: "14 Oct 2025",
    timeSlot: "09:30 AM – 10:00 AM",
    status: "COMPLETED",
  },
  {
    id: "BK-2024-7721",
    tokenNumber: "#KS-2024-07721",
    cropId: "mustard",
    cropName: "Mustard (Sarson)",
    quantityQtl: 18.0,
    centreId: "CENTRE-02",
    centreName: "Samrala Procurement Hub",
    bookingDate: "02 Mar 2025",
    timeSlot: "11:00 AM – 11:30 AM",
    status: "CANCELLED",
  },
];

export const DEMO_PROCUREMENTS: WeighbridgeProcurement[] = [
  {
    id: "PROC-9921",
    slipNumber: "#KS-SLIP-9921",
    cropName: "Wheat (Kanak)",
    centreName: "Khanna Main Grain Mandi",
    date: "14 Oct 2025",
    grossWeightKg: 18500,
    tareWeightKg: 13500,
    netWeightKg: 5000,
    netWeightQtl: 50.0,
    moisturePercentage: 13.2,
    qualityGrade: "Grade A",
    mspRatePerQtl: 2275,
    totalPayoutAmount: 113750,
    status: "CREDITED",
    bankUtr: "SBIN00912384912",
  },
  {
    id: "PROC-8812",
    slipNumber: "#KS-SLIP-8812",
    cropName: "Paddy (PR-126)",
    centreName: "Khanna Main Grain Mandi",
    date: "Today",
    grossWeightKg: 17200,
    tareWeightKg: 13000,
    netWeightKg: 4200,
    netWeightQtl: 42.0,
    moisturePercentage: 14.1,
    qualityGrade: "Grade A",
    mspRatePerQtl: 2203,
    totalPayoutAmount: 92526,
    status: "PAYMENT_INITIATED",
  },
];

export const DEMO_PAYMENTS: PaymentRecord[] = [
  {
    id: "PAY-8812",
    procurementSlip: "#KS-SLIP-8812",
    cropName: "Paddy (PR-126)",
    quantityQtl: 42.0,
    ratePerQtl: 2203,
    totalAmount: 92526,
    status: "PROCESSING",
    initiatedDate: "Today, 11:30 AM",
    bankName: "State Bank of India",
    accountEnding: "4829",
  },
  {
    id: "PAY-9921",
    procurementSlip: "#KS-SLIP-9921",
    cropName: "Wheat (Kanak)",
    quantityQtl: 50.0,
    ratePerQtl: 2275,
    totalAmount: 113750,
    status: "CREDITED",
    initiatedDate: "14 Oct 2025, 02:15 PM",
    creditedDate: "15 Oct 2025, 10:00 AM",
    bankUtr: "SBIN00912384912",
    bankName: "State Bank of India",
    accountEnding: "4829",
  },
];

export const DEMO_NOTIFICATIONS: FarmerNotification[] = [
  {
    id: "NOTIF-01",
    title: "Slot Scheduled For Today",
    message: "Your Paddy procurement slot is today at 10:30 AM at Khanna Main Grain Mandi.",
    timestamp: "10 mins ago",
    read: false,
    category: "SLOT",
  },
  {
    id: "NOTIF-02",
    title: "Live Queue Turn Alert",
    message: "You are currently position #27 in line. 8 farmers ahead at Gate #2.",
    timestamp: "25 mins ago",
    read: false,
    category: "QUEUE",
  },
  {
    id: "NOTIF-03",
    title: "Payment Credited Successfully",
    message: "₹1,13,750 MSP payout for Wheat (50 Qtl) credited to SBI A/C ending in 4829. UTR: SBIN00912384912.",
    timestamp: "Yesterday",
    read: true,
    category: "PAYMENT",
  },
  {
    id: "NOTIF-04",
    title: "Procurement Centre Capacity Normal",
    message: "Khanna Mandi reports smooth gate movement with average 25 min wait times.",
    timestamp: "Yesterday",
    read: true,
    category: "SYSTEM",
  },
];
