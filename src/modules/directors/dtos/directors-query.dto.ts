import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DirectorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['firstName', 'lastName', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['firstName', 'lastName', 'createdAt'])
  sortBy?: string = 'createdAt';
}
