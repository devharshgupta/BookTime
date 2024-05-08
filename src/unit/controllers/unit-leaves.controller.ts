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
import { UnitLeaveDto } from '../dto/unit-leaves.dto';
import { UnitLeaves } from '../entities/unit-leaves.entity';
import { UnitLeavesService } from '../services/unit-leaves.service';

@Controller('v1/unit-leaves')
export class UnitLeavesController {
  constructor(private readonly unitLeavesService: UnitLeavesService) {}

  // todo if recent leave then update the cache
  @Post()
  async create(@Body() createUnitLeaveDto: UnitLeaveDto): Promise<UnitLeaves> {
    return this.unitLeavesService.create(createUnitLeaveDto);
  }

  @Get('external/:externalUnitId')
  async findAllLeavesOfExternalUnit(
    @Param('externalUnitId') externalUnitId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<UnitLeaves>> {
    return this.unitLeavesService.findAll(externalUnitId, pageOptionsDto);
  }

  @Get(':id/external/:externalUnitId')
  async findOne(
    @Param('id') id: string,
    @Param('externalUnitId') externalUnitId: string,
  ): Promise<UnitLeaves | undefined> {
    return this.unitLeavesService.findOne(id, externalUnitId);
  }

  // todo if recent leave then update the cache
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUnitLeaveDto: UnitLeaveDto,
  ): Promise<UnitLeaves | undefined> {
    return this.unitLeavesService.UpdateOne(id, updateUnitLeaveDto);
  }

  // todo if recent leave then update the cache
  @Delete(':id/external/:externalUnitId')
  async remove(
    @Param('id') id: string,
    @Param('externalUnitId') externalUnitId: string,
  ): Promise<DeleteResult> {
    return await this.unitLeavesService.DeleteOne(id, externalUnitId);
  }
}
