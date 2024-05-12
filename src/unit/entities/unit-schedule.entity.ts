import { DayName } from 'src/common/constant/constant';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class UnitSchedule extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true })
  @Index('unitId_idx')
  unitId: string;

  @Column({ type: 'time' })
  @Index('idx_startTime')
  startTime: string;

  @Column({ type: 'time' })
  @Index('idx_endTime')
  endTime: string;

  @Column({
    type: 'enum',
    enum: DayName,
  })
  @Index('idx_DayName')
  weekDayName: DayName;

  @Column({ type: 'int' })
  maxBooking: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText?: string;

  @Column({ type: 'int' })
  slotDuration: number;
}
