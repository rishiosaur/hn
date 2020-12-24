import { Resolver, Query, Mutation, Arg, Authorized } from 'type-graphql'
import User from '../../models/User'
import { makeString, hashCode } from '../../util/index'
import { PaginationInput } from '../../models/Pagination'

@Resolver()
export default class UserResolver {
	@Query(() => [User], {
		description: 'Finds all users. 2n relationships.',
	})
	async users(
		@Arg('options', {
			nullable: true,
		})
		options: PaginationInput
	) {
		if (options.take) {
			return User.find({
				relations: [
					'incomingTransactions',
					'outgoingTransactions',
					'outgoingTransactions.to',
					'outgoingTransactions.from',
					'incomingTransactions.to',
					'incomingTransactions.from',
				],
				skip: options.skip || 0 + options.take * (options.page || 0),
				take: options.take,
			})
		} else {
			return User.find({
				relations: [
					'incomingTransactions',
					'outgoingTransactions',
					'outgoingTransactions.to',
					'outgoingTransactions.from',
					'incomingTransactions.to',
					'incomingTransactions.from',
				],
				skip: options.skip || 0,
			})
		}
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
		const u = await User.findOne(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})

		if (!!u) {
			return u
		}

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

		const _u = await User.findOneOrFail(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})

		_u.secret = secret

		return _u
	}

	@Authorized('admin')
	@Mutation(() => User, {
		description: 'Resets a user token.',
	})
	async resetUserSecret(@Arg('id') id: string) {
		const u = await User.findOne(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})

		if (!!u) {
			const secret = makeString(32)
			const secretHash = hashCode(secret).toString()

			u.secret = secret
			u.secretHash = secretHash

			await u.save()

			return u
		}

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

		const _u = await User.findOneOrFail(id, {
			relations: ['incomingTransactions', 'outgoingTransactions'],
		})

		_u.secret = secret

		return _u
	}
}
