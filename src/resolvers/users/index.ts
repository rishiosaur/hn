import { Resolver, Query, Mutation, Arg, Authorized } from 'type-graphql'
import User from '../../models/User'
import { makeString, hashCode } from '../../util/index'

@Resolver()
export default class UserResolver {
	@Query(() => [User], {
		description: 'Finds all users. 2n relationships.',
	})
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

	@Query(() => User, {
		description: 'Finds a user using an ID.',
	})
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

	@Authorized('admin')
	@Mutation(() => User, {
		description: 'Creates a user using a Slack ID.',
	})
	async createUser(@Arg('id') id: string) {
		const user = new User()
		user.id = id
		user.incomingTransactions = []
		user.outgoingTransactions = []
		user.balance = 0
		const secret = makeString(32)
		const secretHash = hashCode(secret).toString()

		user.secret = secret
		user.secretHash = secretHash

		await user.save()

		const u = await User.findOneOrFail(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})
		u.secret = secret

		return u
	}
}
