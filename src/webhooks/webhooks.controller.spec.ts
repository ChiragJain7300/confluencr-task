import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { TransactionService } from '../transaction/transaction.service';

jest.mock('../transaction/transaction.service');

describe('WebhooksController', () => {
  let controller: WebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              message: 'Webhook accepted for processing',
              transaction_id: 'txn_abc123def456',
              status: 'PROCESSING',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
