import { Entity, BaseEntity, Column, OneToMany, PrimaryColumn } from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'
import Transaction from './Transaction'

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
}
