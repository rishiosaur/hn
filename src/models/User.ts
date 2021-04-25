import { Entity, BaseEntity, Column, OneToMany, PrimaryColumn } from 'typeorm'
import {
	ObjectType,
	Field,
	ID,
	Resolver,
	FieldResolver,
	Root,
	Arg,
	Authorized,
} from 'type-graphql'
import Transaction from './Transaction'
import { PaginationInput } from './Pagination'
import { PaymentWebhook, TransactionWebhook } from './Webhook'

@Entity()
@ObjectType()
export default class User extends BaseEntity {
	@PrimaryColumn()
	@Field(() => ID, {
		description: 'ID of a user',
	})
	id: string

	@Column()
	@Field(() => Number, {
		description: 'Current balance of the user in HN.',
	})
	balance: number

	@Field(() => [Transaction], {
		description: 'The total outgoing transactions that the user has sent.',
	})
	@OneToMany(() => Transaction, (transaction) => transaction.from)
	outgoingTransactions: Transaction[]

	@Field(() => [Transaction], {
		description: 'All incoming transactions that the user has received.',
	})
	@OneToMany(() => Transaction, (transaction) => transaction.to)
	incomingTransactions: Transaction[]

	@Column()
	@Field(() => String)
	secretHash: string

	@Field(() => String, {
		nullable: true,
	})
	secret: string

	@Authorized(['authed', 'admin'])
	@Field(() => [PaymentWebhook], {
		description: 'All payment webhooks for this user.',
		defaultValue: [],
	})
	@OneToMany(() => PaymentWebhook, (transaction) => transaction.user)
	paymentWebhooks: PaymentWebhook[]

	@Authorized(['authed', 'admin'])
	@Field(() => [TransactionWebhook], {
		description: 'All payment webhooks for this user.',
		defaultValue: [],
	})
	@OneToMany(() => TransactionWebhook, (transaction) => transaction.user)
	transactionWebhooks: TransactionWebhook[]
}

@Resolver(() => User)
export class UserFieldResolver {
	@FieldResolver(() => [Transaction])
	async outgoingTransactions(
		@Root() root: User,
		@Arg('options', { nullable: true }) options?: PaginationInput
	) {
		let x = Transaction.createQueryBuilder('transaction')
			.where('transaction.fromId = :id', { id: root.id })
			.innerJoinAndSelect('transaction.from', 'from')
			.innerJoinAndSelect('transaction.to', 'to')

		if (options?.sort) {
			x = x.orderBy(
				`transaction.${options.sort.field}`,
				options.sort.order || 'ASC'
			)
		}

		if (options?.page || options?.skip) {
			x = x.skip(options.skip || 0 + (options.take || 0) * (options.page || 0))
		}

		if (options?.take) {
			x = x.take(options.take)
		}

		return x.getMany()
	}

	@FieldResolver(() => [Transaction])
	async incomingTransactions(
		@Root() root: User,
		@Arg('options', { nullable: true }) options?: PaginationInput
	) {
		let x = Transaction.createQueryBuilder('transaction')
			.where('transaction.toId = :id', { id: root.id })
			.innerJoinAndSelect('transaction.from', 'from')
			.innerJoinAndSelect('transaction.to', 'to')

		if (options?.sort) {
			x = x.orderBy(
				`transaction.${options.sort.field}`,
				options.sort.order || 'ASC'
			)
		}

		if (options?.page || options?.skip) {
			x = x.skip(options.skip || 0 + (options.take || 0) * (options.page || 0))
		}

		if (options?.take) {
			x = x.take(options.take)
		}

		return x.getMany()
	}
}
