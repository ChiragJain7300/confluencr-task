import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { TransactionStatusResponseDto } from './dto/transaction-status-response.dto';

@ApiTags('Transactions')
@Controller('v1/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get(':transactionId')
  @ApiOperation({ summary: 'Query transaction status by transaction_id' })
  @ApiResponse({
    status: 200,
    description: 'Transaction status details returned in an array',
    type: [TransactionStatusResponseDto],
  })
  async getTransactionStatus(
    @Param('transactionId') transactionId: string,
  ): Promise<TransactionStatusResponseDto[]> {
    return await this.transactionService.findOne(transactionId);
  }
}
