import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MoviesRepository } from './movies.repository';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { CacheService } from '../../infra/redis/cache.service';
import { DirectorsRepository } from '../directors/directors.repository';
import { MoviesQueryDto } from './dtos/movies-query.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { FilterQuery } from 'mongoose';
import { Movie } from './schemas/movie.schema';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly CACHE_KEY_PREFIX = 'movies:';
  private readonly CACHE_TTL_ITEM = 600;

  constructor(
    private readonly repo: MoviesRepository,
    private readonly cache: CacheService,
    private readonly directorsRepo: DirectorsRepository,
  ) {}

  async create(data: CreateMovieDto, populate: boolean = false) {
    const payload: CreateMovieDto = { ...data };
    if (payload.releaseDate && typeof payload.releaseDate === 'string') {
      payload.releaseDate = new Date(payload.releaseDate);
    }

    const director = await this.directorsRepo.findOne(payload.directorId);
    if (!director) {
      throw new BadRequestException(
        `Director with ID '${payload.directorId}' not found`,
      );
    }

    if (payload.imdbId) {
      const existing = await this.repo.findByImdbId(payload.imdbId);
      if (existing) {
        throw new ConflictException(
          `Movie with IMDb ID '${payload.imdbId}' already exists`,
        );
      }
    }

    const movie = await this.repo.create(payload);
    this.logger.debug(`Created movie ${movie._id}`);

    const populated = await this.repo.findOne(movie._id.toString(), populate);
    const normalized = this.normalizeMovie(populated, populate);

    // Cache the newly created movie
    const cacheKey = `${this.CACHE_KEY_PREFIX}${movie._id}:populate=${populate}`;
    await this.cache.set(cacheKey, normalized, this.CACHE_TTL_ITEM);

    // Invalidate list cache (all variations)
    await this.cache.delPattern(`${this.CACHE_KEY_PREFIX}list:*`);
    this.logger.debug(`Created movie ${movie._id}, invalidated list cache`);

    return normalized;
  }

  async findAll(query: MoviesQueryDto) {
    const filters: FilterQuery<Movie> = {};
    if (query.genre) filters.genre = query.genre;
    if (query.directorId) filters.directorId = query.directorId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;
    const populate = query.populate ?? false;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    const hasFilters = Object.keys(filters).length > 0;

    // Cache key only for base query (no filters)
    const cacheKey = hasFilters
      ? null
      : `${this.CACHE_KEY_PREFIX}list:page=${page}:limit=${limit}:sortBy=${sortBy}:order=${order}:populate=${populate}`;

    if (cacheKey) {
      const cached = await this.cache.get<any>(cacheKey);
      if (cached) {
        this.logger.debug(
          `Returning cached movie list (page=${page}, populate=${populate})`,
        );
        return cached;
      }
    }

    const [data, total] = await Promise.all([
      this.repo.findWithPagination(
        skip,
        limit,
        sortBy,
        order,
        filters,
        populate,
      ),
      this.repo.count(filters),
    ]);

    const normalized = data.map((movie) =>
      this.normalizeMovie(movie, populate),
    );

    const result = {
      data: normalized,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    if (cacheKey) {
      await this.cache.set(cacheKey, result, this.CACHE_TTL_ITEM);
      this.logger.debug(
        `Cached movie list (page=${page}, populate=${populate})`,
      );
    }

    return result;
  }

  async findOne(id: string, populate: boolean = false) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}:populate=${populate}`;
    const cached = await this.cache.get<any>(cacheKey);

    if (cached) {
      this.logger.debug(`Returning cached movie ${id} (populate=${populate})`);
      return cached;
    }

    const movie = await this.repo.findOne(id, populate);
    if (!movie) throw new NotFoundException('Movie not found');

    const normalized = this.normalizeMovie(movie, populate);
    await this.cache.set(cacheKey, normalized, this.CACHE_TTL_ITEM);
    this.logger.debug(`Fetched movie ${id} from DB (populate=${populate})`);

    return normalized;
  }

  async update(
    id: string,
    data: Partial<CreateMovieDto>,
    populate: boolean = false,
  ) {
    const payload: Partial<CreateMovieDto> = { ...data };
    if (payload.releaseDate && typeof payload.releaseDate === 'string') {
      payload.releaseDate = new Date(payload.releaseDate);
    }

    if (payload.directorId) {
      const director = await this.directorsRepo.findOne(payload.directorId);
      if (!director) {
        throw new BadRequestException(
          `Director with ID '${payload.directorId}' not found`,
        );
      }
    }

    try {
      const updated = await this.repo.update(id, payload, populate);
      if (!updated) throw new NotFoundException('Movie not found');

      await Promise.all([
        this.cache.del(`${this.CACHE_KEY_PREFIX}${id}:populate=true`),
        this.cache.del(`${this.CACHE_KEY_PREFIX}${id}:populate=false`),
      ]);

      await this.cache.delPattern(`${this.CACHE_KEY_PREFIX}list:*`);
      this.logger.debug(`Updated movie ${id}, invalidated caches`);

      return this.normalizeMovie(updated, populate);
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === 11000 && error.keyPattern?.imdbId) {
        throw new ConflictException(
          `Movie with IMDb ID '${payload.imdbId}' already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const removed = await this.repo.remove(id);
    if (!removed) throw new NotFoundException('Movie not found');

    await Promise.all([
      this.cache.del(`${this.CACHE_KEY_PREFIX}${id}:populate=true`),
      this.cache.del(`${this.CACHE_KEY_PREFIX}${id}:populate=false`),
    ]);

    await this.cache.delPattern(`${this.CACHE_KEY_PREFIX}list:*`);
    this.logger.debug(`Deleted movie ${id}, invalidated caches`);

    return removed.toJSON();
  }

  private normalizeMovie(movie: any, populate: boolean = true) {
    const json = movie.toJSON();

    if (!populate) {
      return json;
    }

    const directorObject = movie.directorId;
    const directorJson = directorObject
      ? directorObject.toJSON
        ? directorObject.toJSON()
        : directorObject
      : null;

    return {
      ...json,
      directorId: directorJson ? directorJson._id : json.directorId,
      director: directorJson,
    };
  }
}
