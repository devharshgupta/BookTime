import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitLeavesController } from './controllers/unit-leaves.controller';
import { UnitScheduleController } from './controllers/unit-schedule.controller';
import { UnitController } from './controllers/unit.controller';
import { UnitLeaves } from './entities/unit-leaves.entity';
import { UnitSchedule } from './entities/unit-schedule.entity';
import { Unit } from './entities/unit.entity';
import { UnitLeavesService } from './services/unit-leaves.service';
import { UnitScheduleService } from './services/unit-schedule.service';
import { UnitService } from './services/unit.service';


@Module({
  imports: [TypeOrmModule.forFeature([Unit, UnitSchedule, UnitLeaves])],
  controllers: [UnitController, UnitScheduleController, UnitLeavesController],
  providers: [UnitService, UnitScheduleService, UnitLeavesService],
})
export class UnitModule { }
