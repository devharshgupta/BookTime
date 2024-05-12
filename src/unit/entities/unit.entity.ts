import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity()
export class Unit extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index('unique_externalUnitId', { unique: true })
  externalUnitId: string;

  @Column({ type: 'date' })
  @Index('idx_startDate')
  startDate: string;

  @Column({ type: 'date' })
  @Index('idx_endDate')
  endDate: string;

  @Column({ type: 'tinyint', unsigned: true, default: 7 })
  slotCacheInDays: number; // total days slots to keep in cache

  @Column({ type: 'varchar', length: 45 })
  type: string;
}
