# Movie API Helm Chart

Production-ready Kubernetes deployment for Movie API with MongoDB and Redis.

## Prerequisites

- Kubernetes cluster (OrbStack, minikube, or cloud provider)
- Helm 3.x
- Docker image built and available: `movie-api:latest`

## Quick Start (Local - OrbStack)

### 1. Build Docker Image

```bash
docker build -t movie-api:latest .
```

### 2. Add Bitnami Repository

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm dependency update ./helm/movie-api
```

### 3. Install Chart with Dependencies

```bash
# Install with MongoDB and Redis (local, no registry needed, debug and dry run can be useful)
helm install movie-api ./helm/movie-api \
  --set mongodb.enabled=true \
  --set redis.enabled=true \
  --wait
```

For uninstall
```bash
helm uninstall movie-api || true         
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods

# Check health endpoint
kubectl port-forward svc/movie-api-movie-api 3000:80 -n default
curl http://localhost:3000/v1/health
```
### 5. Access API

```bash
# Port forward to access locally
kubectl port-forward svc/movie-api LOCAL_PORT:80

# API available at http://localhost:LOCAL_PORT/v1
# Swagger docs at http://localhost:8080/docs but you cant access because it is run on prod env.
```

## Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `2` |
| `image.repository` | Image repository | `movie-api` |
| `image.tag` | Image tag | `latest` |
| `strategy.rollingUpdate.maxUnavailable` | Max pods unavailable during update | `0` |
| `strategy.rollingUpdate.maxSurge` | Max extra pods during update | `1` |
| `mongodb.enabled` | Enable MongoDB dependency | `true` |
| `redis.enabled` | Enable Redis dependency | `true` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `128Mi` |

### Custom Values


## Production Setup

### Enable Authentication & Persistence

```bash
helm install movie-api ./helm/movie-api \
  --set mongodb.enabled=true \
  --set mongodb.auth.enabled=true \
  --set mongodb.auth.username=movieapp \
  --set mongodb.auth.password=<STRONG_PASSWORD> \
  --set mongodb.persistence.enabled=true \
  --set mongodb.persistence.size=10Gi \
  --set redis.enabled=true \
  --set redis.auth.enabled=true \
  --set redis.auth.password=<REDIS_PASSWORD> \
  --set redis.master.persistence.enabled=true \
  --set redis.master.persistence.size=2Gi
```

### Using External MongoDB/Redis

Disable dependencies and provide external connection:

```yaml
mongodb:
  enabled: false

redis:
  enabled: false

env:
  MONGO_URI: "mongodb://external-host:27017/moviedb"
  REDIS_HOST: "external-redis.example.com"
  REDIS_PORT: "6379"
```

## Upgrade (Rolling Update)

### Safe Rolling Update with Health Checks

```bash
# 1. Build new version
docker build -t movie-api:v1.2.3 .

# 2. Upgrade (zero-downtime, health check validated)
helm upgrade movie-api ./helm/movie-api \
  --set image.tag=v1.2.3 \
  --wait --timeout 10m

# 3. Monitor rollout
kubectl rollout status deployment/movie-api-movie-api
kubectl get pods -l app.kubernetes.io/instance=movie-api -w
```


## Uninstall

```bash
helm uninstall movie-api
```

## CI/CD

For automated deployments, it needs image registery

```bash
docker build -t <registry>/movie-api:${VERSION} .
docker push <registry>/movie-api:${VERSION}

# Deploy with Helm
helm upgrade --install movie-api ./helm/movie-api \
  --set image.repository=<registry>/movie-api \
  --set image.tag=${VERSION} \
  --wait
```
