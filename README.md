# Battery Passport Platform – MEAtec Backend Assignment

A microservices-based backend system for managing **digital battery passports** built with **Node.js, Express.js, MongoDB, Kafka, MinIO-compatible storage**, and **Docker**.

---

## Overview

This platform manages:
- User authentication & role-based access
- Battery passport lifecycle (create, update, retrieve, delete)
- Document storage in MinIO
- Event-driven notifications via Kafka

The architecture follows **service isolation** principles with **HTTP** and **Kafka** communication.

---

## Microservices

### 1. **Auth Service**
- **Responsibilities:**
  - User registration/login
  - JWT-based authentication
  - Role-based access control
- **Endpoints:**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/introspect`
- **Database:** `authdb`

### 2. **Battery Passport Service**
- **Responsibilities:**
  - Create, read, update, delete passports
  - Emits Kafka events: `passport.created`, `passport.updated`, `passport.deleted`
- **Endpoints:**
  - `GET /api/passports` (admin/user)
  - `POST /api/passports` (admin)
  - `GET /api/passports/:id`
  - `PUT /api/passports/:id` (admin)
  - `DELETE /api/passports/:id` (admin)
- **Database:** `passportdb`

### 3. **Document Service**
- **Responsibilities:**
  - Upload documents to MinIO
  - Manage metadata in MongoDB
- **Endpoints:**
  - `POST /api/documents/upload`
  - `GET /api/documents/:docId`
  - `GET /api/documents/:docId/download`
  - `PUT /api/documents/:docId`
  - `DELETE /api/documents/:docId`
- **Database:** `documentdb`

### 4. **Notification Service**
- **Responsibilities:**
  - Kafka consumer for passport events
  - Sends email or logs messages

---

## Communication
- **HTTP** – Auth & role validation between services
- **Kafka** – Asynchronous event communication
- **MinIO** – File storage

---

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Messaging:** Apache Kafka
- **Storage:** MinIO
- **Auth:** JWT, bcrypt
- **Containerization:** Docker, Docker Compose
- **Logging:** Custom logger with request tracing

---

## Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/battery-passport-platform.git
   cd battery-passport-platform
   ```
2. Create `.env` files for each service (see `services/*/.env.example`).
3. Start the services:
   ```bash
   docker compose up --build
   ```
4. Access services:
   - **Auth Service:** http://localhost:5000
   - **Passport Service:** http://localhost:5001
   - **Document Service:** http://localhost:5002
   - **Notification Service:** http://localhost:5003

---

## Kafka Topics & Payload Structure

### `passport.created`
```json
{
  "passportId": "1234567890",
  "userEmail": "owner@example.com",
  "timestamp": "2025-08-11T10:00:00Z"
}
```

### `passport.updated`
```json
{
  "passportId": "1234567890",
  "userEmail": "owner@example.com",
  "timestamp": "2025-08-11T10:10:00Z"
}
```

### `passport.deleted`
```json
{
  "passportId": "1234567890",
  "userEmail": "owner@example.com",
  "timestamp": "2025-08-11T10:20:00Z"
}
```

---

## API Usage (Deployed Endpoints)

Below are the cURL commands for each deployed API from the Postman collection:

