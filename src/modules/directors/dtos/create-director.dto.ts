import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDirectorDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiProperty({ description: 'Director first name', example: 'Francis' })
  firstName: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiPropertyOptional({
    description: 'Director last name',
    example: 'Ford Coppola',
  })
  lastName?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Birth date (ISO)',
    example: '1969-04-07',
  })
  birthDate?: string | Date;

  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ApiPropertyOptional({
    description: 'Short bio',
    example: 'American film director, producer, and screenwriter',
  })
  bio?: string;
}
