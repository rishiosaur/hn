import { Resolver, Query, Field, InputType, Mutation, Arg } from 'type-graphql'
import { User } from '../models/User'
import { Transaction } from '../models/Transaction'
import { getRepository } from 'typeorm'

@InputType()
export class CreateUserInput {
	@Field()
	id: string
}

@Resolver()
export class UserResolver {
	@Query(() => [User])
	users() {
		return User.find({
			relations: [
				'incomingTransactions',
				'outgoingTransactions',
				'outgoingTransactions.to',
				'outgoingTransactions.from',
				'incomingTransactions.to',
				'incomingTransactions.from',
			],
		})
	}

	@Query(() => User)
	async user(@Arg('id') id: string) {
		return await User.findOneOrFail(id, {
			relations: [
				'incomingTransactions',
				'outgoingTransactions',
				'outgoingTransactions.to',
				'outgoingTransactions.from',
				'incomingTransactions.to',
				'incomingTransactions.from',
			],
		})
	}

	@Mutation(() => User)
	async createUser(@Arg('data') data: CreateUserInput) {
		const user = User.create(data)
		user.incomingTransactions = []
		user.outgoingTransactions = []
		user.balance = 0
		await user.save()

		return await User.findOneOrFail(data.id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})
	}
}
