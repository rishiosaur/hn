import { AuthChecker } from 'type-graphql'
import Bot from '../models/Bot'
import { hashCode } from '../util/index'

export const customAuthChecker: AuthChecker<any> = async (e: any, a: any) => {
	// here we can read the user from context
	// and check his permission in the db against the `roles` argument
	// that comes from the `@Authorized` decorator, eg. ["ADMIN", "MODERATOR"]

	let authed = false

	const {
		context: { headers },
	} = e

	if (a.includes('admin')) {
		if (headers.admin) {
			authed = headers.admin === process.env.ADMIN
		}
	} else if (a.includes('bot')) {
		if (headers.botid) {
			console.log(headers.botid)
			if (headers.botsecret) {
				const bot = await Bot.findOneOrFail(headers.botid)
				console.log(bot)
				if (bot) {
					authed =
						bot.passwordHash === (await hashCode(headers.botsecret).toString())
				}
			}
		}
	}

	return authed // or false if access is denied
}
