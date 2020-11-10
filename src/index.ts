import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { UserResolver } from './resolvers/'
import { TransactionResolver } from './resolvers/'
import { customAuthChecker } from './auth/index'
import { BotResolver } from './resolvers/'

async function main() {
	await createConnection()
	Object.defineProperty(String.prototype, 'hashCode', {
		value: function () {
			let hash = 0,
				i,
				chr
			for (i = 0; i < this.length; i++) {
				chr = this.charCodeAt(i)
				hash = (hash << 5) - hash + chr
				hash |= 0 // Convert to 32bit integer
			}
			return hash
		},
	})

	const schema = await buildSchema({
		resolvers: [UserResolver, TransactionResolver, BotResolver],
		authChecker: customAuthChecker,
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
