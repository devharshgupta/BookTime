import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/common/redis/redis.service';
import { Repository } from 'typeorm';
import { ScheduleQueryDto } from '../controllers/query-dtos/unit-schedule.query.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';
import { BookingSlot } from '../types/booking.types';

@Injectable()
export class UnitScheduleService {
  constructor(
    @InjectRepository(UnitSchedule)
    private readonly unitScheduleRepository: Repository<UnitSchedule>,
    @Inject(RedisService)
    private readonly RedisService: RedisService,
  ) {}

  async findAll(): Promise<UnitSchedule[]> {
    return await this.unitScheduleRepository.find();
  }

  async getUnitSchedule(
    externalUnitId: string,
    scheduleQueryDto: ScheduleQueryDto,
  ) {
    const startDate =
      scheduleQueryDto.startDate || new Date().toISOString().split('T')[0];
    const startDatePlusDays = scheduleQueryDto.plusDays || 0;

    const query = this.unitScheduleRepository
      .createQueryBuilder('unit_schedule')
      .select([
        'unit_schedule.startTime as startTime ',
        'unit_schedule.endTime as endTime',
        'unit_schedule.maxBooking as maxBooking',
        'unit_schedule.metaText as metaText',
        'unit_schedule.slotDuration as slotDuration',
        "DATE_FORMAT(calendarDate, '%Y-%m-%d') AS calendarDate",
        'calendarDay',
      ])
      .innerJoin(
        'calendar',
        'calendar',
        'calendar.calendarDay = unit_schedule.weekDayName',
      )
      .innerJoin(Unit, 'unit', 'unit_schedule.unitId = unit.id')
      .leftJoin(UnitLeaves, 'unit_leaves', 'unit.id = unit_leaves.unitId')
      .where('unit.externalUnitId = :externalUnitId', { externalUnitId })
      .andWhere('unit.isActive = true')
      .andWhere(
        'calendar.calendarDate BETWEEN :startDate AND DATE_ADD(:startDate, INTERVAL :startDatePlusDays DAY)',
        {
          startDate,
          startDatePlusDays,
        },
      )
      .andWhere('calendar.calendarDate BETWEEN unit.startDate AND unit.endDate')
      .andWhere(
        '(unit_leaves.unitId IS NULL OR ' +
          '((unit_leaves.startDate > calendar.calendarDate) OR ' +
          '(unit_leaves.endDate < calendar.calendarDate) OR ' +
          '(unit_leaves.startDate = calendar.calendarDate AND unit_schedule.startTime < unit_leaves.startTime) OR ' +
          '(unit_leaves.endDate <= calendar.calendarDate AND unit_schedule.startTime > unit_leaves.endTime)))',
      )
      .orderBy('calendar.calendarDate')
      .addOrderBy('unit_schedule.startTime');

    const results: BookingSlot[] = await query.getRawMany();

    return results;
  }
}
