import type { SalonTableStatus } from "@prisma/client";

export type FloorOrderItemSnapshot = {
  id: string;
  name: string;
  quantity: number;
  totalCents: number;
  notes: string | null;
};

export type FloorOrderSnapshot = {
  id: string;
  publicCode: string;
  customerName: string;
  totalCents: number;
  paymentStatus: string;
  status: string;
  partySize: number | null;
  waiterName: string | null;
  createdAt: string;
  items: FloorOrderItemSnapshot[];
};

export type FloorTableSnapshot = {
  id: string;
  number: string;
  name: string | null;
  status: SalonTableStatus;
  sectorId: string;
  sectorName: string;
  seats: number | null;
  customerName: string | null;
  partySize: number | null;
  waiterName: string | null;
  waiterId: string | null;
  openedAt: string | null;
  reservedAt: string | null;
  reservationName: string | null;
  reservationPeople: number | null;
  reservationNotes: string | null;
  joinedToTableId: string | null;
  joinedNumbers: string[];
  order: FloorOrderSnapshot | null;
};

export type FloorSectorSnapshot = {
  id: string;
  name: string;
  slug: string;
};

export type FloorSnapshot = {
  generatedAt: string;
  sectors: FloorSectorSnapshot[];
  tables: FloorTableSnapshot[];
  counts: {
    total: number;
    free: number;
    occupied: number;
    reserved: number;
    blocked: number;
  };
};

export type FloorWaiterOption = {
  id: string;
  name: string;
};