### User Register
```bash
curl -X POST "https://battery-passport-platform-f4e4.onrender.com/api/auth/register" -H "Content-Type: application/json" -d '{
    "email": "gambhirkartik5@gmail.com",
    "password": "Kartik@2000",
    "role": "admin"
}'
```
### User Login
```bash
curl -X POST "https://battery-passport-platform-f4e4.onrender.com/api/auth/login" -H "Content-Type: application/json" -d '{
    "email": "gambhirkartik5@gmail.com",
    "password": "Kartik@2000"
}'
```
### User dbSync
```bash
curl -X POST "https://battery-passport-platform-f4e4.onrender.com/internal/dbsync" -H "Content-Type: application/json" -H "x-internal-key: 4if3jwkd39er9i94" -H ": " -d '{
    "modelName": "User",
    "methodName": "find",
    "args": [
        {}
    ]
}'
```
### Create Passport
```bash
curl -X POST "https://battery-passport-platform-1.onrender.com/api/passports" -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkxMDYyNSwiZXhwIjoxNzU1NTE1NDI1fQ.xKITWueKhltzK6V4lO16J7nnGQkU5RKJwVoOylXCY64" -d '{
    "data": {
        "generalInformation": {
            "batteryIdentifier": "BP-2024-011",
            "batteryModel": {
                "id": "LM3-BAT-2024",
                "modelName": "GMC WZX1"
            },
            "batteryMass": 450,
            "batteryCategory": "EV",
            "batteryStatus": "Original",
            "manufacturingDate": "2024-01-15",
            "manufacturingPlace": "Gigafactory Nevada",
            "warrantyPeriod": "8",
            "manufacturerInformation": {
                "manufacturerName": "Tesla Inc",
                "manufacturerIdentifier": "TESLA-001"
            }
        },
        "materialComposition": {
            "batteryChemistry": "LiFePO4",
            "criticalRawMaterials": [
                "Lithium",
                "Iron"
            ],
            "hazardousSubstances": [
                {
                    "substanceName": "Lithium Hexafluorophosphate",
                    "chemicalFormula": "LiPF6",
                    "casNumber": "21324-40-3"
                }
            ]
        },
        "carbonFootprint": {
            "totalCarbonFootprint": 850,
            "measurementUnit": "kg CO2e",
            "methodology": "Life Cycle Assessment (LCA)"
        }
    }
}'
```
### Passport dbSync
```bash
curl -X POST "https://battery-passport-platform-1.onrender.com/internal/dbsync" -H "Content-Type: application/json" -H "x-internal-key: 4if3jwkd39er9i94" -d '{
    "modelName": "Passport",
    "methodName": "find",
    "args": [
        {}
    ]
}'
```
### Get Passport By ID
```bash
curl -X GET "https://battery-passport-platform-1.onrender.com/api/passports/6899cfb34ca96f13fd69565c" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkxMDYyNSwiZXhwIjoxNzU1NTE1NDI1fQ.xKITWueKhltzK6V4lO16J7nnGQkU5RKJwVoOylXCY64"
```
### Update Passport
```bash
curl -X PUT "https://battery-passport-platform-1.onrender.com/api/passports/6899cfb34ca96f13fd69565c" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkxMDYyNSwiZXhwIjoxNzU1NTE1NDI1fQ.xKITWueKhltzK6V4lO16J7nnGQkU5RKJwVoOylXCY64" -H "Content-Type: application/json" -d '{
    "data": {
        "generalInformation": {
            "warrantyPeriod": "10"
        }
    }
}'
```
### Delete Passport By ID
```bash
curl -X DELETE "https://battery-passport-platform-1.onrender.com/api/passports/68982497d085a75c42621fd1" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTYzNzEwMDE1NGY4YTc3MDk2ODBjYyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDcwODk4OCwiZXhwIjoxNzU1MzEzNzg4fQ.HwCtzLFKlZLbq5bWry9VEBBY3NWiSgO8VeWQnZ4NqNc"
```
### Upload Document
```bash
curl -X POST "https://document-service-dozf.onrender.com/api/documents/upload" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkyNjE4NywiZXhwIjoxNzU1NTMwOTg3fQ.2nV_96DuNY12Soeq06tAPTvEQsorIOSM3lzppSIncxU"
```
### Get Presigned URL
```bash
curl -X GET "https://document-service-dozf.onrender.com/api/documents/689a11a886866bcc7142a65d" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkyNjE4NywiZXhwIjoxNzU1NTMwOTg3fQ.2nV_96DuNY12Soeq06tAPTvEQsorIOSM3lzppSIncxU"
```
### Update Metadata
```bash
curl -X PUT "https://document-service-dozf.onrender.com/api/documents/689a11a886866bcc7142a65d" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkyNjE4NywiZXhwIjoxNzU1NTMwOTg3fQ.2nV_96DuNY12Soeq06tAPTvEQsorIOSM3lzppSIncxU" -H "Content-Type: application/json" -d '{
    "fileName": "test.txt"
}'
```
### Delete Document
```bash
curl -X DELETE "https://document-service-dozf.onrender.com/api/documents/689a11a886866bcc7142a65d" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTgwZDllZTdjMmFmNGRjN2NjNmZiYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDc5NTQ1MSwiZXhwIjoxNzU1NDAwMjUxfQ.y2baHnpxZJgSIGqzgcScgFc4yjN5mVDsNoGLHA2im1w"
```
### http://localhost:5001/health
```bash
curl -X GET "https://document-service-dozf.onrender.com/health"
```
### Fetch all Passports
```bash
curl -X GET "https://battery-passport-platform-1.onrender.com/api/passports" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTljMjk3OGViMzZmZGEyMDg1NmI4NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDkxMTAzNiwiZXhwIjoxNzU1NTE1ODM2fQ.SHkUQ3Ld8zAlVLdjDEUqrSpZXebxqeKolzi453OPVuk"
```

---

## Deployment
Services are containerized and can be deployed to:
- Render
- AWS ECS/Fargate
- Any container orchestration platform

