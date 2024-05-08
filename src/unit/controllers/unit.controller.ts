import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUnitDto, UpdateUnitDto } from '../dto/unit.dto';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';
import { UnitService } from '../services/unit.service';
@ApiTags('Units')
@Controller('v1/unit')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  async create(
    @Body() createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; unitSchedules: UnitSchedule[] }> {
    return this.unitService.createAndSchedule(createUnitDto);
  }

  @Put('')
  async update(
    @Body() createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; unitSchedules: UnitSchedule[] }> {
    return this.unitService.updateAndSchedule(createUnitDto);
  }

  // @Get()
  // async findAll(): Promise<Unit[]> {
  //     return this.unitService.findAll();
  // }

  @Get('external/:externalUnitId')
  async findOne(
    @Param('externalUnitId') externalUnitId: string,
  ): Promise<Unit | undefined> {
    return this.unitService.findOne(externalUnitId);
  }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto): Promise<Unit | undefined> {
  //     return this.unitService.update(+id, updateUnitDto);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string): Promise<void> {
  //     await this.unitService.remove(+id);
  // }
}
