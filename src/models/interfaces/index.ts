import Big from 'big.js'

export interface Webhook {
	id: string
	url: string
	user: User
	secretHash: string
	secret: string
}

export interface User {
	id: string
	balance: number
	outgoingTransactions: Transaction[]
	incomingTransactions: Transaction[]
	secretHash: string
	secret?: string

	paymentWebhooks: Webhook[]
	transactionWebhooks: Webhook[]
}

export interface Transaction {
	id: string
	balance: number
	from?: User
	to?: User
	validated: boolean
	for: string
}

export class ColumnNumericTransformer {
	to(data: Big): string {
		console.log(data)
		return new Big(data).toFixed(18)
	}
	from(data: string): Big {
		console.log(data)
		return new Big(data ?? 0)
	}
}
