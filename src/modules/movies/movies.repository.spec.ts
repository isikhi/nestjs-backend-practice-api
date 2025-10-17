import { MoviesRepository } from './movies.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Movie } from './schemas/movie.schema';
import { Test } from '@nestjs/testing';

describe('MoviesRepository (unit)', () => {
  let repository: MoviesRepository;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      create: jest.fn((doc) => Promise.resolve({ _id: 'mock-id', ...doc })),
      find: jest.fn(() => ({
        exec: jest.fn(() =>
          Promise.resolve([{ _id: '1', title: 'Test Movie' }]),
        ),
      })),
      findById: jest.fn(() => ({
        exec: jest.fn((id) =>
          Promise.resolve({ _id: id, title: 'Test Movie' }),
        ),
      })),
      findByIdAndUpdate: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve({ _id: '1', title: 'Updated' })),
      })),
      findByIdAndDelete: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve({ _id: '1' })),
      })),
      countDocuments: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve(5)),
      })),
    };

    const module = await Test.createTestingModule({
      providers: [
        MoviesRepository,
        {
          provide: getModelToken(Movie.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<MoviesRepository>(MoviesRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create a movie', async () => {
    const movie = await repository.create({ title: 'New Movie' });
    expect(movie._id).toBe('mock-id');
    expect(mockModel.create).toHaveBeenCalled();
  });

  it('should find all movies', async () => {
    const movies = await repository.findAll();
    expect(Array.isArray(movies)).toBe(true);
    expect(mockModel.find).toHaveBeenCalled();
  });

  it('should find one movie by id', async () => {
    const movie = await repository.findOne('test-id');
    expect(movie).toBeDefined();
    expect(mockModel.findById).toHaveBeenCalledWith('test-id');
  });

  it('should update a movie', async () => {
    const updated = await repository.update('1', { title: 'Updated' });
    expect(updated).toBeDefined();
    expect(mockModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should remove a movie', async () => {
    const removed = await repository.remove('1');
    expect(removed).toBeDefined();
    expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
  });

  it('should count movies by director', async () => {
    const count = await repository.countByDirector('director-123');
    expect(count).toBe(5);
    expect(mockModel.countDocuments).toHaveBeenCalledWith({
      directorId: 'director-123',
    });
  });
});
