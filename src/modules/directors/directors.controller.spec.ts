import { Test, TestingModule } from '@nestjs/testing';
import { DirectorsController } from './directors.controller';
import { DirectorsService } from './directors.service';
import { CreateDirectorDto } from './dtos/create-director.dto';
import { DirectorsQueryDto } from './dtos/directors-query.dto';

describe('DirectorsController (unit)', () => {
  let controller: DirectorsController;
  let service: DirectorsService;

  const createMockDoc = (data: any) => ({
    ...data,
    toJSON: () => data,
  });

  const mockDirectorsService = {
    create: jest.fn((dto) =>
      Promise.resolve(createMockDoc({ _id: 'new-dir-id', ...dto })),
    ),
    findAll: jest.fn((query) =>
      Promise.resolve({
        data: [createMockDoc({ _id: 'd1', firstName: 'John' })],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    ),
    findOne: jest.fn((id) =>
      Promise.resolve(createMockDoc({ _id: id, firstName: 'John' })),
    ),
    remove: jest.fn((id) => Promise.resolve({ _id: id })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorsController],
      providers: [
        {
          provide: DirectorsService,
          useValue: mockDirectorsService,
        },
      ],
    }).compile();

    controller = module.get<DirectorsController>(DirectorsController);
    service = module.get<DirectorsService>(DirectorsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const dto: CreateDirectorDto = { firstName: 'Jane' };
      const result = await controller.create(dto);
      expect(result).toHaveProperty('_id');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated directors', async () => {
      const query = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
      } as DirectorsQueryDto;
      const result = await controller.findAll(query);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single director', async () => {
      const result = await controller.findOne('dir-id');
      expect(result).toHaveProperty('_id');
      expect(service.findOne).toHaveBeenCalledWith('dir-id');
    });
  });

  describe('remove', () => {
    it('should remove a director', async () => {
      const result = await controller.remove('dir-id');
      expect(result).toHaveProperty('_id');
      expect(service.remove).toHaveBeenCalledWith('dir-id');
    });
  });
});
