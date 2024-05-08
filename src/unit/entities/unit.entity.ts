import { Entity, Column, Unique, PrimaryGeneratedColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../common/entities/abstract.entity';

@Entity()
export class Unit extends AbstractEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  unitId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('unique_externalUnitId', { unique: true })
  externalUnitId: string;

  @Column({ type: 'datetime' })
  startDatetime: Date;

  @Column({ type: 'datetime' })
  endDatetime: Date;

  @Column({ type: 'tinyint', unsigned: true, default: 7 })
  slotCacheInDays: number; // total days slots to keep in cache

  @Column({ type: 'varchar', length: 45 })
  type: string;
}
