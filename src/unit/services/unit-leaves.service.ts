import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PageOptionsDto } from 'src/common/dto/page-option.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { DeleteResult, Repository } from 'typeorm';
import { UnitLeaveQuery } from '../controllers/query-dtos/unit-leave.query.dto';
import {
  createOrUpdateUnitLeaveDto,
  deleteUnitLeaveDto,
} from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { Unit } from '../entities/unit.entity';
import { UnitScheduleService } from './unit-schedule.service';
import { UnitService } from './unit.service';

@Injectable()
export class UnitLeavesService {
  constructor(
    @InjectRepository(UnitLeaves)
    private unitLeavesRepository: Repository<UnitLeaves>,
    @Inject(UnitService)
    private readonly UnitService: UnitService,
    @Inject(UnitScheduleService)
    private readonly UnitScheduleService: UnitScheduleService,
  ) {}

  async create(
    createUnitLeaveDto: createOrUpdateUnitLeaveDto,
  ): Promise<UnitLeaves> {
    // check if the unit exists or not
    const unit = await this.UnitService.findOne(
      createUnitLeaveDto.externalUnitId,
    );

    if (!unit?.id) {
      throw new BadRequestException(
        `No unit doesnot exists with externalUnitId : ${createUnitLeaveDto.externalUnitId}`,
      );
    }

    const allDates: string[] = [];

    const startDate = new Date(createUnitLeaveDto.startDate);
    const endDate = new Date(createUnitLeaveDto.endDate);

    while (startDate <= endDate) {
      allDates.push(startDate.toISOString().split('T')[0]);
      startDate.setDate(startDate.getDate() + 1);
    }

    const isSceduleAvailabeAtRedisForLeaveDates = (
      await Promise.all(
        allDates.map(async (singleDate) => {
          const isAvailable =
            await this.UnitScheduleService.getIsSceduleAvailabeAtRedis(
              createUnitLeaveDto.externalUnitId,
              singleDate,
            );
          if (isAvailable == 'true') {
            return singleDate;
          }
          return null;
        }),
      )
    ).filter((date) => date !== null);

    console.log(isSceduleAvailabeAtRedisForLeaveDates);

    if (
      Array.isArray(isSceduleAvailabeAtRedisForLeaveDates) &&
      isSceduleAvailabeAtRedisForLeaveDates.length &&
      !createUnitLeaveDto.forceLeaveCreation
    ) {
      throw new BadRequestException(
        `schedule already exists for  dates (${isSceduleAvailabeAtRedisForLeaveDates.join(
          ',',
        )}) , if required use forceLeaveCreation=true flag this will delete all existing bookings`,
      );
    }

    // creating leaves
    const unitLeave = this.unitLeavesRepository.create(createUnitLeaveDto);
    unitLeave.unitId = unit.id;

    const cretedLeave = await this.unitLeavesRepository.save(unitLeave);

    await Promise.all(
      isSceduleAvailabeAtRedisForLeaveDates.map(async (date) => {
        await this.UnitScheduleService.deleteIsScheculeAavailableFromRedis(
          createUnitLeaveDto.externalUnitId,
          date,
        );

        console.log(date);
        await this.UnitScheduleService.deleteScheculeFromRedis(
          createUnitLeaveDto.externalUnitId,
          `${date}:*`,
        );
      }),
    );

    return cretedLeave;
  }

