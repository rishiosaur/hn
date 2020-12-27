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
import { PaginationInput } from '../../models/Pagination'
import axios from 'axios'

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

	@Field({
		description: 'Reason for transaction',
		nullable: true,
		defaultValue: '',
	})
	for: string
}

@Resolver()
export default class TransactionResolver {
	@Query(() => [Transaction], {
		description: 'Returns all transactions. Pretty slow.',
	})
	async transactions(
		@Arg('options', {
			nullable: true,
		})
		options: PaginationInput
	) {
		return Transaction.find({
			relations: ['from', 'to'],
			skip: options.skip || 0 + (options.take || 0) * (options.page || 0),
			take: options.take,
			...(options.sort && {
				order: {
					[options.sort.field]: options.sort.order || 'ASC',
				},
			}),
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
		if (data.from == data.to) {
			throw new Error(
				'Participants in transaction cannot have same ID. Each account must be distinct.'
			)
			return
		}

		return await getManager().transaction(async (manager) => {
			const transaction = new Transaction()

			transaction.balance = data.balance
			transaction.validated = false

			const userQuery = getRepository(User)
				.createQueryBuilder('user')
				.where('user.id = :id', { id: 'rishiosaur' })
				.useTransaction(true)
				.leftJoinAndSelect('user.incomingTransactions', 'incomingTransactions')
				.leftJoinAndSelect('user.outgoingTransactions', 'outgoingTransactions')

			const fromUser = (await userQuery
				.where('user.id = :id', { id: data.from })
				.getOneOrFail()) as User

			const toUser = (await userQuery
				.where('user.id = :id', { id: data.to })
				.getOneOrFail()) as User

			fromUser.outgoingTransactions.push(transaction)
			toUser.incomingTransactions.push(transaction)

			transaction.from = fromUser
			transaction.to = toUser
			transaction.for = data.for || ''

			await manager.save(transaction)

			await manager.save(fromUser)
			await manager.save(toUser)

			axios.get(
				(process.env.WEBHOOK_URL as string) +
					`/api/${data.to}/transactions/${transaction.id}`,
				{
					headers: {
						token: process.env.ADMIN,
					},
				}
			)

			return transaction
		})
	}

	@Authorized(['authed', 'admin'])
	@Mutation(() => Transaction, {
		description: 'Directly moves currency between two accounts.',
	})
	async send(@Arg('data') data: CreateTransaction) {
		if (data.from == data.to) {
			throw new Error(
				'Participants in transaction cannot have same ID. Each account must be distinct.'
			)
			return
		}

		return getManager().transaction(async (manager) => {
			const userQuery = getRepository(User)
				.createQueryBuilder('user')
				.useTransaction(true)
				.leftJoinAndSelect('user.incomingTransactions', 'incomingTransactions')
				.leftJoinAndSelect('user.outgoingTransactions', 'outgoingTransactions')

			const fromUser = (await userQuery
				.where('user.id = :id', { id: data.from })
				.getOneOrFail()) as User

			const toUser = (await userQuery
				.where('user.id = :id', { id: data.to })
				.getOneOrFail()) as User

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

			const transaction = Transaction.create()

			transaction.balance = data.balance
			transaction.validated = validated
			transaction.from = fromUser
			transaction.to = toUser
			transaction.for = data.for || ''

			await transactionRepository.insert().values([transaction]).execute()

			fromUser.outgoingTransactions.push(transaction)
			toUser.incomingTransactions.push(transaction)

			await manager.save(transaction)
			await manager.save(toUser)
			await manager.save(fromUser)

			axios.get(
				(process.env.WEBHOOK_URL as string) +
					`/api/${data.to}/payments/${transaction.id}`,
				{
					headers: {
						token: process.env.ADMIN,
					},
				}
			)

			return transaction
		})
	}

	@Authorized(['admin', 'authed'])
	@Mutation(() => Transaction, {
		description:
			'Validates some transaction and moves currency if transaction is valid.',
	})
	async pay(@Arg('id') id: string) {
		return getManager().transaction(async (manager) => {
			const transaction = await getRepository(Transaction)
				.createQueryBuilder('transaction')
				.useTransaction(true)
				.leftJoinAndSelect('transaction.from', 'from')
				.leftJoinAndSelect('transaction.to', 'to')
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

					axios.get(
						(process.env.WEBHOOK_URL as string) +
							`/api/${transaction.to.id}/payments/${transaction.id}`,
						{
							headers: {
								token: process.env.ADMIN,
							},
						}
					)
				}
			}

			return transaction
		})
	}
}
