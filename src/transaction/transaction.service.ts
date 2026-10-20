import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionStatusResponseDto } from './dto/transaction-status-response.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TransactionService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>, 
        @InjectQueue('transaction-queue') private readonly transactionQueue: Queue
    ){}

    async findOne(transactionId: string): Promise<TransactionStatusResponseDto[]>{
        const result = await this.transactionRepository.findOneBy({transaction_id: transactionId});
        if(!result){
            throw new NotFoundException(`Transaction with id ${transactionId} not found`);
        }

        return [new TransactionStatusResponseDto(result)];
    }

    async create(createTransactionDto: CreateTransactionRequestDto): Promise<any> {
        const transactionExists = await this.transactionRepository.findOneBy({transaction_id: createTransactionDto.transaction_id});
        if(transactionExists){
            return {
                status: 202,
                message: "The transaction with same ID is already being processed"
            }
        }
        try {
              const transaction = this.transactionRepository.create({...createTransactionDto, processed_at: null});
        await this.transactionRepository.save(transaction);
        await this.transactionQueue.add('process-transaction', transaction, {
            jobId: transaction.transaction_id,
            delay: 30000,
            removeOnComplete: true,
            removeOnFail: true
        });

        return {
            status: 202,
            message: "The transaction is being processed"
        }
        } catch (error) {
            if (error.code === '23505') {
                return { status: 202, message: 'Transaction already being processed' };
            }
            throw error;
        }
    }

    async updateTransactionStatus(transactionId: string, status: string, processed_at: Date): Promise<void>{
        const transaction = await this.transactionRepository.findOneBy({transaction_id: transactionId});
        if(!transaction){
            throw new NotFoundException(`Transaction with id ${transactionId} not found`);
        }
        transaction.status = status;
        transaction.processed_at = processed_at;
        await this.transactionRepository.save(transaction);
    }
        
    
}
