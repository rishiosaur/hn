import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './resolvers/'
import { TransactionResolver } from './resolvers/'
import { authChecker } from './auth/index'
import User, { UserFieldResolver } from './models/User'
import { WebhookResolver } from './resolvers/'
import { PaymentWebhook, TransactionWebhook } from './models/Webhook'
import Transaction from './models/Transaction'

async function main() {
	await createConnection({
		entities: [User, TransactionWebhook, PaymentWebhook, Transaction],
		url: process.env.TYPEORM_URL,
		synchronize: true,
		// connection: 'postgres',
		type: 'postgres',
	})

	const schema = await buildSchema({
		resolvers: [
			UserResolver,
			TransactionResolver,
			UserFieldResolver,
			WebhookResolver,
		],
		authChecker: authChecker,
		validate: false,
	})

	const server = new ApolloServer({
		schema,
		introspection: true,
		playground: true,
		context: ({ req }) => {
			const context = req
			return context
		},
	})
	await server.listen(process.env.PORT || 3000)
	console.log('💸 Currency server has started!')
}

main()
