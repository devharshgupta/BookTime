import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUnitLeaveDto, UpdateUnitLeaveDto } from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';


@Injectable()
export class UnitLeavesService {
    constructor(
        @InjectRepository(UnitLeaves)
        private unitLeavesRepository: Repository<UnitLeaves>,
    ) { }

    async create(createUnitLeaveDto: CreateUnitLeaveDto): Promise<UnitLeaves> {
        const unitLeave = this.unitLeavesRepository.create(createUnitLeaveDto);
        return await this.unitLeavesRepository.save(unitLeave);
    }

    async findAll(): Promise<UnitLeaves[]> {
        return await this.unitLeavesRepository.find();
    }

    // async findOne(id: number): Promise<UnitLeaves | undefined> {
    //     return await this.unitLeavesRepository.findOne(id);
    // }

    // async update(id: number, updateUnitLeaveDto: UpdateUnitLeaveDto): Promise<UnitLeaves | undefined> {
    //     const unitLeave = await this.unitLeavesRepository.findOne(id);
    //     if (!unitLeave) {
    //         return undefined;
    //     }
    //     const updatedUnitLeave = Object.assign(unitLeave, updateUnitLeaveDto);
    //     return await this.unitLeavesRepository.save(updatedUnitLeave);
    // }

    // async remove(id: number): Promise<void> {
    //     await this.unitLeavesRepository.delete(id);
    // }
}
