# 🔋 Battery Passport Platform — MEAtec Backend Assignment

A microservices-based backend system for **digital battery passports** built with **Node.js, Express, MongoDB, Kafka, and MinIO (S3-compatible)**, containerized with **Docker Compose**.

---

## 1) Service Descriptions

### Auth Service
- **Purpose:** User registration/login, JWT auth, role-based access.
- **Ports:** `5000`
- **DB:** `authdb` (MongoDB)
- **Notes:** Other services call this to validate/authorize requests.

### Battery Passport Service
- **Purpose:** CRUD for battery passports.
- **Ports:** `5001`
- **DB:** `passportdb` (MongoDB)
- **Events:** Emits **`passport.created`**, **`passport.updated`**, **`passport.deleted`** to Kafka.

### Document Service
- **Purpose:** File upload/download + metadata.
- **Ports:** `5002`
- **DB:** `documentdb` (MongoDB)
- **Storage:** MinIO (S3-compatible). Returns presigned URLs or streams files.

### Notification Service
- **Purpose:** Kafka consumer for passport events, sends emails (via SMTP) or logs them.
- **Ports:** `5003`
- **DB:** —
- **Notes:** No public CRUD; has `/health` and consumes Kafka topics.

---

## 2) API Usage (Quick Tests with `curl`)

> Replace `<JWT>` with the token from login. Replace `DOC_ID` / `PASS_ID` after creation.

### Auth
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass@123","role":"admin"}'

# Login (copy the "token" from the response)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass@123"}'
````

### Battery Passports

```bash
# Create (Admin)
curl -X POST http://localhost:5001/api/passports \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{
        "data": {
          "generalInformation": {
            "batteryIdentifier": "BP-2024-011",
            "batteryModel": {"id":"LM3-BAT-2024","modelName":"GMC WZX1"},
            "batteryMass": 450, "batteryCategory": "EV", "batteryStatus": "Original",
            "manufacturingDate": "2024-01-15", "manufacturingPlace": "Gigafactory Nevada",
            "warrantyPeriod": "8",
            "manufacturerInformation": {"manufacturerName":"Tesla Inc","manufacturerIdentifier":"TESLA-001"}
          },
          "materialComposition": {
            "batteryChemistry": "LiFePO4",
            "criticalRawMaterials": ["Lithium","Iron"],
            "hazardousSubstances": [{
              "substanceName":"Lithium Hexafluorophosphate","chemicalFormula":"LiPF6","casNumber":"21324-40-3"
            }]
          },
          "carbonFootprint": {
            "totalCarbonFootprint": 850, "measurementUnit":"kg CO2e", "methodology":"Life Cycle Assessment (LCA)"
          }
        }
      }'

# List (Admin/User)
curl -H "Authorization: Bearer <JWT>" http://localhost:5001/api/passports

# Get by ID
curl -H "Authorization: Bearer <JWT>" http://localhost:5001/api/passports/PASS_ID

# Update (Admin)
curl -X PUT http://localhost:5001/api/passports/PASS_ID \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"data":{"generalInformation":{"warrantyPeriod":"10"}}}'

# Delete (Admin)
curl -X DELETE -H "Authorization: Bearer <JWT>" http://localhost:5001/api/passports/PASS_ID
```

### Documents (MinIO-backed)

```bash
# Upload (multipart/form-data)
curl -X POST http://localhost:5002/api/documents/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@/absolute/path/to/file.pdf"

# Get presigned URL
curl -H "Authorization: Bearer <JWT>" http://localhost:5002/api/documents/DOC_ID

# Stream download via service
curl -L -H "Authorization: Bearer <JWT>" http://localhost:5002/api/documents/DOC_ID/download --output file.pdf

# Update metadata (Admin)
curl -X PUT http://localhost:5002/api/documents/DOC_ID \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"fileName":"renamed.pdf"}'

# Delete (Admin)
curl -X DELETE -H "Authorization: Bearer <JWT>" http://localhost:5002/api/documents/DOC_ID
```

---

