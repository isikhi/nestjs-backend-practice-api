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
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

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
  @ApiOperation({ summary: 'Get all directors with pagination' })
  @ApiPaginatedResponse(DirectorResponseDto)
  async findAll(
    @Query() query: DirectorsQueryDto,
  ): Promise<PaginatedResponseDto<DirectorResponseDto>> {
    const { data, meta } = await this.service.findAll(query);
    return {
      data: plainToInstance(DirectorResponseDto, data),
      meta,
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
