import { SlotTime } from 'src/unit/dto/unit.dto';

export function GenerateTimeSlots(options: SlotTime): SlotTime[] {
  const { startTime, endTime, slotDuration } = options;
  const slots: SlotTime[] = [];

  let currentSlot = new Date(`2000-01-01T${startTime}:00`);
  const endSlot = new Date(`2000-01-01T${endTime}:00`);

  while (currentSlot < endSlot) {
    const nextSlot = new Date(currentSlot);
    nextSlot.setMinutes(nextSlot.getMinutes() + slotDuration);
    slots.push({
      startTime: currentSlot.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTime: nextSlot.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      maxBooking: options.maxBooking,
      slotDuration: options.slotDuration,
      metaText: options?.metaText,
    });
    currentSlot = nextSlot;
  }

  return slots;
}
