import { BadRequestException } from '@nestjs/common';
import { ParseObjectIdPipe } from './parse-objectid.pipe';
import { Types } from 'mongoose';

describe('ParseObjectIdPipe', () => {
  let pipe: ParseObjectIdPipe;

  beforeEach(() => {
    pipe = new ParseObjectIdPipe();
  });

  it('should transform valid ObjectId string', () => {
    const validId = new Types.ObjectId().toString();

    const result = pipe.transform(validId);

    expect(result).toBe(validId);
  });

  it('should throw BadRequestException for invalid ObjectId', () => {
    const invalidId = 'invalid-id-123';

    expect(() => pipe.transform(invalidId)).toThrow(BadRequestException);
    expect(() => pipe.transform(invalidId)).toThrow(
      'Invalid identifier format',
    );
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for non-string values', () => {
    expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
    expect(() => pipe.transform(123 as any)).toThrow(BadRequestException);
  });
});
