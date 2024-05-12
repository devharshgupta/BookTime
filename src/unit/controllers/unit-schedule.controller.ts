import { Controller, Get, Param } from '@nestjs/common';
import { UnitScheduleService } from '../services/unit-schedule.service';

@Controller('v1/unit-schedule')
export class UnitScheduleController {
  constructor(private readonly unitScheduleService: UnitScheduleService) {}

  // TODO : add query range
  @Get(':externalUnitId')
  async findOne(@Param('externalUnitId') externalUnitId: string) {
    return this.unitScheduleService.getUnitSchedule(externalUnitId);
  }
}
