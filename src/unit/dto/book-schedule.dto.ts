import { IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class BookSchedule {
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsPositive()
  @IsNotEmpty()
  bookingCount: number;
}
