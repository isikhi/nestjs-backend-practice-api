import { DirectorsService } from './directors.service';
import { DirectorsQueryDto } from './dtos/directors-query.dto';

describe('DirectorsService (unit)', () => {
  let service: DirectorsService;
  let mockMoviesRepo: any;

  const createMockDirector = (data: any) => ({
    ...data,
    toJSON: () => data,
  });

  const mockRepo: any = {
    create: jest.fn((d) =>
      Promise.resolve(createMockDirector({ _id: 'd1', ...d })),
    ),
    findWithPagination: jest.fn(() =>
      Promise.resolve([createMockDirector({ _id: 'd1', firstName: 'A' })]),
    ),
    count: jest.fn(() => Promise.resolve(1)),
    findOne: jest.fn((id) =>
      Promise.resolve(createMockDirector({ _id: id, firstName: 'A' })),
    ),
    remove: jest.fn((id) => Promise.resolve(createMockDirector({ _id: id }))),
  };

  const mockCache: any = {
    get: jest.fn(() => Promise.resolve(null)), // Always miss for unit tests
    set: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
    delPattern: jest.fn(() => Promise.resolve()),
    isHealthy: jest.fn(() => Promise.resolve(true)),
  };

  beforeEach(() => {
    mockMoviesRepo = { countByDirector: jest.fn(() => Promise.resolve(1)) };
    service = new DirectorsService(mockRepo, mockMoviesRepo, mockCache);
    jest.clearAllMocks();
  });

  it('should create a director', async () => {
    const d = await service.create({ firstName: 'A' });
    expect(d._id).toBeDefined();
  });

  it('should list directors with pagination', async () => {
    const query = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc',
    } as DirectorsQueryDto;
    const result = await service.findAll(query);

    expect(result.data).toBeDefined();
    expect(result.meta).toBeDefined();
    expect(result.meta.page).toBe(1);
    expect(result.meta.total).toBe(1);
    expect(mockRepo.findWithPagination).toHaveBeenCalled();
    expect(mockRepo.count).toHaveBeenCalled();
  });

  it('should throw when deleting a director referenced by movies', async () => {
    await expect(service.remove('d1')).rejects.toThrow(
      'Cannot delete director',
    );
  });

  it('should successfully delete director when no movies reference it', async () => {
    mockMoviesRepo.countByDirector.mockResolvedValueOnce(0);

    const removed = await service.remove('d1');

    expect(removed._id).toBe('d1');
    expect(mockRepo.remove).toHaveBeenCalledWith('d1');
    expect(mockCache.del).toHaveBeenCalledWith('directors:d1');
  });

  it('should throw NotFoundException when removing nonexistent director', async () => {
    mockMoviesRepo.countByDirector.mockResolvedValueOnce(0);
    mockRepo.remove.mockResolvedValueOnce(null);

    await expect(service.remove('nonexistent')).rejects.toThrow(
      'Director not found',
    );
  });

  it('should return cached director when available', async () => {
    const cachedDirector = { _id: 'd1', firstName: 'Cached' };
    mockCache.get.mockResolvedValueOnce(cachedDirector);

    const result = await service.findOne('d1');

    expect(result).toEqual(cachedDirector);
    expect(mockRepo.findOne).not.toHaveBeenCalled(); // Should skip DB
  });

  it('should return cached directors list when available', async () => {
    const query = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc',
    } as DirectorsQueryDto;

    const result = await service.findAll(query);

    expect(result.data).toBeDefined();
    expect(mockRepo.findWithPagination).toHaveBeenCalled();
  });

  it('should throw NotFoundException when director not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne('nonexistent')).rejects.toThrow(
      'Director not found',
    );
  });

  it('should convert birthDate string to Date object', async () => {
    await service.create({ firstName: 'John', birthDate: '1970-01-01' });

    const callArg = mockRepo.create.mock.calls[0][0];
    expect(callArg.birthDate).toBeInstanceOf(Date);
  });
});
