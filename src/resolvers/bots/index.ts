import {
	Field,
	InputType,
	Mutation,
	Query,
	Arg,
	Authorized,
} from 'type-graphql'
import Bot from '../../models/Bot'
import { makeString, hashCode } from '../../util/index'

@InputType()
class CreateBotInput {
	@Field({
		description: 'Maker of the bot',
	})
	maker: string

	@Field({
		description: 'Slack ID of the bot',
	})
	slackID: string
}

export default class BotResolver {
	@Authorized('admin')
	@Query(() => [Bot], {
		description: 'Gets all the bots',
	})
	async bots() {
		return await Bot.find()
	}

	@Authorized('admin')
	@Mutation(() => Bot)
	async createBot(@Arg('data') data: CreateBotInput) {
		const bot = Bot.create(data)
		const password = makeString(15)

		const hash = hashCode(password).toString()

		console.log(hash)
		console.log(password)

		bot.password = password
		bot.passwordHash = hash

		await bot.save()

		return bot
	}
}
