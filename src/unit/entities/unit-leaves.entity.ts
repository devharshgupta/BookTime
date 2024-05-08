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

  @Column({ type: 'datetime' })
  startDatetime: Date;

  @Column({ type: 'datetime' })
  endDatetime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText: string;
}
