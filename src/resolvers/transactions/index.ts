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
import { getRepository, getManager } from 'typeorm'

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
		return await getManager().transaction(async (manager) => {
			const transaction = new Transaction()

			transaction.balance = data.balance
			transaction.validated = false

			const userQuery = getRepository(User)
				.createQueryBuilder('user')
				.select('*')
				.useTransaction(true)
				.setLock('pessimistic_write')
				.select(['user.balance', 'user.id'])
				.innerJoinAndSelect('user.incomingTransactions', 'incomingTransactions')
				.innerJoinAndSelect('user.outgoingTransactions', 'outgoingTransactions')

			const fromUser = (await userQuery
				.where('user.id = :id', { id: data.from })
				.getOne()) as User

			const toUser = (await userQuery
				.where('user.id = :id', { id: data.to })
				.getOne()) as User

			fromUser.outgoingTransactions.push(transaction)
			toUser.incomingTransactions.push(transaction)

			transaction.from = fromUser
			transaction.to = toUser

			await manager.save(transaction)

			await manager.save(fromUser)
			await manager.save(toUser)

			return transaction
		})
	}

	@Authorized(['bot', 'admin'])
	@Mutation(() => Transaction, {
		description: 'Directly moves currency between two accounts.',
	})
	async send(@Arg('data') data: CreateTransaction) {
		return await getManager().transaction(async (manager) => {
			const userQuery = getRepository(User)
				.createQueryBuilder('user')
				.select('*')
				.useTransaction(true)
				.setLock('pessimistic_write')
				.select(['user.balance', 'user.id'])
				.innerJoinAndSelect('user.incomingTransactions', 'incomingTransactions')
				.innerJoinAndSelect('user.outgoingTransactions', 'outgoingTransactions')

			const fromUser = (await userQuery
				.where('user.id = :id', { id: data.from })
				.getOne()) as User

			const toUser = (await userQuery
				.where('user.id = :id', { id: data.to })
				.getOne()) as User

			console.log(toUser)

			let validated = false

			if (fromUser.balance >= data.balance) {
				fromUser.balance -= data.balance
				toUser.balance += data.balance
				validated = true
				// TODO: Push paid webhook
			}

			const transactionRepository = await getRepository(Transaction)
				.createQueryBuilder('transaction')
				.useTransaction(true)
				.setLock('pessimistic_write')

			const transaction = Transaction.create()

			transaction.balance = data.balance
			transaction.validated = validated
			transaction.from = fromUser
			transaction.to = toUser

			await transactionRepository.insert().values([transaction]).execute()

			fromUser.outgoingTransactions.push(transaction)
			toUser.incomingTransactions.push(transaction)

			await manager.save(transaction)
			await manager.save(toUser)
			await manager.save(fromUser)

			return transaction
		})
	}

	@Authorized(['admin', 'bot'])
	@Mutation(() => Transaction, {
		description:
			'Validates some transaction and moves currency if transaction is valid.',
	})
	async pay(@Arg('id') id: string) {
		return await getManager().transaction(async (manager) => {
			const transaction = await getRepository(Transaction)
				.createQueryBuilder('transaction')
				.select('*')
				.useTransaction(true)
				.setLock('pessimistic_write')
				.select([
					'transaction.balance',
					'transaction.id',
					'transaction.validated',
				])
				.innerJoinAndSelect('transaction.from', 'from')
				.innerJoinAndSelect('transaction.to', 'to')
				.where('transaction.id = :id', { id })
				.getOneOrFail()

			if (!transaction.validated) {
				if (transaction.from.balance > transaction.balance) {
					transaction.from.balance -= transaction.balance
					transaction.to.balance += transaction.balance
					await transaction.from.save()
					await transaction.to.save()

					transaction.validated = true

					await manager.save(transaction)
				}
			}

			return transaction
		})

		// const transaction = await Transaction.findOneOrFail(id, {
		// 	relations: ['from', 'to'],
		// })

		// if (!transaction.validated) {
		// 	if (transaction.from.balance > transaction.balance) {
		// 		transaction.from.balance -= transaction.balance
		// 		transaction.to.balance += transaction.balance
		// 		await transaction.from.save()
		// 		await transaction.to.save()

		// 		transaction.validated = true

		// 		await transaction.save()
		// 	}
		// }

		// return transaction
	}
}
