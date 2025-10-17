import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Movie } from './schemas/movie.schema';
import { CreateMovieDto } from './dtos/create-movie.dto';

@Injectable()
export class MoviesRepository {
  constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) {}

  create(data: CreateMovieDto | Partial<Movie>) {
    return this.movieModel.create(data as Partial<Movie>);
  }

  findByImdbId(imdbId: string) {
    return this.movieModel.findOne({ imdbId }).exec();
  }

  findAll() {
    return this.movieModel.find().exec();
  }

  async findWithPagination(
    skip: number,
    limit: number,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    filters: FilterQuery<Movie> = {},
    populate: boolean = false,
  ) {
    const sortOrder = order === 'asc' ? 1 : -1;
    const query = this.movieModel
      .find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    if (populate) {
      query.populate('directorId');
    }
    return query.exec();
  }

  count(filters: FilterQuery<Movie> = {}) {
    return this.movieModel.countDocuments(filters).exec();
  }

  findOne(id: string, populate: boolean = false) {
    const query = this.movieModel.findById(id);
    if (populate) {
      query.populate('directorId');
    }
    return query.exec();
  }

  update(
    id: string,
    data: Partial<Movie> | Partial<CreateMovieDto>,
    populate: boolean = false,
  ) {
    const query = this.movieModel.findByIdAndUpdate(
      id,
      data as Partial<Movie>,
      { new: true },
    );
    if (populate) {
      query.populate('directorId');
    }
    return query.exec();
  }

  remove(id: string) {
    return this.movieModel.findByIdAndDelete(id).exec();
  }

  countByDirector(directorId: string) {
    return this.movieModel.countDocuments({ directorId }).exec();
  }
}
