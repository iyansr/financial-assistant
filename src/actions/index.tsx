"use server";

import { createAI, createStreamableUI, getAIState, getMutableAIState, streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { ReactNode } from "react";
import { nanoid } from "nanoid";
import { Transaction, transactionSchema } from "@/schema/transaction";
import TransactionUI from "@/components/Transaction";

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ServerMessage {
  role: "user" | "assistant" | "system" | "function";
  name?: string;
  content: string;
  id: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant" | "system" | "function";
  display: ReactNode;
}

export async function updateTransaction({ id, amount, type, ...transaction }: Transaction & { id: string }) {
  "use server";

  const history = getMutableAIState();

  const systemMessage = createStreamableUI(null);

  await sleep(500);

  systemMessage.done(<TransactionUI transaction={{ ...transaction, amount, type, id }} />);

  history.done((messages: ServerMessage[]) => {
    console.log("UNFILTERED", messages);
    console.log(
      "FILTERED:",
      messages.filter((m) => m.id !== id)
    );
    return [
      ...messages.filter((m) => m.id !== id),
      {
        id: nanoid(),
        role: "function",
        name: "recordTransaction",
        content: JSON.stringify({
          ...transaction,
          amount,
          type,
        }),
      },
      {
        id: nanoid(),
        role: "system",
        content: `[User updated transaction ${transaction.description} with amount of ${amount}]`,
      },
    ];
  });

  return {
    newMessage: {
      id: nanoid(),
      role: "assistant",
      display: systemMessage.value,
    },
  };
}

export async function continueConversation(input: string): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  history.update((messages: ClientMessage[]) => [
    ...messages,
    { role: "user", content: input, id: nanoid(), name: "" },
  ]);

  const result = await streamUI({
    model: openai("gpt-4o"),
    messages: [
      ...history
        .get()
        .filter(({ role }: ServerMessage) => role !== "function")
        .map((message: ServerMessage) => ({
          role: message?.role ?? "",
          content: message.content ?? "",
          name: message.name ?? "",
        })),
    ],
    system: `\
    You are a financial advisor who can help user with financial planning, record transactions.
    You and the user can discuss about financial health and financial goals.

    Messages inside [] means that it's a UI element or a user event. For example:
    - "[User added transaction On 2023-10-05 with amount of 10 and category of Food & Beverage the type is outcome]" means that an interface of the ui of transaction log is shown to the user.
    - "[User has changed the amount of AAPL to 10]" means that the user has changed the amount of AAPL to 10 in the UI.

    If the user requests record transaction, call \`record_transaction\`. The date should be in the format of DD MMMM YYYY. Example: "10 November 2023".
    
    Besides that, you can also chat with users and do some calculations if needed.
    
    The current date of today is: ${new Date().toISOString().split("T")[0]}.`,
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [...messages, { role: "assistant", content }]);
      }

      return <div>{content}</div>;
    },
    tools: {
      recordTransaction: {
        description: "Record User Transaction",
        parameters: transactionSchema,
        generate: async function* ({ amount, category, date, type, description }) {
          yield <div>loading...</div>;

          const txId = nanoid();

          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              id: nanoid(),
              role: "system",
              content: `[User added transaction On ${date} with amount of ${amount} and category of ${category} the type is ${type}]`,
            },
            {
              id: txId,
              role: "function",
              name: "recordTransaction",
              content: JSON.stringify({
                amount,
                category,
                description,
                date,
                type,
              }),
            },
          ]);

          return <TransactionUI transaction={{ amount, category, description, date, type, id: txId }} />;
        },
      },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
    updateTransaction,
  },
  initialAIState: [],
  initialUIState: [],
  onSetAIState: ({ state }) => {
    console.log({ state });
  },
  onGetUIState: async () => {
    "use server";

    const history: ServerMessage[] = getAIState();

    if (history) {
      return history
        .filter(({ role }) => role !== "system")
        .map(({ role, content, name, id }) => ({
          id: nanoid(),
          role,
          display:
            role === "function" ? (
              name === "recordTransaction" ? (
                <TransactionUI transaction={{ ...JSON.parse(content), id }} />
              ) : null
            ) : (
              content
            ),
        }));
    }

    return;
  },
});