## 3) Setup Instructions (Docker + .env)

### Prerequisites

* **Docker** & **Docker Compose**
* **Node.js 18+** (for local dev without Docker)

### `.env` examples (create in each service folder)

**Common values used across services**

```
MONGO_URI=mongodb://mongo:27017
JWT_SECRET=supersecretkey
INTERNAL_API_KEY=internalkey123
```

**Auth Service (`services/auth/.env`)**

```
PORT=5000
MONGO_URI=mongodb://mongo:27017
DB_NAME=authdb
JWT_SECRET=supersecretkey
INTERNAL_API_KEY=internalkey123
```

**Passport Service (`services/passport/.env`)**

```
PORT=5001
MONGO_URI=mongodb://mongo:27017
DB_NAME=passportdb
JWT_SECRET=supersecretkey
AUTH_BASE_URL=http://auth:5000
KAFKA_BROKERS=kafka:9092
INTERNAL_API_KEY=internalkey123
```

**Document Service (`services/document/.env`)**

```
PORT=5002
MONGO_URI=mongodb://mongo:27017
DB_NAME=documentdb
JWT_SECRET=supersecretkey
AUTH_BASE_URL=http://auth:5000
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=bp-docs
INTERNAL_API_KEY=internalkey123
```

**Notification Service (`services/notification/.env`)**

```
PORT=5003
KAFKA_BROKERS=kafka:9092
# Optional SMTP (if omitted, service logs events instead of emailing)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Battery Passport <no-reply@example.com>
```

### `docker-compose.yml` (root)

> If you don’t already have one, here’s a minimal example:

```yaml
version: "3.9"
services:
  mongo:
    image: mongo:6
    ports: ["27017:27017"]
    volumes: [mongo:/data/db]

  zookeeper:
    image: bitnami/zookeeper:3.9
    environment: [ALLOW_ANONYMOUS_LOGIN=yes]
    ports: ["2181:2181"]

  kafka:
    image: bitnami/kafka:3.6
    depends_on: [zookeeper]
    ports: ["9092:9092"]
    environment:
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - ALLOW_PLAINTEXT_LISTENER=yes

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    ports: ["9000:9000","9001:9001"]
    volumes: [minio:/data]

  auth:
    build: ./services/auth
    env_file: [./services/auth/.env]
    depends_on: [mongo]
    ports: ["5000:5000"]

  passport:
    build: ./services/passport
    env_file: [./services/passport/.env]
    depends_on: [auth, mongo, kafka]
    ports: ["5001:5001"]

  document:
    build: ./services/document
    env_file: [./services/document/.env]
    depends_on: [auth, mongo, minio]
    ports: ["5002:5002"]

  notification:
    build: ./services/notification
    env_file: [./services/notification/.env]
    depends_on: [kafka]
    ports: ["5003:5003"]

volumes:
  mongo: {}
  minio: {}
```

### Run locally

```bash
docker compose up --build
```

**Local URLs**

* Auth → `http://localhost:5000`
* Passports → `http://localhost:5001`
* Documents → `http://localhost:5002`
* Notification → `http://localhost:5003`

---

## 4) Kafka Topics & Payload Structure

**Topics**

* `passport.created`
* `passport.updated`
* `passport.deleted`

**Common payload shape**

```json
{
  "event": "passport.created",
  "passportId": "6899cfb34ca96f13fd69565c",
  "userEmail": "owner@example.com",
  "changes": { "generalInformation.warrantyPeriod": ["8","10"] },
  "actor": { "id": "userId", "role": "admin" },
  "timestamp": "2025-08-11T10:00:00Z"
}
```

**Notes**

* The **Notification Service** consumes these topics.
* If SMTP is configured, an **email** is sent; otherwise, the event is **logged**.

---

## Health/Readiness (for all services)

* `GET /health` → `{ "status": "ok" }`
* `GET /ready` → `{ "ready": true|false }` (if implemented)

---

## Author

**Kartik Gambhir** — Senior Backend Engineer (Node.js, AWS, Microservices)

```
