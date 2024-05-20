import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { PageOptionsDto } from 'src/common/dto/page-option.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { DeleteResult } from 'typeorm';
import {
  createOrUpdateUnitLeaveDto,
  deleteUnitLeaveDto,
  UnitLeaveDto,
} from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { UnitLeavesService } from '../services/unit-leaves.service';
import { UnitLeaveQuery } from './query-dtos/unit-leave.query.dto';

@Controller('v1/unit-leaves')
export class UnitLeavesController {
  constructor(private readonly unitLeavesService: UnitLeavesService) {}

  @Post()
  async create(@Body() data: createOrUpdateUnitLeaveDto): Promise<UnitLeaves> {
    return this.unitLeavesService.create(data);
  }

  @Get('external/:externalUnitId')
  async findAllLeavesOfExternalUnit(
    @Param('externalUnitId') externalUnitId: string,
    @Query() query: UnitLeaveQuery,
  ): Promise<PageDto<UnitLeaves>> {
    return this.unitLeavesService.findAll(externalUnitId, query);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUnitLeaveDto: createOrUpdateUnitLeaveDto,
  ): Promise<UnitLeaves | undefined> {
    return this.unitLeavesService.UpdateOne(id, updateUnitLeaveDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body() deleteUnitLeaveDto: deleteUnitLeaveDto,
  ): Promise<DeleteResult> {
    return await this.unitLeavesService.DeleteOne(id, deleteUnitLeaveDto);
  }
}
