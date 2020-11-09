import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './resolvers/UserResolver'
import { TransactionResolver } from './resolvers/TransactionResolver'

async function main() {
	await createConnection()
	const schema = await buildSchema({
		resolvers: [UserResolver, TransactionResolver],
	})
	const server = new ApolloServer({ schema })
	await server.listen(process.env.PORT || 3000)
	console.log('Server has started!')
}

main()
