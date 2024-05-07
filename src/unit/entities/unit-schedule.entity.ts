import { Entity, PrimaryGeneratedColumn, Column, Check, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class UnitSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id?: string;

  @Column({ type: 'bigint', unsigned: true })
  unitId: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] })
  day: string;

  @Column({ type: 'int' })
  maxBooking: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText?: string;

  @Column({ type: 'int' })
  slotDuration: number;
}
