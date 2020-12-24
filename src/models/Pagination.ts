import { InputType, Field } from 'type-graphql'

@InputType()
export class PaginationInput {
	@Field({
		description: 'Amount of entries per page.',
		nullable: true,
	})
	take?: number

	@Field({
		description: 'Initial offset of page.',
		nullable: true,
	})
	skip?: number

	@Field({
		description: 'Page number.',
		nullable: true,
	})
	page?: number
}
