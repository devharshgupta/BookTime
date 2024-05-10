import { DayName } from 'src/common/constant/constant';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';

@Entity()
export class UnitSchedule extends AbstractEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id?: string;

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
  day: DayName;

  @Column({ type: 'int' })
  maxBooking: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText?: string;

  @Column({ type: 'int' })
  slotDuration: number;
}
