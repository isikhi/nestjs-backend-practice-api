import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dtos/create-movie.dto';
import { UpdateMovieDto } from './dtos/update-movie.dto';
import { PopulateQueryDto } from '../../common/dtos/populate-query.dto';
import { MoviesQueryDto } from './dtos/movies-query.dto';

describe('MoviesController (unit)', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const createMockDoc = (data: any, extra?: { populate: boolean }) => ({
    ...data,
    toJSON: () => data,
    ...(extra && extra.populate && data.directorId
      ? { director: { _id: data.directorId, name: 'Director 1' } }
      : {}),
  });

  const mockMoviesService = {
    create: jest.fn((dto, populate) =>
      Promise.resolve(
        createMockDoc({ _id: 'new-id', directorId: 'd1', ...dto }, populate),
      ),
    ),
    findAll: jest.fn((query) =>
      Promise.resolve({
        data: [
          createMockDoc(
            { _id: '1', title: 'Movie 1', directorId: 'd1' },
            query.populate,
          ),
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    ),
    findOne: jest.fn((id, populate) =>
      Promise.resolve(
        createMockDoc(
          { _id: id, title: 'Movie 1', directorId: 'd1' },
          populate,
        ),
      ),
    ),
    update: jest.fn((id, dto, populate) =>
      Promise.resolve(
        createMockDoc({ _id: id, directorId: 'd1', ...dto }, populate),
      ),
    ),
    remove: jest.fn((id) => Promise.resolve({ _id: id })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const dto: CreateMovieDto = { title: 'Test Movie', directorId: 'd1' };
      const query: PopulateQueryDto = { populate: false };
      const result = await controller.create(dto, query);
      expect(result).toHaveProperty('_id');
      expect(service.create).toHaveBeenCalledWith(dto, false);
    });
  });

  describe('findAll', () => {
    it('should return paginated movies', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
        populate: false,
      } as MoviesQueryDto;
      const result = await controller.findAll(query);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single movie', async () => {
      const query: PopulateQueryDto = { populate: false };
      const result = await controller.findOne('test-id', query);
      expect(result).toHaveProperty('_id');
      expect(service.findOne).toHaveBeenCalledWith('test-id', false);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const dto: UpdateMovieDto = { title: 'Updated Title' };
      const query: PopulateQueryDto = { populate: false };
      const result = await controller.update('test-id', dto, query);
      expect(result).toHaveProperty('_id');
      expect(service.update).toHaveBeenCalledWith('test-id', dto, false);
    });
  });

  describe('remove', () => {
    it('should remove a movie', async () => {
      const result = await controller.remove('test-id');
      expect(result).toHaveProperty('_id');
      expect(service.remove).toHaveBeenCalledWith('test-id');
    });
  });
});
