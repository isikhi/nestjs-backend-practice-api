import { Module, forwardRef } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { MoviesRepository } from './movies.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schemas/movie.schema';
import { DirectorsModule } from '../directors/directors.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    forwardRef(() => DirectorsModule),
  ],
  providers: [MoviesService, MoviesRepository],
  controllers: [MoviesController],
  exports: [MoviesRepository, MoviesService],
})
export class MoviesModule {}
