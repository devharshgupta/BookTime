import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/common/redis/redis.service';
import { GenerateTimeSlots } from 'src/common/utils/generateTimeSlots';
import {
  addDaysToDate,
  GetSecondsForDateFromNow,
} from 'src/common/utils/helpers';
import { Repository } from 'typeorm';
import { ScheduleQueryDto } from '../controllers/query-dtos/unit-schedule.query.dto';
import { BookSchedule } from '../dto/book-schedule.dto';
import { DaySlot } from '../dto/unit.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';
import { BookingSlot, DaySchedule } from '../types/booking.types';
import { UnitService } from './unit.service';

@Injectable()
export class UnitScheduleService {
  constructor(
    @InjectRepository(UnitSchedule)
    private readonly UnitScheduleRepository: Repository<UnitSchedule>,
    @Inject(forwardRef(() => UnitService))
    private readonly UnitService: UnitService,
    @Inject(RedisService)
    private readonly RedisService: RedisService,
  ) {}

  async findAll(): Promise<UnitSchedule[]> {
    return await this.UnitScheduleRepository.find();
  }

  async bookSchedule(
    externalUnitId: string,
    data: BookSchedule,
  ): Promise<string> {
    const unit = await this.UnitService.findOne(externalUnitId);

    if (!unit?.id) {
      throw new BadRequestException(
        `cannot find unit with externalUnitId : ${externalUnitId} `,
      );
    }

    // todo : update the response format
    return this.RedisService.updateBookingCount(data.slotId, data.bookingCount);
  }

