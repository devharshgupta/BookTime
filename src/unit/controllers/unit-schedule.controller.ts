import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { BookSchedule } from '../dto/book-schedule.dto';
import { UnitScheduleService } from '../services/unit-schedule.service';
import { ScheduleQueryDto } from './query-dtos/unit-schedule.query.dto';

@Controller('v1/unit-schedule')
export class UnitScheduleController {
  constructor(private readonly unitScheduleService: UnitScheduleService) {}

  @Get(':externalUnitId')
  async findOne(
    @Param('externalUnitId') externalUnitId: string,
    @Query() scheduleQueryDto: ScheduleQueryDto,
  ) {
    return this.unitScheduleService.getUnitSchedule(
      externalUnitId,
      scheduleQueryDto,
    );
  }

  @Patch(':externalUnitId')
  async BookSchedule(
    @Param('externalUnitId') externalUnitId: string,
    @Body() bookSchedule: BookSchedule,
  ): Promise<string> {
    return this.unitScheduleService.bookSchedule(externalUnitId, bookSchedule);
  }
}
