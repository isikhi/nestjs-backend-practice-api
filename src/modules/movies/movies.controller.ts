import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { MovieResponseDto } from './dtos/movie-response.dto';
import { MoviesQueryDto } from './dtos/movies-query.dto';
import { PopulateQueryDto } from '../../common/dtos/populate-query.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly service: MoviesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a movie' })
  @ApiResponse({
    status: 201,
    description: 'Movie created',
    type: MovieResponseDto,
  })
  async create(@Body() dto: CreateMovieDto, @Query() query: PopulateQueryDto) {
    const movie = await this.service.create(dto, query.populate ?? false);
    return plainToInstance(MovieResponseDto, movie, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List movies with pagination, sorting, and filtering',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of movies' })
  async findAll(@Query() query: MoviesQueryDto) {
    const result = await this.service.findAll(query);
    return {
      ...result,
      data: result.data.map((movie) =>
        plainToInstance(MovieResponseDto, movie, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by id' })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: PopulateQueryDto,
  ) {
    const movie = await this.service.findOne(id, query.populate ?? false);
    return plainToInstance(MovieResponseDto, movie, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update movie (partial)' })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateMovieDto,
    @Query() query: PopulateQueryDto,
  ) {
    const movie = await this.service.update(id, dto, query.populate ?? false);
    return plainToInstance(MovieResponseDto, movie, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete movie' })
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
