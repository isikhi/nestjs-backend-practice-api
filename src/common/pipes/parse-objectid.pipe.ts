import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const isValid = /^[0-9a-fA-F]{24}$/.test(value);
    if (!isValid) {
      throw new BadRequestException('Invalid identifier format');
    }
    return value;
  }
}
