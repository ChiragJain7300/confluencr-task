import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { BullModule } from '@nestjs/bullmq';
import { TransactionProcessor } from './transaction.processor';


@Module({
  imports: [TypeOrmModule.forFeature([Transaction]),  BullModule.registerQueueAsync({
      name: 'transaction-queue',
      useFactory: () => ({
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 100,
          },
        },
      }),
    }),],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionProcessor],
  exports: [TransactionService]
})
export class TransactionModule {}
