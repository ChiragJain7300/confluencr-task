import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateTransactionRequestDto{
    @IsString()
    @IsNotEmpty()
    transaction_id: string;

    @IsString()
    @IsNotEmpty()
    source_account: string;

    @IsString()
    @IsNotEmpty()
    destination_account: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsNotEmpty()
    currency: string;
}