import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionRequestDto } from '../transaction/dto/create-transaction.dto';
import { TransactionService } from '../transaction/transaction.service';

@ApiTags('Webhooks')
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('/transactions')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ingest transaction webhook' })
  @ApiResponse({
    status: 202,
    description: 'Webhook accepted for processing',
    schema: {
      example: {
        status: 202,
        message: 'The transaction is being processed',
        transaction_id: 'txn_abc123def456',
      },
    },
  })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionRequestDto,
  ) {
    return await this.transactionService.create(createTransactionDto);
  }
}
