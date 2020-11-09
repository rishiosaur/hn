import { User } from './User';
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@Entity()
@ObjectType()
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field(() => Number)
  balance: number;


  @ManyToOne(() => User, user => user.outgoingTransactions)
  @Field(() => User)
  from: User;

  @ManyToOne(() => User, user => user.incomingTransactions)
  @Field(() => User)
  to: User;

  @Field(() => Boolean)
  @Column({ default: false })
  validated: boolean;
}