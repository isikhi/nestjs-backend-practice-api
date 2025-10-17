import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @ApiProperty({ description: 'Movie title', example: 'The Godfather' })
  title: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({
    description: 'Movie description',
    example:
      'The aging patriarch of an organized crime dynasty transfers control to his son.',
  })
  description?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'ISO release date',
    example: '1972-03-24',
  })
  releaseDate?: string | Date;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @ApiPropertyOptional({ description: 'Genre', example: 'Crime' })
  genre?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    // Round to 1 decimal place like 9.82 > 9.8
    return Math.round(value * 10) / 10;
  })
  @ApiPropertyOptional({
    description: 'Rating (0-10, rounded to 1 decimal)',
    example: 9.2,
  })
  rating?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @Matches(/^tt\d{7,8}$/, {
    message: 'IMDb ID must be in format ttXXXXXXX (e.g., tt0068646)',
  })
  @ApiPropertyOptional({
    description: 'IMDb ID (must be unique)',
    example: 'tt0068646',
  })
  imdbId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Director ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439012',
  })
  directorId: string;
}
