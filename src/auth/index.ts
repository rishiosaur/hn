import { AuthChecker } from 'type-graphql'
import { hashCode } from '../util/index'
import User from '../models/User'
import Transaction from '../models/Transaction'

export const authChecker: AuthChecker<any> = async (e: any, a: any) => {
	let authed = false

	const {
		context: { headers },
		info: { fieldName, fieldNodes },
	} = e

	if (a.includes('admin') && headers.admin) {
		authed = headers.admin === process.env.ADMIN
	} else if (
		a.includes('authed') &&
		['send'].includes(fieldName) &&
		headers.secret
	) {
		const fromID =
			fieldNodes[0].arguments[0].value.fields.filter(
				(x: any) => x.name.value === 'from'
			)[0].value.value ||
			e.info.variableValues[
				fieldNodes[0].arguments[0].value.fields.filter(
					(x: any) => x.name.value === 'from'
				)[0].value.name.value
			]

		const from = await User.findOneOrFail(fromID)

		authed = from.secretHash === hashCode(headers.secret).toString()
	} else if (
		a.includes('authed') &&
		['pay'].includes(fieldName) &&
		headers.secret
	) {
		const transactionID =
			fieldNodes[0].arguments[0].value.value ||
			e.info.variableValues[fieldNodes[0].arguments[0].value.name.value]

		const transaction = await Transaction.findOneOrFail(transactionID, {
			relations: ['from', 'to'],
		})

		const fromID = transaction.from

		const from = await User.findOneOrFail(fromID)

		authed = from.secretHash === hashCode(headers.secret).toString()
	} else if (
		a.includes('authed') &&
		['createWebhook'].includes(fieldName) &&
		headers.secret
	) {
		const fromID =
			fieldNodes[0].arguments[0].value.fields.filter(
				(x: any) => x.name.value === 'for'
			)[0].value.value ||
			e.info.variableValues[
				fieldNodes[0].arguments[0].value.fields.filter(
					(x: any) => x.name.value === 'for'
				)[0].value.name.value
			]

		const from = await User.findOneOrFail(fromID)

		authed = from.secretHash === hashCode(headers.secret).toString()
	}

	return authed // or false if access is denied
}
