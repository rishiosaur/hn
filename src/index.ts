import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './resolvers/'
import { TransactionResolver } from './resolvers/'
import { authChecker } from './auth/index'
import { UserFieldResolver } from './models/User'

async function main() {
	await createConnection()

	const schema = await buildSchema({
		resolvers: [UserResolver, TransactionResolver, UserFieldResolver],
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
