import { Controller } from '@nestjs/common';
import { UnitScheduleService } from '../services/unit-schedule.service';

@Controller('unit-schedule')
export class UnitScheduleController {
  constructor(private readonly unitScheduleService: UnitScheduleService) {}

  // @Get()
  // async findAll(): Promise<UnitSchedule[]> {
  //     return this.unitScheduleService.findAll();
  // }

  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<UnitSchedule | undefined> {
  //     return this.unitScheduleService.findOne(+id);
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() updateUnitScheduleDto: UpdateUnitScheduleDto): Promise<UnitSchedule | undefined> {
  //     return this.unitScheduleService.update(id, updateUnitScheduleDto);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string): Promise<void> {
  //     await this.unitScheduleService.remove(+id);
  // }
}
