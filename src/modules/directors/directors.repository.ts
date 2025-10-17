import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument } from 'mongoose';
import { Director } from './schemas/director.schema';

type DirectorDocument = HydratedDocument<Director>;

@Injectable()
export class DirectorsRepository {
  constructor(
    @InjectModel(Director.name) private directorModel: Model<Director>,
  ) {}

  create(data: Partial<Director>) {
    return this.directorModel.create(data);
  }

  findAll() {
    return this.directorModel.find().exec();
  }

  async findWithPagination(
    skip: number,
    limit: number,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ): Promise<DirectorDocument[]> {
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

  findOne(id: string): Promise<DirectorDocument | null> {
    return this.directorModel.findById(id).exec();
  }

  remove(id: string): Promise<DirectorDocument | null> {
    return this.directorModel.findByIdAndDelete(id).exec();
  }
}
