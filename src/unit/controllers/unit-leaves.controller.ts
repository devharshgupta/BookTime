import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CreateUnitLeaveDto, UpdateUnitLeaveDto } from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { UnitLeavesService } from '../services/unit-leaves.service';


@Controller('unit-leaves')
export class UnitLeavesController {
    constructor(private readonly unitLeavesService: UnitLeavesService) { }

    @Post()
    async create(@Body() createUnitLeaveDto: CreateUnitLeaveDto): Promise<UnitLeaves> {
        return this.unitLeavesService.create(createUnitLeaveDto);
    }

    @Get()
    async findAll(): Promise<UnitLeaves[]> {
        return this.unitLeavesService.findAll();
    }

    // @Get(':id')
    // async findOne(@Param('id') id: string): Promise<UnitLeaves | undefined> {
    //     return this.unitLeavesService.findOne(+id);
    // }

    // @Put(':id')
    // async update(@Param('id') id: string, @Body() updateUnitLeaveDto: UpdateUnitLeaveDto): Promise<UnitLeaves | undefined> {
    //     return this.unitLeavesService.update(+id, updateUnitLeaveDto);
    // }

    // @Delete(':id')
    // async remove(@Param('id') id: string): Promise<void> {
    //     await this.unitLeavesService.remove(+id);
    // }
}
