import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionStatusResponseDto } from './dto/transaction-status-response.dto';


@Controller('v1/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Get(':transactionId')
  async getTransactionStatus(@Param('transactionId') transactionId: string): Promise<TransactionStatusResponseDto[]> {
    return await this.transactionService.findOne(transactionId);
  }
}