  async findAll(
    externalUnitId: string,
    query: UnitLeaveQuery,
  ): Promise<PageDto<UnitLeaves>> {
    const queryBuilder =
      this.unitLeavesRepository.createQueryBuilder('UnitLeaves');

    console.log(query);

    switch (true) {
      case query.id != '': {
        queryBuilder
          .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
          .where('externalUnitId = :externalUnitId', { externalUnitId })
          .andWhere('UnitLeaves.id = :id', { id: query?.id })
          .getOne();
        break;
      }

      case !!query?.startDate && !!query?.endDate: {
        queryBuilder
          .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
          .where('externalUnitId = :externalUnitId', { externalUnitId })
          .where(
            'UnitLeaves.startDate >= :startDate and  UnitLeaves.endDate <= :endDate',
            {
              startDate: query.startDate,
              endDate: query.endDate,
            },
          );
        break;
      }

      case !!query?.startDate: {
        queryBuilder
          .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
          .where('externalUnitId = :externalUnitId', { externalUnitId })
          .where('UnitLeaves.startDate >= :startDate', {
            startDate: query.startDate?.split('T')[0],
          });
        break;
      }

      case !!query?.endDate: {
        queryBuilder
          .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
          .where('externalUnitId = :externalUnitId', { externalUnitId })
          .where('UnitLeaves.endDate <= :endDate', {
            startDate: query.endDate,
          });
        break;
      }

      default: {
        queryBuilder
          .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
          .where('externalUnitId = :externalUnitId', { externalUnitId });
      }
    }

    // Apply pagination (skip and take)
    const [entities, itemCount] = await queryBuilder
      .orderBy('UnitLeaves.createdAt', query?.order)
      .skip(query?.skip)
      .take(query?.limit)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: {
        skip: query.skip,
        limit: query.limit,
        order: query.order,
        page: query.page,
      },
    });
    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string, externalUnitId: string): Promise<UnitLeaves> {
    const queryBuilder =
      this.unitLeavesRepository.createQueryBuilder('UnitLeaves');

    const result = await queryBuilder
      .innerJoinAndSelect(Unit, 'unit', 'unit.id =UnitLeaves.unitId')
      .where('externalUnitId = :externalUnitId', { externalUnitId })
      .andWhere('UnitLeaves.id = :id', { id })
      .getOne();

    if (!result?.id) {
      throw new NotFoundException(
        `No Leave found on externalUnitId :${externalUnitId} with Id : ${id} `,
      );
    }

    return result;
  }

  async UpdateOne(
    id: string,
    updateUnitLeaveDto: createOrUpdateUnitLeaveDto,
  ): Promise<UnitLeaves> {
    const unitLeaveToUpdate = await this.findOne(
      id,
      updateUnitLeaveDto.externalUnitId,
    );

    if (!unitLeaveToUpdate?.id) {
      throw new NotFoundException(
        `No Leave found on externalUnitId :${updateUnitLeaveDto.externalUnitId} with Id : ${id} `,
      );
    }

    const allDates: string[] = [];

    const startDate = new Date(updateUnitLeaveDto.startDate);
    const endDate = new Date(updateUnitLeaveDto.endDate);

    while (startDate <= endDate) {
      allDates.push(startDate.toISOString().split('T')[0]);
      startDate.setDate(startDate.getDate() + 1);
    }

    const isSceduleAvailabeAtRedisForLeaveDates = (
      await Promise.all(
        allDates.map(async (singleDate) => {
          const isAvailable =
            await this.UnitScheduleService.getIsSceduleAvailabeAtRedis(
              updateUnitLeaveDto.externalUnitId,
              singleDate,
            );
          if (isAvailable == 'true') {
            return singleDate;
          }
          return null;
        }),
      )
    ).filter((date) => date !== null);

    console.log(isSceduleAvailabeAtRedisForLeaveDates);

    if (
      Array.isArray(isSceduleAvailabeAtRedisForLeaveDates) &&
      isSceduleAvailabeAtRedisForLeaveDates.length &&
      !updateUnitLeaveDto.forceLeaveCreation
    ) {
      throw new BadRequestException(
        `schedule already exists for  dates (${isSceduleAvailabeAtRedisForLeaveDates.join(
          ',',
        )}) , if required use forceLeaveCreation=true flag this will delete all existing bookings`,
      );
    }

    // Update entity properties
    Object.assign(unitLeaveToUpdate, updateUnitLeaveDto);
    const updatedUnitLeave = await this.unitLeavesRepository.save(
      unitLeaveToUpdate,
    );

    await Promise.all(
      isSceduleAvailabeAtRedisForLeaveDates.map(async (date) => {
        await this.UnitScheduleService.deleteIsScheculeAavailableFromRedis(
          updateUnitLeaveDto.externalUnitId,
          date,
        );

        console.log(date);
        await this.UnitScheduleService.deleteScheculeFromRedis(
          updateUnitLeaveDto.externalUnitId,
          `${date}:*`,
        );
      }),
    );
    return updatedUnitLeave;
  }

  async DeleteOne(
    id: string,
    deleteUnitLeaveDto: deleteUnitLeaveDto,
  ): Promise<DeleteResult> {
    const unitLeaveToUpdate = await this.findOne(
      id,
      deleteUnitLeaveDto.externalUnitId,
    );

    if (!unitLeaveToUpdate?.id) {
      throw new NotFoundException(
        `No Leave found on externalUnitId :${deleteUnitLeaveDto.externalUnitId} with Id : ${id} `,
      );
    }

    const allDates: string[] = [];
    const startDate = new Date(unitLeaveToUpdate.startDate);
    const endDate = new Date(unitLeaveToUpdate.endDate);

    while (startDate <= endDate) {
      allDates.push(startDate.toISOString().split('T')[0]);
      startDate.setDate(startDate.getDate() + 1);
    }

    const isSceduleAvailabeAtRedisForLeaveDates = (
      await Promise.all(
        allDates.map(async (singleDate) => {
          const isAvailable =
            await this.UnitScheduleService.getIsSceduleAvailabeAtRedis(
              deleteUnitLeaveDto.externalUnitId,
              singleDate,
            );
          if (isAvailable == 'true') {
            return singleDate;
          }
          return null;
        }),
      )
    ).filter((date) => date !== null);

    console.log(isSceduleAvailabeAtRedisForLeaveDates);

    if (
      Array.isArray(isSceduleAvailabeAtRedisForLeaveDates) &&
      isSceduleAvailabeAtRedisForLeaveDates.length &&
      !deleteUnitLeaveDto?.forceLeaveDeletion
    ) {
      throw new BadRequestException(
        `schedule already exists for  dates (${isSceduleAvailabeAtRedisForLeaveDates.join(
          ',',
        )}) , if required use forceLeaveDeletion=true flag this will delete all existing bookings`,
      );
    }

    // Save the updated entity
    return this.unitLeavesRepository.delete(id);
  }
}
