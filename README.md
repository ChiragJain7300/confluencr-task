# Transaction Webhook Ingestion & Background Processing Service

> **Note on Framework Selection**: Per conversation with the recruitment team, this service is implemented in **NestJS (TypeScript)** to leverage its modular architecture, strict type validation, and production-ready queue integration.

A reliable, asynchronous payment webhook ingestion engine built with **NestJS**, **TypeORM**, **PostgreSQL (Supabase)**, and **BullMQ (Upstash Redis)**.

---

## 🌐 Public Deployed API

- **Base URL**: `https://confluencr-task-9wip.onrender.com/` *(Replace with your deployed Render/Railway URL)*
- **Swagger Documentation**: `https://confluencr-task-9wip.onrender.com/docs`
- **Health Check**: `GET https://confluencr-task-9wip.onrender.com/`

---

## 💡 Technical Choices & Rationale

### 1. Framework: NestJS (TypeScript)
- **Why**: NestJS provides a clean, modular structure (Controllers, Services, DTOs, Processors). It enforces separation of concerns and maintainability.
- **Strict Validation**: Uses `class-validator` and `class-transformer` to automatically reject malformed requests with `400 Bad Request` before reaching business logic.
- **Performance**: Built on Node.js’s non-blocking event loop, handling webhook ingestion in under **25ms** (far below the 500ms requirement).

### 2. Queue & Background Processing: BullMQ + Upstash Redis
- **Why not in-memory (`setTimeout`)?**:
  In-memory timers are lost if the server restarts or crashes during the 30-second delay. Redis-backed queues persist job state across server restarts.
- **Decoupling**: Decouples fast HTTP ingestion from downstream processing.
- **Delayed Execution**: BullMQ natively supports delayed execution (`delay: 30000`) using Redis sorted sets (ZSET), moving the job to the active worker queue once the delay elapses.

### 3. Database & ORM: PostgreSQL (Supabase) + TypeORM
- **ACID Compliance**: Ensures transaction state transitions (`PROCESSING` -> `PROCESSED`) are atomic and durable.
- **Connection Pooler**: Connects via Supabase's IPv4 connection pooler (`port 5432`) with SSL enabled for cloud hosting compatibility.

### 4. Idempotency & Concurrency Strategy
- **Database Layer**: `transaction_id` is defined with a `UNIQUE` constraint in PostgreSQL. Duplicate inserts are caught via database-level conflict handling (PostgreSQL error code `23505`).
- **Queue Layer**: Every BullMQ job is submitted with `jobId: transaction.transaction_id`. Redis refuses to create duplicate jobs if a job with the same ID is already pending or delayed.
- **Result**: Sending the same webhook multiple times returns `202 Accepted` gracefully without re-processing or throwing errors.

---

## 📡 API Specification & Contracts

### 1. Health Check
- **Endpoint**: `GET /`
- **Status Code**: `200 OK`
- **Sample Response**:
  ```json
  {
    "status": "HEALTHY",
    "current_time": "2026-10-20T14:47:07.198Z"
  }
  ```

### 2. Webhook Ingestion
- **Endpoint**: `POST /v1/webhooks/transactions`
- **Status Code**: `202 Accepted`
- **Response Time**: `< 25ms` (target: `< 500ms`)
- **Request Body**:
  ```json
  {
    "transaction_id": "txn_abc123def456",
    "source_account": "acc_user_789",
    "destination_account": "acc_merchant_456",
    "amount": 1500,
    "currency": "INR"
  }
  ```
- **Sample Response**:
  ```json
  {
    "status": "created",
    "message": "Transaction has been queued for processing"
  }
  ```

### 3. Query Transaction Status
- **Endpoint**: `GET /v1/transactions/:transaction_id`
- **Status Code**: `200 OK`
- **Response During Processing (0 - 30 seconds)**:
  ```json
  [
    {
      "transaction_id": "txn_abc123def456",
      "source_account": "acc_user_789",
      "destination_account": "acc_merchant_456",
      "amount": 1500,
      "currency": "INR",
      "status": "PROCESSING",
      "created_at": "2026-10-20T14:47:13.751Z",
      "processed_at": null
    }
  ]
  ```
- **Response After Completion (After 30 seconds)**:
  ```json
  [
    {
      "transaction_id": "txn_abc123def456",
      "source_account": "acc_user_789",
      "destination_account": "acc_merchant_456",
      "amount": 1500,
      "currency": "INR",
      "status": "PROCESSED",
      "created_at": "2026-10-20T14:47:13.751Z",
      "processed_at": "2026-10-20T14:47:44.272Z"
    }
  ]
  ```

---

## 💻 Instructions to Run & Test Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Cloud or local PostgreSQL instance (e.g., [Supabase](https://supabase.com))
- Cloud or local Redis instance (e.g., [Upstash](https://upstash.com))

### 2. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
PORT=3001
DB_SUPABASE_CONN_STR="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
REDIS_URL="rediss://default:[TOKEN]@[HOST].upstash.io:6379"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
# Development mode (auto-reload on code change)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```
The server will start on `http://localhost:3001`.

### 5. Interactive Swagger Documentation
Open your browser and navigate to:
```
http://localhost:3001/api/docs
```

---

## 🧪 Testing Guide

### Run Automated Unit Tests
```bash
npm run test
```

### Run End-to-End (E2E) Integration Tests
```bash
npm run test:e2e
```
The E2E suite automatically verifies:
- `GET /` returns 200 with ISO timestamp.
- `POST /v1/webhooks/transactions` accepts payloads with 202 Accepted.
- `GET /v1/transactions/:id` returns initial `PROCESSING` state with `processed_at: null`.
- Duplicate webhooks return 202 without creating duplicate database rows.

---

## 📋 Manual Verification Steps (Curl)

You can easily verify the 4 success criteria with standard `curl` commands:

### Step 1: Health Check
```bash
curl -i http://localhost:3001/
```

### Step 2: Send Single Webhook
```bash
curl -i -X POST http://localhost:3001/v1/webhooks/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_demo_999",
    "source_account": "acc_user_101",
    "destination_account": "acc_merchant_202",
    "amount": 1500,
    "currency": "INR"
  }'
```
*Expected: HTTP `202 Accepted` within 30ms.*

### Step 3: Immediate Status Query (< 30s)
```bash
curl -i http://localhost:3001/v1/transactions/txn_demo_999
```
*Expected: `status: "PROCESSING"`, `processed_at: null`.*

### Step 4: Test Duplicate Prevention
Send the exact same request again immediately:
```bash
curl -i -X POST http://localhost:3001/v1/webhooks/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_demo_999",
    "source_account": "acc_user_101",
    "destination_account": "acc_merchant_202",
    "amount": 1500,
    "currency": "INR"
  }'
```
*Expected: HTTP `202 Accepted` handled gracefully.*

### Step 5: Query Status After 30s
Wait 30 seconds and check again:
```bash
curl -i http://localhost:3001/v1/transactions/txn_demo_999
```
*Expected: `status: "PROCESSED"`, `processed_at: "<timestamp>"`.*

---

## ☁️ Deployment Guide (Render)

1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Select your repository and set:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
4. Under **Environment Variables**, add:
   - `DB_SUPABASE_CONN_STR`: your connection string from `.env`
   - `REDIS_URL`: your connection string from `.env`
5. Click **Deploy Web Service**.
