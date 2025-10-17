# Movie API

A production-grade RESTful API for managing movies and directors built with NestJS, MongoDB, and Redis caching.

## 🎯 Features

- **RESTful API**: Movies and Directors CRUD operations
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis-based caching layer with environment-based control
- **Validation**: DTO validation with class-validator
- **Documentation**: Swagger/OpenAPI at `/docs`
- **Testing**: Comprehensive unit, integration, and E2E tests
- **Error Handling**: Global exception filters
- **Health Checks**: `/v1/health` endpoint with service status

## 📋 Prerequisites

- Node.js >= 22
- Yarn
- MongoDB >= 7.0
- Redis (optional, for caching) >= 7.0
- Docker & Docker Compose (for containerized deployment)

## 🚀 Quick Start

### 1. Installation

```bash
yarn install
```

### 2. Environment Setup (without docker)

Create `.env` file in the root directory :

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/movie-api

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=true # false
CACHE_DEFAULT_TTL=300
```

### 3. Start Services

**Option A: Local Development**
```bash
# Start MongoDB and Redis
docker compose up -d mongo redis

# Run the application
yarn start:dev
```

**Option B: Full Docker Setup**
```bash
yarn docker:up
```

### 4. Access the API

- **API**: http://localhost:3000/v1
- **Swagger Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/v1/health

## 📚 API Documentation

### Endpoints

#### Movies
- `POST /v1/movies` - Create a new movie
- `GET /v1/movies` - Get all movies
- `GET /v1/movies/:id` - Get movie by ID
- `PUT /v1/movies/:id` - Update movie
- `DELETE /v1/movies/:id` - Delete movie

#### Directors
- `POST /v1/directors` - Create a new director
- `GET /v1/directors` - Get all directors
- `GET /v1/directors/:id` - Get director by ID
- `DELETE /v1/directors/:id` - Delete director (if no movies reference it)

#### Health
- `GET /v1/health` - Service health status

For detailed API documentation with request/response examples, visit `/docs` when the server is running.
Also check `postman` folder for collection and runnable test with it.

## 🧪 Testing

### Docker-Based Testing (Recommended for CI/CD)

**Run all tests in isolated environment:**
```bash
yarn docker:test
```

This command runs:
- ✅ Unit tests with coverage
- ✅ E2E tests
- ✅ Postman/Newman API tests
- ✅ Isolated MongoDB + Redis (in-memory)
- ✅ Comprehensive test reports

**Individual Docker test commands:**

You can run all tests with one commmand:
```bash
./scripts/run-tests.sh 
```

If you want you can run seperately
```bash
yarn docker:test:unit    # Unit tests only
yarn docker:test:e2e     # E2E tests only
yarn docker:test:api     # Postman tests only
yarn docker:test:down    # Stop test infrastructure
```

### Local Development Tests

```bash
# Unit tests
yarn test

# Unit tests with coverage
yarn test:cov

# E2E tests
yarn test:e2e

# Postman/Newman API tests
yarn test:postman

# Run all tests sequentially
yarn test:all
```

### Test Structure

- **Unit Tests**: Repository, Service, Controller layers (`*.spec.ts`)
- **E2E Tests**: Full workflow testing (`test/movie.e2e-spec.ts`)
- **API Tests**: Postman collection (`postman/movie-api.postman_collection.json`)

### Coverage Thresholds

View coverage report: `coverage/lcov-report/index.html`

## 🏗️ Architecture

```
src/
├── common/              # Shared utilities, filters, dtos, pipes, interceptors
│   ├── filters/         # Exception filters
│   ├── pipes/           # Custom pipes (ObjectId validation)
│   └── interceptors/    # Request/response transformations
├── config/              # Configuration management
├── infra/               # Infrastructure modules
│   ├── mongo/           # MongoDB connection
│   └── redis/           # Redis cache service
├── modules/             # Feature modules
│   ├── movies/          # Movies module
│   │   ├── dtos/        # Data Transfer Objects
│   │   ├── schemas/     # Mongoose schemas
│   │   ├── movies.controller.ts
│   │   ├── movies.service.ts
│   │   └── movies.repository.ts
│   ├── directors/       # Directors module (similar structure)
│   └── health/          # Health check module
└── main.ts              # Application entry point
```

## 🔧 Configuration

### Caching

The application uses Redis for caching with:
- **List caching**: 300s TTL (5 minutes) only basic filtering.
- **Item caching**: 600s TTL (10 minutes)
- **Write-through invalidation**: Auto-invalidates on create/update/delete
- **Graceful degradation**: Falls back to DB if Redis is unavailable

Toggle caching: Set `CACHE_ENABLED=false` in `.env`

## 🐳 Docker Deployment

### Build and Run with Docker

**Option 1: Docker Compose (Recommended)**
```bash
# Build and start all services (app, MongoDB, Redis)
docker compose up --build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down
```

### Docker Image Details

The Dockerfile uses a **multi-stage build** for optimized production deployment:
- **Stage 1 (builder)**: Installs dependencies and builds TypeScript
- **Stage 2 (production)**: Contains only production dependencies and compiled code
- **Non-root user**: Runs as `nestjs` user for security
- **Health check**: Built-in Docker health check on `/v1/health` endpoint

## 🔍 Database

### Indexes

**Movies Collection**:
- Unique sparse index on `imdbId`
- Standard index on `directorId`

**Directors Collection**:
- Compound index on `{firstName, lastName}`

### Business Rules

1. **IMDb ID Uniqueness**: Each movie must have a unique IMDb ID (if provided)
2. **Director Deletion Policy**: Directors cannot be deleted if they have associated movies
3. **Rating Validation**: Movie ratings must be between 0 and 10
4. **Data Trimming**: String fields are automatically trimmed


## 📊 Monitoring

### Health Endpoint

```bash
GET /v1/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2025-01-15T10:00:00.000Z",
  "services": {
    "mongodb": "healthy",
    "redis": "healthy",
    "cache": "enabled"
  }
}
```


## 🤝 Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass: `./scripts/run-tests.sh ` and `yarn test:all`
4. Ensure coverage meets thresholds: `yarn test:cov`
5. Update documentation if needed
6. Submit a pull request

**Built with**:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [Redis](https://redis.io/) - In-memory cache
- [Jest](https://jestjs.io/) - Testing framework
- [Postman/Newman](https://www.postman.com/) - API testing
