import User from './User'
import {
	Entity,
	BaseEntity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'
import { ColumnNumericTransformer } from './interfaces'
import Big from 'big.js'

@Entity()
@ObjectType()
export default class Transaction extends BaseEntity implements Transaction {
	@PrimaryGeneratedColumn()
	@Field(() => ID, {
		description: 'An autoincrementing identifier for a transaction.',
	})
	id: string

	@Column('numeric', {
		precision: 64,
		scale: 18,
		default: 0,
		transformer: new ColumnNumericTransformer(),
	})
	@Field(() => Number, {
		description: 'An autoincrementing identifier for a transaction.',
	})
	balance: Big

	@ManyToOne(() => User, (user) => user.outgoingTransactions)
	@Field(() => User, {
		description: 'Relationship to a user that is sending currency.',
	})
	from: User

	@ManyToOne(() => User, (user) => user.incomingTransactions)
	@Field(() => User, {
		description: 'Relationship to a user that is receiving currency.',
	})
	to: User

	@Field(() => Boolean, {
		description: 'Whether or not the transaction has gone through.',
	})
	@Column({ default: false })
	validated: boolean

	@Field(() => String, {
		description: 'A reason for a transaction.',
	})
	@Column({ default: '', nullable: true })
	for: string
}
