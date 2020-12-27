import User from './User'
import {
	Entity,
	BaseEntity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
} from 'typeorm'
import { ObjectType, Field, ID } from 'type-graphql'

@Entity()
@ObjectType()
export default class Transaction extends BaseEntity {
	@PrimaryGeneratedColumn()
	@Field(() => ID, {
		description: 'An autoincrementing identifier for a transaction.',
	})
	id: string

	@Column()
	@Field(() => Number, {
		description: 'An autoincrementing identifier for a transaction.',
	})
	balance: number

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
