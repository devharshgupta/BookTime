export class CreateUnitScheduleDto {
    unitId: number;
    startTime: string;
    endTime: string;
    day: string;
    maxBooking?: number;
    metaText?: string;
    slotDuration?: number;
}

export class UpdateUnitScheduleDto {
    startTime?: string;
    endTime?: string;
    day?: string;
    maxBooking?: number;
    metaText?: string;
    slotDuration?: number;
}
