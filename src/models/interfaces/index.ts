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
