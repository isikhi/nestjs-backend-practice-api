import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests for Movie API
 * Tests complete workflows: create → read → update → delete
 * Includes validation, error handling, business rules (director deletion policy)
 */
describe('Movie API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Movies CRUD workflow', () => {
    let directorId: string;
    let movieId: string;

    it('should create a director first (prerequisite)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({
          firstName: 'Christopher',
          lastName: 'Nolan',
          birthDate: '1970-07-30',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.firstName).toBe('Christopher');
      directorId = res.body._id;
    });

    it('should create a new movie', async () => {
      const res = await request(app.getHttpServer()).post('/v1/movies').send({
        title: 'Inception',
        description: 'A mind-bending thriller',
        releaseDate: '2010-07-16',
        genre: 'Sci-Fi',
        rating: 8.8,
        imdbId: 'tt1375666',
        directorId,
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('Inception');
      movieId = res.body._id;
    });

    it('should get all movies', async () => {
      const res = await request(app.getHttpServer()).get('/v1/movies');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should get a single movie by id', async () => {
      const res = await request(app.getHttpServer()).get(
        `/v1/movies/${movieId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(movieId);
      expect(res.body.title).toBe('Inception');
    });

    it('should update a movie', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/v1/movies/${movieId}`)
        .send({ title: 'Inception (Updated)', rating: 9.0 });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Inception (Updated)');
      expect(res.body.rating).toBe(9.0);
    });

    it('should delete a movie', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/v1/movies/${movieId}`,
      );

      expect(res.status).toBe(200);
    });

    it('should return 404 for deleted movie', async () => {
      const res = await request(app.getHttpServer()).get(
        `/v1/movies/${movieId}`,
      );

      expect(res.status).toBe(404);
    });

    it('should clean up director', async () => {
      await request(app.getHttpServer()).delete(`/v1/directors/${directorId}`);
    });
  });

  describe('Validation & Error Handling', () => {
    it('should reject invalid movie data (missing title)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid rating (out of range)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Bad Rating', rating: 11 });

      expect(res.status).toBe(400);
    });

    it('should reject invalid IMDb ID format', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Bad IMDb', imdbId: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate IMDb ID', async () => {
      const uniqueImdbId = `tt${String(Date.now()).slice(-7)}`; // e.g. tt1234567

      const dirRes = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({ firstName: 'Dup', lastName: 'Test' });
      const directorId = dirRes.body._id;

      await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Original', imdbId: uniqueImdbId, directorId });

      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Duplicate', imdbId: uniqueImdbId, directorId });

      expect(res.status).toBe(409); // Conflict

      await request(app.getHttpServer()).delete(`/v1/directors/${directorId}`);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await request(app.getHttpServer()).get(
        '/v1/movies/invalid-id',
      );

      expect(res.status).toBe(400);
    });
  });

  describe('Directors CRUD workflow', () => {
    let directorId: string;

    it('should create a director', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({ firstName: 'Steven', lastName: 'Spielberg' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      directorId = res.body._id;
    });

    it('should get all directors', async () => {
      const res = await request(app.getHttpServer()).get('/v1/directors');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get a single director by id', async () => {
      const res = await request(app.getHttpServer()).get(
        `/v1/directors/${directorId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(directorId);
    });

    it('should delete a director with no movies', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/v1/directors/${directorId}`,
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Business Rules: Director Deletion Policy', () => {
    let directorId: string;
    let movieId: string;

    it('should prevent deleting a director with movies', async () => {
      const dirRes = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({ firstName: 'Quentin', lastName: 'Tarantino' });
      directorId = dirRes.body._id;

      const movieRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Pulp Fiction', directorId });
      movieId = movieRes.body._id;

      const delRes = await request(app.getHttpServer()).delete(
        `/v1/directors/${directorId}`,
      );

      expect(delRes.status).toBe(409); // Conflict
      expect(delRes.body.message).toContain('Cannot delete director');
    });

    it('should allow deleting director after removing movies', async () => {
      await request(app.getHttpServer()).delete(`/v1/movies/${movieId}`);

      const res = await request(app.getHttpServer()).delete(
        `/v1/directors/${directorId}`,
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Cache Behavior (if enabled)', () => {
    let movieId: string;
    let directorId: string;

    beforeAll(async () => {
      // Create a director for cache tests
      const res = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({ firstName: 'Cache', lastName: 'Test' });
      directorId = res.body._id;
    });

    afterAll(async () => {
      await request(app.getHttpServer()).delete(`/v1/directors/${directorId}`);
    });

    it('should cache movie list on second request', async () => {
      // First request (cache miss)
      const res1 = await request(app.getHttpServer()).get('/v1/movies');
      expect(res1.status).toBe(200);

      // Second request (should hit cache if enabled)
      const res2 = await request(app.getHttpServer()).get('/v1/movies');
      expect(res2.status).toBe(200);
      expect(res2.body).toEqual(res1.body);
    });

    it('should invalidate cache on create', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({ title: 'Cache Test Movie', directorId });

      expect(res.status).toBe(201);
      movieId = res.body._id;

      // List should reflect new movie
      const listRes = await request(app.getHttpServer()).get('/v1/movies');
      expect(listRes.body).toHaveProperty('data');
      const titles = listRes.body.data.map((m: any) => m.title);
      expect(titles).toContain('Cache Test Movie');

      await request(app.getHttpServer()).delete(`/v1/movies/${movieId}`);
    });
  });

  describe('Director Validation', () => {
    it('should reject movie creation without directorId', async () => {
      const res = await request(app.getHttpServer()).post('/v1/movies').send({
        title: 'No Director Movie',
        rating: 7.5,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('directorId')]),
      );
    });

    it('should reject movie creation with non-existent directorId', async () => {
      const res = await request(app.getHttpServer()).post('/v1/movies').send({
        title: 'Invalid Director Movie',
        rating: 7.5,
        directorId: '507f1f77bcf86cd799439011', // Valid ObjectId format but doesn't exist
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Director');
      expect(res.body.message).toContain('not found');
    });

    it('should reject movie update with non-existent directorId', async () => {
      // First create a director and movie
      const dirRes = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({
          firstName: 'Valid',
          lastName: 'Director',
          birthDate: '1980-01-01',
        });
      const directorId = dirRes.body._id;

      const movieRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({
          title: 'Test Movie',
          directorId,
        });
      const movieId = movieRes.body._id;

      // Try to update with invalid director
      const updateRes = await request(app.getHttpServer())
        .patch(`/v1/movies/${movieId}`)
        .send({
          directorId: '507f1f77bcf86cd799439099', // Non-existent
        });

      expect(updateRes.status).toBe(400);
      expect(updateRes.body.message).toContain('Director');
      expect(updateRes.body.message).toContain('not found');

      await request(app.getHttpServer()).delete(`/v1/movies/${movieId}`);
      await request(app.getHttpServer()).delete(`/v1/directors/${directorId}`);
    });
  });

  describe('Rating Rounding', () => {
    let directorId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/directors')
        .send({
          firstName: 'Rating',
          lastName: 'Test',
          birthDate: '1975-05-15',
        });
      directorId = res.body._id;
    });

    afterAll(async () => {
      await request(app.getHttpServer()).delete(`/v1/directors/${directorId}`);
    });

    it('should round rating to 1 decimal place on create', async () => {
      const res = await request(app.getHttpServer()).post('/v1/movies').send({
        title: 'Rating Test Movie',
        rating: 8.234567,
        directorId,
      });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(8.2);

      await request(app.getHttpServer()).delete(`/v1/movies/${res.body._id}`);
    });

    it('should round rating to 1 decimal place on update', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .send({
          title: 'Rating Update Test',
          rating: 5.0,
          directorId,
        });
      const movieId = createRes.body._id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/v1/movies/${movieId}`)
        .send({
          rating: 9.876543,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.rating).toBe(9.9);

      await request(app.getHttpServer()).delete(`/v1/movies/${movieId}`);
    });

    it('should handle edge case: 9.95 rounds to 10.0', async () => {
      const res = await request(app.getHttpServer()).post('/v1/movies').send({
        title: 'Edge Case Rating',
        rating: 9.95,
        directorId,
      });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(10.0);

      await request(app.getHttpServer()).delete(`/v1/movies/${res.body._id}`);
    });
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const res = await request(app.getHttpServer()).get('/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('services');
    });
  });
});
