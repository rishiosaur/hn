import {
	Resolver,
	Query,
	Field,
	InputType,
	Mutation,
	Arg,
	Authorized,
} from 'type-graphql'
import User from '../../models/User'
import Transaction from '../../models/Transaction'

@InputType()
export class CreateTransaction {
	@Field({
		description: 'ID of the person that is transacting from their account',
	})
	from: string

	@Field({
		description: 'ID of the recipient',
	})
	to: string

	@Field({
		description: 'The amount being transacted',
	})
	balance: number
}

@Resolver()
export default class TransactionResolver {
	@Query(() => [Transaction], {
		description: 'Returns all transactions. Pretty slow.',
	})
	async transactions() {
		return await Transaction.find({
			relations: ['from', 'to'],
		})
	}

	@Query(() => Transaction, {
		description: 'Finds a single transaction using an ID.',
	})
	async transaction(@Arg('id') id: string) {
		return await Transaction.findOneOrFail(id, {
			relations: ['from', 'to'],
		})
	}

	@Mutation(() => Transaction, {
		description:
			'Creates an unvalidated transaction between two users and some balance. Use `pay` for payment validation.',
	})
	async transact(@Arg('data') data: CreateTransaction) {
		const transaction = new Transaction()

		transaction.balance = data.balance
		transaction.validated = false

		const fromUser = await User.findOneOrFail(data.from, {
			relations: ['outgoingTransactions', 'incomingTransactions'],
		})
		const toUser = await User.findOneOrFail(data.to, {
			relations: ['outgoingTransactions', 'incomingTransactions'],
		})
		transaction.from = fromUser
		transaction.to = toUser

		await transaction.save()

		fromUser.outgoingTransactions.push(transaction)
		toUser.incomingTransactions.push(transaction)
		return transaction
	}

	@Authorized(['admin', 'bot'])
	@Mutation(() => Transaction, {
		description:
			'Validates some transaction and moves currency if transaction is valid.',
	})
	async pay(@Arg('id') id: string) {
		const transaction = await Transaction.findOneOrFail(id, {
			relations: ['from', 'to'],
		})

		if (!transaction.validated) {
			if (transaction.from.balance > transaction.balance) {
				transaction.from.balance -= transaction.balance
				transaction.to.balance += transaction.balance
				await transaction.from.save()
				await transaction.to.save()

				transaction.validated = true

				await transaction.save()
			}
		}

		return transaction
	}
}
