import { DirectorsRepository } from './directors.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Director } from './schemas/director.schema';
import { Test } from '@nestjs/testing';

describe('DirectorsRepository (unit)', () => {
  let repository: DirectorsRepository;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      create: jest.fn((doc) => Promise.resolve({ _id: 'mock-dir-id', ...doc })),
      find: jest.fn(() => ({
        exec: jest.fn(() =>
          Promise.resolve([{ _id: 'd1', firstName: 'John' }]),
        ),
      })),
      findById: jest.fn(() => ({
        exec: jest.fn((id) => Promise.resolve({ _id: id, firstName: 'John' })),
      })),
      findByIdAndDelete: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve({ _id: 'd1' })),
      })),
    };

    const module = await Test.createTestingModule({
      providers: [
        DirectorsRepository,
        {
          provide: getModelToken(Director.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<DirectorsRepository>(DirectorsRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should create a director', async () => {
    const director = await repository.create({ firstName: 'Jane' });
    expect(director._id).toBe('mock-dir-id');
    expect(mockModel.create).toHaveBeenCalled();
  });

  it('should find all directors', async () => {
    const directors = await repository.findAll();
    expect(Array.isArray(directors)).toBe(true);
    expect(mockModel.find).toHaveBeenCalled();
  });

  it('should find one director by id', async () => {
    const director = await repository.findOne('dir-id');
    expect(director).toBeDefined();
    expect(mockModel.findById).toHaveBeenCalledWith('dir-id');
  });

  it('should remove a director', async () => {
    const removed = await repository.remove('d1');
    expect(removed).toBeDefined();
    expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('d1');
  });
});
