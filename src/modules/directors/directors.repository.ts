import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Director } from './schemas/director.schema';
import { CreateDirectorDto } from './dtos/create-director.dto';

@Injectable()
export class DirectorsRepository {
  constructor(
    @InjectModel(Director.name) private directorModel: Model<Director>,
  ) {}

  create(data: CreateDirectorDto | Partial<Director>) {
    return this.directorModel.create(data as Partial<Director>);
  }

  findAll() {
    return this.directorModel.find().exec();
  }

  async findWithPagination(
    skip: number,
    limit: number,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    const sortOrder = order === 'asc' ? 1 : -1;
    return this.directorModel
      .find()
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  count() {
    return this.directorModel.countDocuments().exec();
  }

  findOne(id: string) {
    return this.directorModel.findById(id).exec();
  }

  remove(id: string) {
    return this.directorModel.findByIdAndDelete(id).exec();
  }
}
