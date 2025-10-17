import { Module, forwardRef } from '@nestjs/common';
import { DirectorsService } from './directors.service';
import { DirectorsController } from './directors.controller';
import { DirectorsRepository } from './directors.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Director, DirectorSchema } from './schemas/director.schema';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Director.name, schema: DirectorSchema },
    ]),
    forwardRef(() => MoviesModule),
  ],
  providers: [DirectorsService, DirectorsRepository],
  controllers: [DirectorsController],
  exports: [DirectorsRepository, DirectorsService],
})
export class DirectorsModule {}
