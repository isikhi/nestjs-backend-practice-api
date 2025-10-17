import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DirectorsRepository } from './directors.repository';
import { MoviesRepository } from '../movies/movies.repository';
import { CreateDirectorDto } from './dtos/create-director.dto';
import { CacheService } from '../../infra/redis/cache.service';
import { DirectorsQueryDto } from './dtos/directors-query.dto';
import { Director } from './schemas/director.schema';

@Injectable()
export class DirectorsService {
  private readonly logger = new Logger(DirectorsService.name);
  private readonly CACHE_KEY_PREFIX = 'directors:';
  private readonly CACHE_TTL_ITEM = 600;

  constructor(
    private readonly repo: DirectorsRepository,
    private readonly moviesRepo: MoviesRepository,
    private readonly cache: CacheService,
  ) {}

  async create(data: CreateDirectorDto) {
    const director = await this.repo.create({
      ...data,
      birthDate:
        typeof data.birthDate === 'string'
          ? new Date(data.birthDate)
          : data.birthDate,
    });
    this.logger.debug(`Created director ${director._id}`);
    return director.toJSON();
  }

  async findAll(query: DirectorsQueryDto): Promise<{
    data: Director[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = query.skip;

    const [data, total] = await Promise.all([
      this.repo.findWithPagination(skip, limit, query.sortBy, query.order),
      this.repo.count(),
    ]);

    const normalized = data.map((director) => director.toJSON());

    return {
      data: normalized,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${id}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      this.logger.debug(`Returning cached director ${id}`);
      return cached;
    }

    const director = await this.repo.findOne(id);
    if (!director) throw new NotFoundException('Director not found');

    const normalized = director.toJSON();
    await this.cache.set(cacheKey, normalized, this.CACHE_TTL_ITEM);
    this.logger.debug(`Fetched director ${id} from DB`);

    return normalized;
  }

  async remove(id: string) {
    const count = await this.moviesRepo.countByDirector(id);
    if (count > 0) {
      throw new ConflictException(
        'Cannot delete director: movies reference this director',
      );
    }
    const removed = await this.repo.remove(id);
    if (!removed) throw new NotFoundException('Director not found');

    await this.cache.del(`${this.CACHE_KEY_PREFIX}${id}`);
    this.logger.debug(`Deleted director ${id}`);

    return removed.toJSON();
  }
}
