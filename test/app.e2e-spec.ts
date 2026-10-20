import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) - Health Check', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('HEALTHY');
        expect(res.body).toHaveProperty('current_time');
      });
  });

  it('/v1/webhooks/transactions (POST) - Ingest Webhook and Query Status', async () => {
    const testTxnId = `txn_e2e_${Date.now()}`;
    const payload = {
      transaction_id: testTxnId,
      source_account: 'acc_test_user',
      destination_account: 'acc_test_merchant',
      amount: 1500,
      currency: 'INR',
    };

    // 1. Send Webhook
    await request(app.getHttpServer())
      .post('/v1/webhooks/transactions')
      .send(payload)
      .expect(202);

    // 2. Query Transaction Status immediately
    const res = await request(app.getHttpServer())
      .get(`/v1/transactions/${testTxnId}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].transaction_id).toBe(testTxnId);
    expect(res.body[0].status).toBe('PROCESSING');
    expect(res.body[0].processed_at).toBeNull();

    // 3. Duplicate Webhook (Idempotency)
    await request(app.getHttpServer())
      .post('/v1/webhooks/transactions')
      .send(payload)
      .expect(202);
  });

  afterAll(async () => {
    await app.close();
  });
});
