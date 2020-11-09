import { Field, ObjectType, ID } from 'type-graphql'
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
@ObjectType()
export default class Bot extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	@Field(() => ID, {
		description: 'ID of the bot',
	})
	id: string

	@Column()
	@Field(() => String)
	maker: string

	@Column()
	@Field(() => String)
	slackID: string

	@Column()
	@Field(() => String)
	passwordHash: string

	@Field(() => String)
	password: string
}
