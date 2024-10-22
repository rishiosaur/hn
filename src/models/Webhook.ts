import {
	BaseEntity,
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'
import User from './User'

@Entity()
@ObjectType()
export class PaymentWebhook extends BaseEntity {
	@PrimaryGeneratedColumn()
	@Field(() => ID, {
		description: 'An autoincrementing identifier for a webhook.',
	})
	id: string

	@Column()
	@Field(() => String, {
		description: 'URL to hit on webhook.',
	})
	url: string

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.paymentWebhooks)
	user: User
}

@Entity()
@ObjectType()
export class TransactionWebhook extends BaseEntity {
	@PrimaryGeneratedColumn()
	@Field(() => ID, {
		description: 'An autoincrementing identifier for a webhook.',
	})
	id: string

	@Column()
	@Field(() => String, {
		description: 'URL to hit on webhook.',
	})
	url: string

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.transactionWebhooks)
	user: User
}
