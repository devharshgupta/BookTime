import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PageOptionsDto } from 'src/common/dto/page-option.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { DeleteResult, Repository } from 'typeorm';
import { UnitLeaveDto } from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { Unit } from '../entities/unit.entity';

@Injectable()
export class UnitLeavesService {
  constructor(
    @InjectRepository(UnitLeaves)
    private unitLeavesRepository: Repository<UnitLeaves>,

    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
  ) {}

  async create(createUnitLeaveDto: UnitLeaveDto): Promise<UnitLeaves> {
    // To check if the unit exists or not
    const unit = await this.unitRepository.findOne({
      where: { externalUnitId: createUnitLeaveDto.externalUnitId },
    });

    if (!unit?.id) {
      throw new BadRequestException(
        `No unit doesnot exists with externalUnitId : ${createUnitLeaveDto.externalUnitId}`,
      );
    }

    // Todo - to check if the leaves is before the unit slotCacheInDays if it is then you need to clear cache from redis
    // Todo - to check if the leave of the day where booking is already made in the cache
    const unitLeave = this.unitLeavesRepository.create(createUnitLeaveDto);
    unitLeave.unitId = unit.id;
    return await this.unitLeavesRepository.save(unitLeave);
  }

  async findAll(
    externalUnitId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<UnitLeaves>> {
    const queryBuilder =
      this.unitLeavesRepository.createQueryBuilder('UnitLeaves');

    queryBuilder
      .innerJoinAndSelect(Unit, 'unit', 'unit.unitId =UnitLeaves.unitId')
      .where('externalUnitId = :externalUnitId', { externalUnitId });

    // Apply pagination (skip and take)
    const [entities, itemCount] = await queryBuilder
      .orderBy('UnitLeaves.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.limit)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string, externalUnitId: string): Promise<UnitLeaves> {
    const queryBuilder =
      this.unitLeavesRepository.createQueryBuilder('UnitLeaves');

    const result = await queryBuilder
      .innerJoinAndSelect(Unit, 'unit', 'unit.unitId =UnitLeaves.unitId')
      .where('externalUnitId = :externalUnitId', { externalUnitId })
      .andWhere('id = :id', { id })
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
    updateUnitLeaveDto: UnitLeaveDto,
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
    // Update entity properties
    Object.assign(unitLeaveToUpdate, updateUnitLeaveDto);

    // Save the updated entity
    return this.unitLeavesRepository.save(unitLeaveToUpdate);
  }

  async DeleteOne(id: string, externalUnitId: string): Promise<DeleteResult> {
    const unitLeaveToUpdate = await this.findOne(id, externalUnitId);

    if (!unitLeaveToUpdate?.id) {
      throw new NotFoundException(
        `No Leave found on externalUnitId :${externalUnitId} with Id : ${id} `,
      );
    }

    // Save the updated entity
    return this.unitLeavesRepository.delete(id);
  }
}
