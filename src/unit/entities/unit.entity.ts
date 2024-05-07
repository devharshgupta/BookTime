import { Entity, Column, Unique, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class Unit {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  unitId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('unique_externalUnitId', { unique: true })
  externalUnitId: string;

  @Column({ type: 'datetime' })
  slotStartDatetime: Date;

  @Column({ type: 'datetime' })
  slotEndDatetime: Date;

  @Column({ type: 'tinyint', unsigned: true, default: 7 })
  slotFetchSizeInDays: number;

  @Column({ type: 'varchar', length: 45 })
  type: string;

  // TODO : to add cache slots key
}
