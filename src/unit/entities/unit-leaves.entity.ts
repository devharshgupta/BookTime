import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Unit } from './unit.entity';


@Entity()
export class UnitLeaves {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id: string;

    @ManyToOne(() => Unit, unit => unit.unitId)
    @JoinColumn({ name: 'unitId' })
    unit: Unit;

    @Column({ type: 'datetime' })
    startDatetime: Date;

    @Column({ type: 'datetime' })
    endDatetime: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    metaText: string;
}
