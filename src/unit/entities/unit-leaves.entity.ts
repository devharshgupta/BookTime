import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity()
export class UnitLeaves extends BaseEntity {
  @Column({ type: 'bigint', unsigned: true })
  @Index('unitId_idx', { unique: true })
  unitId: string;

  @Column({ type: 'date' })
  @Index('idx_startDate')
  startDate: string;

  @Column({ type: 'date' })
  @Index('idx_endDate')
  endDate: string;

  @Column({ type: 'time' })
  @Index('idx_startTime')
  startTime: string;

  @Column({ type: 'time' })
  @Index('idx_endTime')
  endTime: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaText: string;
}
