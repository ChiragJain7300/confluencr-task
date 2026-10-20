import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTransactionRequestDto {
  @ApiProperty({
    example: 'txn_abc123def456',
    description: 'Unique identifier for the transaction',
  })
  @IsString()
  @IsNotEmpty()
  transaction_id: string;

  @ApiProperty({
    example: 'acc_user_789',
    description: 'Source account identifier',
  })
  @IsString()
  @IsNotEmpty()
  source_account: string;

  @ApiProperty({
    example: 'acc_merchant_456',
    description: 'Destination account identifier',
  })
  @IsString()
  @IsNotEmpty()
  destination_account: string;

  @ApiProperty({
    example: 1500,
    description: 'Transaction amount',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'INR',
    description: 'Three-letter currency code',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;
}