import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUnitDto, DaySlot, UpdateUnitDto } from '../dto/unit.dto';
import { Unit } from '../entities/unit.entity';
import { UnitService } from '../services/unit.service';
@ApiTags('Units')
@Controller('v1/unit')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  async create(
    @Body() createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[] }> {
    return this.unitService.createAndSchedule(createUnitDto);
  }

  @Put('')
  async update(
    @Body() updateUnitDto: UpdateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[] }> {
    return this.unitService.updateAndSchedule(updateUnitDto);
  }

  @Get('external/:externalUnitId')
  async findOne(
    @Param('externalUnitId') externalUnitId: string,
  ): Promise<Unit | undefined> {
    return this.unitService.findOne(externalUnitId);
  }
}
