import { Resolver, Query, Mutation, Arg } from 'type-graphql'
import { User } from '../models/User'

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
	async createUser(@Arg('id') id: string) {
		const user = new User()
		user.id = id
		user.incomingTransactions = []
		user.outgoingTransactions = []
		user.balance = 0
		await user.save()

		return await User.findOneOrFail(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})
	}
}
