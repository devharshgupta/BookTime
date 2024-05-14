export class BookingSlot {
  startTime: string;
  endTime: string;
  maxBooking: number;
  metaText: string;
  slotDuration: number;
  calendarDate: string;
  calendarDay: string;
}

export class DaySchedule extends BookingSlot {
  currentBooking: number;
  slotId: string;
}
