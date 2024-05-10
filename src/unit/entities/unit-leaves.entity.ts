import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Unit } from './unit.entity';

@Entity()
export class UnitLeaves extends AbstractEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'bigint', unsigned: true })
  @Index('unitId_idx', { unique: true })
  unitId: string;

  @Column({ type: 'date' })
  @Index('idx_startDate')
  startDate: Date;

  @Column({ type: 'date' })
  @Index('idx_endDate')
  endDate: Date;

  @Column({ type: 'time' })
  @Index('idx_startTime')
  startTime: string;

  @Column({ type: 'time' })
  @Index('idx_endTime')
  endTime: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText: string;
}
