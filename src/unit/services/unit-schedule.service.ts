import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUnitScheduleDto, UpdateUnitScheduleDto } from '../dto/unit-schedule.dto';
import { UnitSchedule } from '../entities/unit-schedule.entity';


@Injectable()
export class UnitScheduleService {
    constructor(
        @InjectRepository(UnitSchedule)
        private unitScheduleRepository: Repository<UnitSchedule>,
    ) { }

    // async create(createUnitScheduleDto: CreateUnitScheduleDto): Promise<UnitSchedule> {
    //     const unitSchedule = this.unitScheduleRepository.create(createUnitScheduleDto);
    //     return await this.unitScheduleRepository.save(unitSchedule);
    // }

    async findAll(): Promise<UnitSchedule[]> {
        return await this.unitScheduleRepository.find();
    }

    // async findOne(id: number): Promise<UnitSchedule | undefined> {
    //     return await this.unitScheduleRepository.findOne(id);
    // }

    // async update(unitId: string, updateUnitScheduleDto: UpdateUnitScheduleDto): Promise<UnitSchedule | undefined> {
    //     const unitSchedule = await this.unitScheduleRepository.findOne(unitId);
    //     if (!unitSchedule) {
    //         return undefined;
    //     }
    //     const updatedUnitSchedule = Object.assign(unitSchedule, updateUnitScheduleDto);
    //     return await this.unitScheduleRepository.save(updatedUnitSchedule);
    // }

    // async remove(id: number): Promise<void> {
    //     await this.unitScheduleRepository.delete(id);
    // }
}
