import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DirectorResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Director ID',
  })
  @Expose()
  _id: string;

  @ApiProperty({ example: 'Francis', description: 'Director first name' })
  @Expose()
  firstName: string;

  @ApiProperty({
    required: false,
    example: 'Ford Coppola',
    description: 'Director last name',
  })
  @Expose()
  lastName?: string;

  @ApiProperty({
    required: false,
    example: '1939-04-07T00:00:00.000Z',
    description: 'Birth date in ISO format',
  })
  @Expose()
  birthDate?: Date;

  @ApiProperty({
    required: false,
    example: 'American film director, producer, and screenwriter',
    description: 'Short biography',
  })
  @Expose()
  bio?: string;

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
