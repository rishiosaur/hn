import { InputType, Field } from 'type-graphql'

@InputType()
export class SortInput {
	@Field({
		nullable: true,
	})
	order?: 'ASC' | 'DESC'

	@Field()
	field: string
}

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

	@Field({
		description: 'Sort by a given field.',
		nullable: true,
	})
	sort?: SortInput
}
