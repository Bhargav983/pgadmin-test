export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  rent: number;
  currentOccupancy: number;
}

export interface Resident {
  id: string;
  name: string;
  contact: string;
  personalInfo?: string;
  roomId: string | null; // ID of the room they are assigned to
}

export type RoomFormValues = Omit<Room, 'id' | 'currentOccupancy'>;
export type ResidentFormValues = Omit<Resident, 'id'>;
