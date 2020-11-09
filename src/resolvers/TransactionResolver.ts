import { Resolver, Query, Field, InputType, Mutation, Arg } from "type-graphql";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";

@InputType()
export class CreateTransaction {
  @Field()
  from: string;

  @Field()
  to: string;

  @Field()
  amount: number = 0;
  
}

@Resolver()
export class TransactionResolver {
  @Query(() => [Transaction])
  async transactions() {
    return await Transaction.find({
        relations: ["from", "to"]
    });
  }

  @Query(() => Transaction)
  async transaction(@Arg("id") id: string) {
      return await Transaction.findOneOrFail(id, {
        relations: ["from", "to"]
    })
  }

  @Mutation(() => Transaction)
  async transact(@Arg("data") data: CreateTransaction) {
    const transaction = new Transaction();

    transaction.balance=data.amount;
    transaction.validated=false

    const fromUser = await User.findOneOrFail(data.from, {
        relations: ["outgoingTransactions", "incomingTransactions"]
    })
    const toUser = await User.findOneOrFail(data.to, {
        relations: ["outgoingTransactions", "incomingTransactions"]
    })
    transaction.from = fromUser
    transaction.to = toUser

    await transaction.save();

    fromUser.outgoingTransactions.push(transaction)
    toUser.incomingTransactions.push(transaction)
    return transaction;
  }

  @Mutation(() => Transaction)
  async pay(@Arg("id") id: string) {
    const transaction = await Transaction.findOneOrFail(id, {
        relations: ["from", "to"]
    })

    if(!transaction.validated) {
        if(transaction.from.balance > transaction.balance) {
            transaction.from.balance -= transaction.balance
            transaction.to.balance += transaction.balance
            await transaction.from.save()
            await transaction.to.save()

            transaction.validated = true;

            await transaction.save()
        }
    }

    return transaction;
  }
}
