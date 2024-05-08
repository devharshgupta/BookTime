import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Check,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Unit } from './unit.entity';

@Entity()
export class UnitSchedule extends AbstractEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id?: string;

  @Column({ type: 'bigint', unsigned: true })
  @Index('unitId_idx', { unique: true })
  unitId: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
  })
  day: string;

  @Column({ type: 'int' })
  maxBooking: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText?: string;

  @Column({ type: 'int' })
  slotDuration: number;
}
