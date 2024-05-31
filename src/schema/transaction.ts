import { DeepPartial } from "ai";
import { z } from "zod";

export const transactionSchema = z.object({
  amount: z.string().describe("The amount of the transaction."),
  category: z.string().describe("The category of the transaction."),
  description: z.string().describe("The short description of the transaction, such as: 'A cup of coffee'."),
  date: z.string().describe("The date of the transaction."),
  type: z.enum(["income", "outcome"]).describe("The type of the transaction."),
});

export type Transaction = DeepPartial<typeof transactionSchema>;
