import { MoviesService } from './movies.service';
import { MoviesQueryDto } from './dtos/movies-query.dto';

describe('MoviesService (unit)', () => {
  let service: MoviesService;

  const createMockMovie = (data: any) => ({
    ...data,
    toJSON: () => data,
  });

  const mockRepo: any = {
    create: jest.fn((d) =>
      Promise.resolve(createMockMovie({ _id: '1', ...d })),
    ),
    findAll: jest.fn(() =>
      Promise.resolve([createMockMovie({ _id: '1', title: 't' })]),
    ),
    findOne: jest.fn((id) =>
      Promise.resolve(
        createMockMovie({ _id: id, title: 't', directorId: 'd1' }),
      ),
    ),
    update: jest.fn((id, d) =>
      Promise.resolve(createMockMovie({ _id: id, directorId: 'd1', ...d })),
    ),
    remove: jest.fn((id) => Promise.resolve(createMockMovie({ _id: id }))),
    findByImdbId: jest.fn(() => Promise.resolve(null)),
    findWithPagination: jest.fn(() =>
      Promise.resolve([
        createMockMovie({ _id: '1', title: 't', directorId: 'd1' }),
      ]),
    ),
    count: jest.fn(() => Promise.resolve(1)),
  };

  const mockCache: any = {
    get: jest.fn(() => Promise.resolve(null)), // Always miss for unit tests
    set: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
    delPattern: jest.fn(() => Promise.resolve()),
    isHealthy: jest.fn(() => Promise.resolve(true)),
  };

  const mockDirectorsRepo: any = {
    findOne: jest.fn((id) =>
      Promise.resolve({ _id: id, firstName: 'John', lastName: 'Doe' }),
    ),
  };

  beforeEach(() => {
    service = new MoviesService(mockRepo, mockCache, mockDirectorsRepo);
    jest.clearAllMocks();
  });

  it('should create a movie', async () => {
    const created = await service.create(
      { title: 'abc', directorId: 'd1' },
      false,
    );
    expect(created._id).toBeDefined();
    expect(mockDirectorsRepo.findOne).toHaveBeenCalledWith('d1');
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockCache.delPattern).toHaveBeenCalledWith('movies:list:*');
  });

  it('should find all movies', async () => {
    const query = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc',
      populate: false,
    } as MoviesQueryDto;
    const result: any = await service.findAll(query);
    expect(result.data).toBeDefined();
    expect(result.meta).toBeDefined();
    expect(mockRepo.findWithPagination).toHaveBeenCalled();
    expect(mockRepo.count).toHaveBeenCalled();
  });

  it('should find one movie', async () => {
    const one: any = await service.findOne('1', false);
    expect(one._id).toBe('1');
    expect(mockCache.get).toHaveBeenCalledWith('movies:1:populate=false');
    expect(mockCache.set).toHaveBeenCalled();
  });

  it('should return cached movie when available', async () => {
    const cachedMovie = { _id: '1', title: 'Cached', directorId: 'd1' };
    mockCache.get.mockResolvedValueOnce(cachedMovie);

    const result = await service.findOne('1', false);

    expect(result).toEqual(cachedMovie);
    expect(mockRepo.findOne).not.toHaveBeenCalled(); // Should skip DB
  });

  it('should return cached movie list when available', async () => {
    const cachedList = {
      data: [{ _id: '1', title: 'Cached', directorId: 'd1' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    mockCache.get.mockResolvedValueOnce(cachedList);

    const query = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc',
      populate: false,
    } as MoviesQueryDto;
    const result = await service.findAll(query);

    expect(result).toEqual(cachedList);
    expect(mockRepo.findWithPagination).not.toHaveBeenCalled(); // Should skip DB
  });

  it('should throw NotFoundException when movie not found', async () => {
    mockCache.get.mockResolvedValueOnce(null);
    mockRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.findOne('nonexistent', false)).rejects.toThrow(
      'Movie not found',
    );
  });

  it('should update a movie and invalidate caches', async () => {
    const updated = await service.update('1', { title: 'Updated' }, false);

    expect(updated.title).toBe('Updated');
    expect(mockRepo.update).toHaveBeenCalledWith(
      '1',
      { title: 'Updated' },
      false,
    );
    expect(mockCache.del).toHaveBeenCalledWith('movies:1:populate=true');
    expect(mockCache.del).toHaveBeenCalledWith('movies:1:populate=false');
    expect(mockCache.delPattern).toHaveBeenCalledWith('movies:list:*');
  });

  it('should throw NotFoundException when updating nonexistent movie', async () => {
    mockRepo.update.mockResolvedValueOnce(null);

    await expect(
      service.update('nonexistent', { title: 'x' }, false),
    ).rejects.toThrow('Movie not found');
  });

  it('should throw ConflictException on duplicate imdbId during update', async () => {
    const error: any = new Error('Duplicate key');
    error.code = 11000;
    error.keyPattern = { imdbId: 1 };
    mockRepo.update.mockRejectedValueOnce(error);

    await expect(
      service.update('1', { imdbId: 'tt123' }, false),
    ).rejects.toThrow('Movie with IMDb ID');
  });

  it('should remove a movie and invalidate caches', async () => {
    const removed = await service.remove('1');

    expect(removed._id).toBe('1');
    expect(mockRepo.remove).toHaveBeenCalledWith('1');
    expect(mockCache.del).toHaveBeenCalledWith('movies:1:populate=true');
    expect(mockCache.del).toHaveBeenCalledWith('movies:1:populate=false');
    expect(mockCache.delPattern).toHaveBeenCalledWith('movies:list:*');
  });

  it('should throw NotFoundException when removing nonexistent movie', async () => {
    mockRepo.remove.mockResolvedValueOnce(null);

    await expect(service.remove('nonexistent')).rejects.toThrow(
      'Movie not found',
    );
  });

  it('should throw ConflictException when creating movie with duplicate imdbId', async () => {
    mockRepo.findByImdbId.mockResolvedValueOnce(
      createMockMovie({ _id: 'existing', imdbId: 'tt123' }),
    );

    await expect(
      service.create(
        { title: 'New', imdbId: 'tt123', directorId: 'd1' },
        false,
      ),
    ).rejects.toThrow('Movie with IMDb ID');
    expect(mockRepo.create).not.toHaveBeenCalled(); // Should not attempt create
  });

  it('should convert releaseDate string to Date object', async () => {
    await service.create(
      { title: 'Movie', releaseDate: '2024-01-01', directorId: 'd1' },
      false,
    );

    const callArg = mockRepo.create.mock.calls[0][0];
    expect(callArg.releaseDate).toBeInstanceOf(Date);
  });

  it('should convert releaseDate string to Date on update', async () => {
    await service.update('1', { releaseDate: '2024-01-01' }, false);

    const callArg = mockRepo.update.mock.calls[0][1];
    expect(callArg.releaseDate).toBeInstanceOf(Date);
  });

  it('should throw NotFoundException when director not found on create', async () => {
    mockDirectorsRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.create({ title: 'Movie', directorId: 'nonexistent' }, false),
    ).rejects.toThrow("Director with ID 'nonexistent' not found");
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when director not found on update', async () => {
    mockDirectorsRepo.findOne.mockResolvedValueOnce(null);

    await expect(
      service.update('1', { directorId: 'nonexistent' }, false),
    ).rejects.toThrow("Director with ID 'nonexistent' not found");
  });

  it('should validate director exists before creating movie', async () => {
    await service.create({ title: 'Movie', directorId: 'd123' }, false);

    expect(mockDirectorsRepo.findOne).toHaveBeenCalledWith('d123');
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should validate director exists before updating movie with new directorId', async () => {
    await service.update('1', { directorId: 'd456' }, false);

    expect(mockDirectorsRepo.findOne).toHaveBeenCalledWith('d456');
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('should not validate director when updating without directorId', async () => {
    await service.update('1', { title: 'Updated Title' }, false);

    expect(mockDirectorsRepo.findOne).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
