import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from 'src/common/redis/redis.service';
import { Repository } from 'typeorm';
import {
  CreateUnitDto,
  DaySlot,
  UnitDto,
  UpdateUnitDto,
} from '../dto/unit.dto';
import { Unit } from '../entities/unit.entity';
import { UnitScheduleService } from './unit-schedule.service';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    @Inject(forwardRef(() => UnitScheduleService))
    private readonly UnitScheduleService: UnitScheduleService,
    @Inject(RedisService)
    private readonly RedisService: RedisService,
  ) {}

  async createAndSchedule(
    createUnitDto: CreateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[] }> {
    const existingUnit = await this.findOne(createUnitDto.unit.externalUnitId);

    if (existingUnit?.id) {
      throw new BadRequestException(
        `unit already exists with unitId: ${existingUnit?.id}`,
      );
    }

    const unit = await this.createUnit(createUnitDto.unit);

    // create unit schedule
    await this.UnitScheduleService.createUnitSchedule(
      unit?.id,
      createUnitDto.weeklyTimings,
    );

    const updatedSchedule =
      await this.UnitScheduleService.getAggregatedSlotsByWeekDay(unit.id);

    return {
      unit: unit,
      weeklyTimings: updatedSchedule,
    };
  }

  async updateAndSchedule(
    updateUnitDto: UpdateUnitDto,
  ): Promise<{ unit: Unit; weeklyTimings: DaySlot[]; forceUpdate: boolean }> {
    const updatedUnit = await this.updateUnit(updateUnitDto.unit);

    if (
      updateUnitDto.weeklyTimings &&
      Array.isArray(updateUnitDto.weeklyTimings)
    ) {
      if (updateUnitDto?.forceUpdate) {
        await this.UnitScheduleService.deleteIsScheculeAavailableFromRedis(
          updateUnitDto.unit.externalUnitId,
        );

        await this.UnitScheduleService.deleteScheculeFromRedis(
          updateUnitDto.unit.externalUnitId,
        );
      }

      await this.UnitScheduleService.deleteUnitSchedule(updatedUnit.id);
      await this.UnitScheduleService.createUnitSchedule(
        updatedUnit.id,
        updateUnitDto.weeklyTimings,
      );
    }

    const updatedSchedule =
      await this.UnitScheduleService.getAggregatedSlotsByWeekDay(
        updatedUnit.id,
      );

    return {
      unit: updatedUnit,
      weeklyTimings: updatedSchedule,
      forceUpdate: updateUnitDto.forceUpdate,
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

      if (!dbUnitData?.id) {
        return undefined;
      }

      await this.RedisService.set(
        `externalUnit:${externalUnitId}`,
        dbUnitData,
        3600, // caching data for 1 hr
      );
      return dbUnitData;
    }

    return JSON.parse(cachedUnitData) as unknown as Unit;
  }

  async createUnit(data: UnitDto): Promise<Unit> {
    const unit = this.unitRepository.create(data);
    await this.unitRepository.save(unit);
    return unit;
  }

  async updateUnit(data: UnitDto): Promise<Unit> {
    const existingUnit = await this.findOne(data?.externalUnitId);

    if (!existingUnit.id) {
      throw new BadRequestException(
        `no unit found with externalUnitId : ${data?.externalUnitId}`,
      );
    }

    await this.unitRepository
      .createQueryBuilder()
      .update(Unit)
      .set(data)
      .where('externalUnitId = :externalUnitId', {
        externalUnitId: data.externalUnitId,
      })
      .execute();

    await this.unitRepository.save(Object.assign(existingUnit, data));

    const updatedUnit = await this.unitRepository.findOne({
      where: { externalUnitId: data.externalUnitId },
    });

    // cache refresh
    await this.RedisService.set(
      `externalUnit:${updatedUnit.externalUnitId}`,
      updatedUnit,
      3600, // caching data for 1 hr
    );

    return updatedUnit;
  }
}
