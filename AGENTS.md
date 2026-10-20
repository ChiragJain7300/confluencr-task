# AGENTS.md — Transaction Webhook Ingestion & Background Processing Service

## 1. Project Overview & Business Context
This service is a high-reliability, asynchronous payment webhook ingestion engine designed to receive transaction webhooks from external payment processors (e.g., Razorpay, Stripe, Cashfree).

### Key Business & Technical Requirements
1. **Immediate Acknowledgment**: Return `202 Accepted` within **500ms** regardless of downstream or external processing complexity.
2. **Background Processing**: Simulate an external processing call with a configurable delay (default: **30 seconds**).
3. **Idempotency & Concurrency**:
   - Multiple identical webhooks with the same `transaction_id` must result in **exactly one** processed transaction.
   - Handled gracefully without duplicate processing or race condition failures.
4. **Persistent State Tracking**:
   - While delayed: `status: "PROCESSING"`, `processed_at: null`.
   - After completion: `status: "PROCESSED"`, `processed_at: "<ISO-8601-timestamp>"`.
5. **Exact API Contracts**:
   - `GET /`: Health check returning `{ "status": "HEALTHY", "current_time": "..." }`.
   - `POST /v1/webhooks/transactions`: Accepts webhook payload, validates fields, returns `202 Accepted`.
   - `GET /v1/transactions/:transaction_id`: Returns transaction details inside an array: `[{ ... }]`.

---

## 2. Core Technology Stack
- **Framework**: NestJS (TypeScript) with Express HTTP adapter.
- **ORM / Persistence**: TypeORM with PostgreSQL (Neon / Supabase cloud database, with local fallback).
- **Asynchronous Task Queue**: BullMQ backed by Redis (e.g., Upstash Redis cloud instance or local Redis).
- **Validation & Transformation**: `class-validator`, `class-transformer`.
- **API Documentation**: `@nestjs/swagger` (OpenAPI docs available at `/api/docs`).
- **Testing**: Jest & Supertest (Unit & End-to-End integration tests).

---

## 3. Engineering Guidelines & Coding Standards

### A. Code Readability & Developer Understandability (Top Priority)
- **Clarity Over Cleverness**: Write clean, explicit TypeScript code. Avoid obscure metaprogramming or excessively deep abstraction layers.
- **Document the "Why"**: Include concise JSDoc comments on critical business logic (especially idempotency checks, atomic DB operations, and queue configurations) so the developer can explain every decision clearly during technical interviews.
- **Idiomatic NestJS**: Follow standard NestJS modular patterns:
  - `controllers/` handles HTTP request parsing, routing, and status codes.
  - `dto/` defines request validation rules using `class-validator`.
  - `services/` encapsulates business logic, DB queries, and queue dispatches.
  - `processors/` handles asynchronous BullMQ worker jobs.
  - `entities/` defines TypeORM database schemas.

### B. Production Standards & Resilience
1. **Strict Defense-in-Depth Idempotency**:
   - **Database Layer**: `transaction_id` MUST be defined with a `PRIMARY KEY` or `UNIQUE` constraint in TypeORM. Concurrent duplicate requests must be caught via database-level conflict handling (`INSERT ... ON CONFLICT DO NOTHING` or unique violation catch).
   - **Queue Layer**: BullMQ jobs must be submitted with `jobId: transaction_id` to guarantee that Redis refuses duplicate jobs even under race conditions.
2. **Non-Blocking Ingestion**:
   - The HTTP controller must only perform input validation, an atomic insert into the DB, push the job to BullMQ, and immediately return `202 Accepted`.
   - Never place timers, sleeps, or external HTTP calls inside the HTTP request lifecycle.
3. **Configuration & Environment Management**:
   - All credentials and configuration (Database URL, Redis URL, Processing delay) must be injected via `@nestjs/config` and validated via environment variables. Never hardcode credentials.
4. **Graceful Error Handling**:
   - Use standard NestJS Exception Filters.
   - Return clean, structured error responses for bad client input (`400 Bad Request`).
   - If a duplicate webhook is received, do not crash or return a 500 error; return `202 Accepted` gracefully.

---

## 4. API Specification Contracts

### 1. Health Check
- **Method**: `GET /`
- **Response Status**: `200 OK`
- **Response Body**:
  ```json
  {
    "status": "HEALTHY",
    "current_time": "2024-01-15T10:30:00Z"
  }
  ```

### 2. Transaction Webhook Ingestion
- **Method**: `POST /v1/webhooks/transactions`
- **Headers**: `Content-Type: application/json`
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
- **Response Status**: `202 Accepted`
- **Target Response Time**: `< 500ms` (typically < 30ms).
- **Response Body**:
  ```json
  {
    "message": "Webhook accepted for processing",
    "transaction_id": "txn_abc123def456",
    "status": "PROCESSING"
  }
  ```

### 3. Query Transaction Status
- **Method**: `GET /v1/transactions/:transaction_id`
- **Response Status**: `200 OK` (or `404 Not Found` if missing)
- **Response Body**:
  ```json
  [
    {
      "transaction_id": "txn_abc123def456",
      "source_account": "acc_user_789",
      "destination_account": "acc_merchant_456",
      "amount": 1500,
      "currency": "INR",
      "status": "PROCESSED",
      "created_at": "2024-01-15T10:30:00Z",
      "processed_at": "2024-01-15T10:30:30Z"
    }
  ]
  ```
  *(Note: `processed_at` must be `null` while `status` is `"PROCESSING"`).*

---

## 5. Interview Preparation Focus Points
When discussing this repository with interviewers, be prepared to articulate:
1. **Decoupling**: Why webhooks must be accepted immediately and offloaded to a queue rather than executed in-process.
2. **Failure Recovery**: Why Redis-backed BullMQ survives server crashes while in-memory `setTimeout` drops tasks.
3. **Idempotency Under High Concurrency**: How the dual-layer mechanism (BullMQ `jobId` + PostgreSQL `UNIQUE` constraint) prevents duplicate charges or duplicate status transitions.
4. **Observability**: How Swagger, health check endpoints, and structured logging provide operational clarity in production.
