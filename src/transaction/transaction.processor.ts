import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { TransactionService } from "./transaction.service";

@Processor('transaction-queue')
export class TransactionProcessor extends WorkerHost{
    constructor ( private readonly transactionService: TransactionService){
        super()
    }
    
    async process(job: Job): Promise<any> {
        switch (job.name) {
            case 'process-transaction':
                await this.processTransaction(job);
                break;
            default:
                break;
        }
    }

    private async processTransaction(job: Job): Promise<void>{
        await this.transactionService.updateTransactionStatus(job.data.transaction_id, 'PROCESSED', new Date());
    }
}