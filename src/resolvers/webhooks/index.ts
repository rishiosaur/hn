import {
	Authorized,
	Mutation,
	Resolver,
	InputType,
	Field,
	Arg,
} from 'type-graphql'
import User from '../../models/User'
import { getRepository, getManager } from 'typeorm'
import { TransactionWebhook, PaymentWebhook } from '../../models/Webhook'
import { allUserRelations } from '../users/index'

@InputType()
export class CreateWebhook {
	@Field({
		description:
			'ID of the user whose account this new webhook will be added to.',
	})
	for: string

	@Field({
		description: 'URL that will be fired ',
	})
	url: string

	@Field({
		description: 'Event that will trigger this webhook.',
	})
	on: string
}

@Resolver()
export default class WebhookResolver {
	@Authorized(['admin', 'authed'])
	@Mutation(() => User, {
		description: 'Add a webhook event to fire on an event for a user.',
	})
	async createWebhook(@Arg('options') options: CreateWebhook) {
		if (options.on == 'payment' || options.on == 'transaction') {
			return getManager().transaction(async (manager) => {
				const user = (await getRepository(User)
					.createQueryBuilder('user')
					.where('user.id = :id', { id: options.for })
					.useTransaction(true)
					.leftJoinAndSelect('user.paymentWebhooks', 'paymentWebhooks')
					.leftJoinAndSelect('user.transactionWebhooks', 'transactionWebhooks')
					.where('user.id = :id', { id: options.for })
					.getOneOrFail()) as User

				if (options.on == 'payment') {
					const transactionWebhook = new PaymentWebhook()

					transactionWebhook.url = options.url

					user.paymentWebhooks.push(transactionWebhook)
					transactionWebhook.user = user

					await manager.save(transactionWebhook)
					await manager.save(user)
				} else if (options.on === 'transaction') {
					const transactionWebhook = new TransactionWebhook()

					transactionWebhook.url = options.url

					user.transactionWebhooks.push(transactionWebhook)
					transactionWebhook.user = user

					await manager.save(transactionWebhook)
					await manager.save(user)
				}

				return await User.findOneOrFail(options.for, {
					relations: allUserRelations,
				})
			})
		} else {
			throw new Error(
				"The only possible events compatible with webhooks are 'payment' and 'transaction'. Please try again."
			)
		}
	}
}
