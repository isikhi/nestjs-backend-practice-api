import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DirectorsService } from './directors.service';
import { CreateDirectorDto } from './dtos/create-director.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { DirectorResponseDto } from './dtos/director-response.dto';
import { DirectorsQueryDto } from './dtos/directors-query.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('directors')
@Controller('directors')
export class DirectorsController {
  constructor(private readonly service: DirectorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a director' })
  @ApiResponse({ status: 201, type: DirectorResponseDto })
  async create(@Body() dto: CreateDirectorDto) {
    const director = await this.service.create(dto);
    return plainToInstance(DirectorResponseDto, director);
  }

  @Get()
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  async findAll(@Query() query: DirectorsQueryDto) {
    const result = await this.service.findAll(query);
    return {
      data: result.data.map((director) =>
        plainToInstance(DirectorResponseDto, director),
      ),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: DirectorResponseDto })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    const director = await this.service.findOne(id);
    return plainToInstance(DirectorResponseDto, director);
  }

  @Delete(':id')
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
