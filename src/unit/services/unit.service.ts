import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/common/redis/redis.service';
import { GenerateTimeSlots } from 'src/common/utils/generateTimeSlots';
import { Repository } from 'typeorm';
import { CreateUnitDto, DaySlot, UpdateUnitDto } from '../dto/unit.dto';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';
import { UnitScheduleService } from './unit-schedule.service';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    @InjectRepository(UnitSchedule)
    private UnitScheduleRepository: Repository<UnitSchedule>,
    @Inject(forwardRef(() => UnitScheduleService))
    private UnitScheduleService: UnitScheduleService,
    @Inject(RedisService)
    private readonly RedisService: RedisService,
  ) {}

  async createAndSchedule(
    createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[] }> {
    const existingUnit = await this.unitRepository.findOne({
      where: { externalUnitId: createUnitDto.unit.externalUnitId },
    });

    if (existingUnit?.id) {
      throw new BadRequestException(
        `unit already exists with unitId: ${existingUnit?.id}`,
      );
    }

    const unit = this.unitRepository.create(createUnitDto.unit);
    await this.unitRepository.save(unit);

    const unitScheduleToInsert = [];
    createUnitDto.weeklyTimings.forEach((day) => {
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
            unitId: unit?.id,
          }),
        );
      });
    });

    const unitSchedules =
      this.UnitScheduleRepository.create(unitScheduleToInsert);
    await this.UnitScheduleRepository.insert(unitSchedules);

    const updatedSchedule =
      await this.UnitScheduleService.getAggregatedSlotsByWeekDay(unit.id);

    return {
      unit: unit,
      weeklyTimings: updatedSchedule,
    };
  }

  // TODO : Add check to get schedule from redis, update it , or only update future schedule
  async updateAndSchedule(
    updateUnitDto: UpdateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[] }> {
    const existingUnit = await this.unitRepository.findOne({
      where: { externalUnitId: updateUnitDto.unit.externalUnitId },
    });

    if (!existingUnit.id) {
      throw new BadRequestException(
        `no unit found with externalUnitId : ${updateUnitDto.unit.externalUnitId}`,
      );
    }

    await this.unitRepository
      .createQueryBuilder()
      .update(Unit)
      .set(updateUnitDto.unit)
      .where('externalUnitId = :externalUnitId', {
        externalUnitId: updateUnitDto.unit.externalUnitId,
      })
      .execute();

    await this.unitRepository.save(
      Object.assign(existingUnit, updateUnitDto.unit),
    );

    const updatedUnit = await this.unitRepository.findOne({
      where: { externalUnitId: updateUnitDto.unit.externalUnitId },
    });

    await this.RedisService.set(
      `externalUnit:${updatedUnit.externalUnitId}`,
      updatedUnit,
      3600, // caching data for 1 hr
    );

    if (
      updateUnitDto.weeklyTimings &&
      Array.isArray(updateUnitDto.weeklyTimings)
    ) {
      const unitScheduleToInsert = [];
      updateUnitDto.weeklyTimings.forEach((day) => {
        day.slots.forEach((time) => {
          unitScheduleToInsert.push({
            weekDayName: day.weekDayName,
            startTime: time.startTime,
            endTime: time.endTime,
            maxBooking: time.maxBooking,
            metaText: time.metaText,
            slotDuration: time.slotDuration,
            unitid: existingUnit.id,
          });
        });
      });
      const deleteResult =
        await this.UnitScheduleRepository.createQueryBuilder()
          .delete()
          .from(UnitSchedule)
          .where('unitId = :unitId', { unitId: updatedUnit.id })
          .execute();

      console.log(
        `Deleted ${deleteResult.affected} schedules for ${updatedUnit.id}.`,
      );

      const unitSchedules =
        this.UnitScheduleRepository.create(unitScheduleToInsert);
      await this.UnitScheduleRepository.insert(unitSchedules);
    }

    const updatedSchedule =
      await this.UnitScheduleService.getAggregatedSlotsByWeekDay(
        existingUnit.id,
      );

    return {
      unit: updatedUnit,
      weeklyTimings: updatedSchedule,
    };
  }

  async findOne(externalUnitId: string): Promise<Unit | undefined> {
    const cachedUnitData = await this.RedisService.get(
      `externalUnit:${externalUnitId}`,
    );

    if (!cachedUnitData) {
      const dbUnitData = await this.unitRepository.findOne({
        where: { externalUnitId },
      });
      await this.RedisService.set(
        `externalUnit:${externalUnitId}`,
        dbUnitData,
        3600, // caching data for 1 hr
      );
      return dbUnitData;
    }

    return JSON.parse(cachedUnitData) as unknown as Unit;
  }
}
