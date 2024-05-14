import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/common/redis/redis.service';
import { GenerateTimeSlots } from 'src/common/utils/generateTimeSlots';
import { Repository } from 'typeorm';
import { CreateUnitDto } from '../dto/unit.dto';
import { UnitSchedule } from '../entities/unit-schedule.entity';
import { Unit } from '../entities/unit.entity';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    @InjectRepository(UnitSchedule)
    private UnitScheduleRepository: Repository<UnitSchedule>,
    @Inject(RedisService)
    private readonly RedisService: RedisService,
  ) {}

  async createAndSchedule(
    createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; unitSchedules: UnitSchedule[] }> {
    const unit = this.unitRepository.create(createUnitDto);
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

    return {
      unit,
      unitSchedules,
    };
  }

  async updateAndSchedule(
    createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; unitSchedules: UnitSchedule[] }> {
    const weeklyTimings = createUnitDto.weeklyTimings;
    delete createUnitDto.weeklyTimings;

    await this.unitRepository
      .createQueryBuilder()
      .update(Unit)
      .set(createUnitDto)
      .where('externalUnitId = :externalUnitId', {
        externalUnitId: createUnitDto.externalUnitId,
      })
      .execute();

    const existingUnit = await this.unitRepository.findOne({
      where: { externalUnitId: createUnitDto.externalUnitId },
    });

    if (!existingUnit.id) {
      throw new BadRequestException(
        `no unit found with externalUnitId : ${createUnitDto.externalUnitId}`,
      );
    }

    const updatedSchedule = Object.assign(existingUnit, CreateUnitDto);
    await this.unitRepository.save(updatedSchedule);

    const unit = await this.unitRepository.findOne({
      where: { externalUnitId: createUnitDto.externalUnitId },
    });

    const unitScheduleToInsert = [];
    weeklyTimings.forEach((day) => {
      day.slots.forEach((time) => {
        unitScheduleToInsert.push({
          weekDayName: day.weekDayName,
          startTime: time.startTime,
          endTime: time.endTime,
          maxBooking: time.maxBooking,
          metaText: time.metaText,
          slotDuration: time.slotDuration,
          unit,
        });
      });
    });
    const deleteResult = await this.UnitScheduleRepository.createQueryBuilder()
      .delete()
      .from(UnitSchedule)
      .where('unitId = :unitId', { unitId: unit.id })
      .execute();

    console.log(`Deleted ${deleteResult.affected} schedules for ${unit.id}.`);

    const unitSchedules =
      this.UnitScheduleRepository.create(unitScheduleToInsert);
    await this.UnitScheduleRepository.insert(unitSchedules);

    return {
      unit,
      unitSchedules,
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

  // async remove(id: number): Promise<void> {
  //     await this.unitRepository.delete(id);
  // }
}
