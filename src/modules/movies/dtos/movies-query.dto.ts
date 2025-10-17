import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoviesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['title', 'rating', 'releaseDate', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['title', 'rating', 'releaseDate', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Filter by genre', example: 'Action' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: 'Filter by director ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  directorId?: string;
}
