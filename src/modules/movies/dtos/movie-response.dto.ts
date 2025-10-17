import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DirectorResponseDto } from '../../directors/dtos/director-response.dto';

export class MovieResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Movie ID' })
  @Expose()
  _id: string;

  @ApiProperty({ example: 'The Godfather', description: 'Movie title' })
  @Expose()
  title: string;

  @ApiPropertyOptional({
    example:
      'The aging patriarch of an organized crime dynasty transfers control to his son.',
    description: 'Movie description',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    example: '1972-03-24T00:00:00.000Z',
    description: 'Release date in ISO format',
  })
  @Expose()
  releaseDate?: Date;

  @ApiPropertyOptional({ example: 'Crime', description: 'Movie genre' })
  @Expose()
  genre?: string;

  @ApiPropertyOptional({ example: 9.2, description: 'Rating (0-10)' })
  @Expose()
  rating?: number;

  @ApiPropertyOptional({ example: 'tt0068646', description: 'IMDb ID' })
  @Expose()
  imdbId?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Director ID reference',
  })
  @Expose()
  directorId: string;

  @ApiPropertyOptional({
    type: DirectorResponseDto,
    description: 'Director full information (only when populated)',
  })
  @Expose()
  @Type(() => DirectorResponseDto)
  director?: DirectorResponseDto;

  @ApiProperty({
    example: '2025-10-15T14:00:00.000Z',
    description: 'Creation timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2025-10-15T14:00:00.000Z',
    description: 'Last update timestamp',
  })
  @Expose()
  updatedAt: Date;
}
