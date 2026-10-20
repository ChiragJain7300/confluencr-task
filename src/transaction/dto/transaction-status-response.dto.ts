import { ApiProperty } from "@nestjs/swagger";
import { Transaction } from "../entities/transaction.entity";


export class TransactionStatusResponseDto {
    @ApiProperty({
        example: "txn_abc123def456"
    })
    transaction_id: string;
    @ApiProperty({
        example: "acc_user_789"
    })
    source_account: string;
    @ApiProperty({
        example: "acc_merchant_456"
    })
    destination_account: string;
    
    @ApiProperty({
        example: 150.50
    })
    amount: number;

    @ApiProperty({
        example: "USD"
    })
    currency: string;
    @ApiProperty({
        example: "PROCESSED"
    })
    status: string;
    @ApiProperty({
        example: "2024-01-15T10:30:00Z"
    })
    created_at: Date;

    @ApiProperty({
        example: "2024-01-15T10:30:30Z"
    })
    processed_at: Date | null;


    constructor(transaction: Transaction){
        this.transaction_id = transaction.transaction_id;
        this.source_account = transaction.source_account;
        this.destination_account = transaction.destination_account;
        this.amount = Number(transaction.amount);
        this.currency = transaction.currency;
        this.status = transaction.status;
        this.created_at = transaction.created_at;
        this.processed_at = transaction.processed_at;
    }
}
    
