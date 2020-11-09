import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, OneToMany, PrimaryColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Transaction } from "./Transaction";

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @PrimaryColumn()
  @Field(() => ID)
  id: string;

  @Column()
  @Field(() => Number)
  balance: number;
  
  @Field(() => [Transaction])
  @OneToMany(() => Transaction, transaction => transaction.from)
  outgoingTransactions: Transaction[]

  @Field(() => [Transaction])
  @OneToMany(() => Transaction, transaction => transaction.to)
  incomingTransactions: Transaction[]
}