import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('transactions')
export class Transaction{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    transaction_id: string;

    @Column()
    source_account: string;

    @Column()
    destination_account: string;

    @Column({type: "numeric"})
    amount: number;

    @Column()
    currency: string;

    @Column({
        type: 'enum',
        enum: ['PROCESSING', 'PROCESSED', 'FAILED'],
        default: 'PROCESSING'
    })
    status: string;

    @Column({
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP'
    })
    created_at: Date;

    @Column({
        type: 'timestamptz',
        nullable: true
    })
    processed_at: Date | null;

}