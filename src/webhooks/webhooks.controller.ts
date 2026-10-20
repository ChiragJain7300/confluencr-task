import { Body, Controller, Post, Response } from '@nestjs/common';
import { CreateTransactionRequestDto } from '../transaction/dto/create-transaction.dto';
import { TransactionService } from '../transaction/transaction.service';


@Controller('v1/webhooks')
export class WebhooksController {
    constructor(private readonly transactionService: TransactionService){}
    @Post('/transactions')
  async createTransaction(@Body() createTransactionDto:CreateTransactionRequestDto, @Response() res):Promise<void>{
    const result = await this.transactionService.create(createTransactionDto);

    return res.status(202).json({
        status: 'created',
        message: 'Transaction has been queued for processing'
    })
  }
}