  async getUnitSchedule(
    externalUnitId: string,
    scheduleQueryDto: ScheduleQueryDto,
  ) {
    const unit = await this.UnitService.findOne(externalUnitId);

    if (!unit?.id) {
      throw new BadRequestException(
        `cannot find unit with externalUnitId : ${externalUnitId} `,
      );
    }

    const startDate =
      scheduleQueryDto.startDate || new Date().toISOString().split('T')[0];

    const startDatePlusDays = scheduleQueryDto.plusDays || 0;
    const currentDate = new Date(startDate);
    const now = new Date();

    if (currentDate.getDate() < now.getDate()) {
      throw new BadRequestException(
        `invalid date : ${currentDate.getDate()} , cannot fetch slots for past days from now ${now.getDate()} `,
      );
    }
    // maxEndDate as defined inside unit
    const maxEndDate = addDaysToDate(currentDate, unit.slotCacheInDays);

    // maxEndDate requested by user
    const requestedEndDate = addDaysToDate(currentDate, startDatePlusDays);

    // validation
    if (requestedEndDate > maxEndDate) {
      throw new BadRequestException(
        `invalid plusDays : ${startDatePlusDays} , max value can be ${unit.slotCacheInDays} `,
      );
    }

    const allDates: string[] = [];

    for (let i = 0; i <= startDatePlusDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      allDates.push(currentDate.toISOString().split('T')[0]);
    }
    console.log(allDates);

    const promises = allDates.map(async (eachDate) => {
      try {
        const result = await this.getSlotsFromRedis(externalUnitId, eachDate);
        return result;
      } catch (error) {
        // Handle errors gracefully (optional)
        console.error(`Error in asyncFunction for value ${eachDate}:`, error);
        // You could re-throw the error, return a default value, or handle it differently
        return null; // Or any default value you prefer
      }
    });

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      // Handle errors from `Promise.all` (optional)
      console.error('Error in Promise.all:', error);
      // You could re-throw the error or handle it differently
      throw error; // Re-throw to propagate the error
    }
  }

  async getScheduleFromDb(
    externalUnitId: string,
    startDate: string,
    startDatePlusDays: number,
  ): Promise<BookingSlot[] | []> {
    const query = this.UnitScheduleRepository.createQueryBuilder(
      'unit_schedule',
    )
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

  async getSlotsFromRedis(
    externalUnitId: string,
    date: string,
  ): Promise<{ date: string; slots: DaySchedule[] }> {
    const slotForADate = await this.getIsSceduleAvailabeAtRedis(
      externalUnitId,
      date,
    );

    if (!slotForADate) {
      await this.setIsSceduleAvailabeAtRedis(externalUnitId, date);

      const dbSlots: BookingSlot[] = await this.getScheduleFromDb(
        externalUnitId,
        date,
        0,
      );

      const transformedDataForRedis = this.transformBookingSlotsForRedis(
        externalUnitId,
        dbSlots,
      );

      await this.RedisService.setMultiObjectWithTtl(transformedDataForRedis);

      return {
        date,
        slots: transformedDataForRedis.map((slot) => slot.value),
      };
    }

    const slotsFromRedis = (await this.RedisService.fetchValuesByPattern(
      `schedule:${externalUnitId}:${date}:*`,
    )) as DaySchedule[];

    // sort the slots based on startTime since we are not fetching sequentially
    slotsFromRedis.sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      if (timeA[1] !== timeB[1]) {
        return timeA[1] - timeB[1];
      }
      return timeA[2] - timeB[2];
    });

    return { date, slots: slotsFromRedis };
  }

  private transformBookingSlotsForRedis(
    externalUnitId: string,
    bookingSlots: BookingSlot[],
  ): { key: string; value: DaySchedule; ttl: number }[] {
    const transformedSlots: { key: string; value: DaySchedule; ttl: number }[] =
      [];

    bookingSlots.forEach((slot) => {
      const currentDate = new Date();
      const endDate = new Date(`${slot.calendarDate} ${slot.endTime}`);
      const timeDifference = endDate.getTime() - currentDate.getTime();
      const ttlInSeconds = Math.ceil(timeDifference / 1000); // Convert milliseconds to seconds and round up

      const key = `schedule:${externalUnitId}:${slot.calendarDate}:${slot.startTime}`;
      const value: DaySchedule = { ...slot, currentBooking: 0, slotId: key };
      transformedSlots.push({ key, value, ttl: ttlInSeconds });
    });

    return transformedSlots;
  }

  async getAggregatedSlotsByWeekDay(unitId: string): Promise<DaySlot[]> {
    const queryBuilder = this.UnitScheduleRepository.createQueryBuilder(
      'unit_schedule',
    )
      .select('weekDayName')
      .addSelect(
        `JSON_ARRAYAGG(JSON_OBJECT("startTime", TIME_FORMAT(startTime, '%H:%i:%s'), "endTime", TIME_FORMAT(endTime, '%H:%i:%s'), "maxBooking", maxBooking, "slotDuration", slotDuration, "metaText", metaText))`,
        'slots',
      )
      .where('unit_schedule.unitId = :unitId', { unitId })
      .groupBy('weekDayName');

    const data: DaySlot[] = await queryBuilder.getRawMany();
    return data;
  }

  async createUnitSchedule(
    unitId: string,
    weeklyTimings: DaySlot[],
  ): Promise<UnitSchedule[]> {
    const unitScheduleToInsert = [];
    weeklyTimings.forEach((day) => {
      day.slots.forEach((slot) => {
        const generatedTimeSlots = GenerateTimeSlots(slot);
        generatedTimeSlots.forEach((time) =>
          unitScheduleToInsert.push({
            weekDayName: day.weekDayName,
            startTime: time.startTime,
            endTime: time.endTime,
            maxBooking: time.maxBooking,
            metaText: time.metaText,
            slotDuration: time.slotDuration,
            unitId: unitId,
          }),
        );
      });
    });

    const unitSchedules =
      this.UnitScheduleRepository.create(unitScheduleToInsert);
    await this.UnitScheduleRepository.insert(unitSchedules);
    return unitSchedules;
  }

  async deleteUnitSchedule(unitId: string): Promise<void> {
    const deleteResult = await this.UnitScheduleRepository.createQueryBuilder()
      .delete()
      .from(UnitSchedule)
      .where('unitId = :unitId', { unitId: unitId })
      .execute();

    console.log(`Deleted ${deleteResult.affected} schedules for ${unitId}.`);
  }

  async getIsSceduleAvailabeAtRedis(externalUnitId: string, date: string) {
    return this.RedisService.get(
      `isScheduleAvailable:${externalUnitId}:${date}`,
    );
  }

  async setIsSceduleAvailabeAtRedis(externalUnitId: string, date: string) {
    return this.RedisService.set(
      `isScheduleAvailable:${externalUnitId}:${date}`,
      'true',
      GetSecondsForDateFromNow(date),
    );
  }

  async getIsSceduleAvailabeAtRedisForUnit(externalUnitId, pattern = '*') {
    return this.RedisService.fetchValuesByPattern(
      `isScheduleAvailable:${externalUnitId}:${pattern}`,
    );
  }

  async deleteScheculeFromRedis(externalUnitId: string) {
    return this.RedisService.deleteKeysByPattern(
      `schedule:${externalUnitId}:*`,
    );
  }

  async deleteIsScheculeAavailableFromRedis(externalUnitId: string) {
    return this.RedisService.deleteKeysByPattern(
      `isScheduleAvailable:${externalUnitId}:*`,
    );
  }
}
