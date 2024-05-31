"use client";

import { useState } from "react";
import { useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";
import { ClientMessage } from "@/actions";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  return (
    <div className="max-w-screen-md mx-auto flex flex-col bg-slate-800 text-slate-50 min-h-screen w-full p-4">
      <div className="space-y-4 flex-1">
        <div className={`flex-row flex items-end gap-x-4`}>
          <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
            <p className="font-semibold text-xl">AI</p>
          </div>

          <div className={`flex-1 flex justify-start`}>
            <div className="p-2 bg-slate-700 rounded-lg">
              Hello, I am your financial assistant. What would you like to do?
            </div>
          </div>
        </div>
        {conversation.map((message: ClientMessage) => {
          return (
            <div
              key={message.id}
              className={`${message.role !== "user" ? "flex-row" : "flex-row-reverse"} flex items-end gap-x-4`}
            >
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <p className="font-semibold text-xl">{message.role === "user" ? "U" : "AI"}</p>
              </div>

              <div className={`flex-1 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="p-2 bg-slate-700 rounded-lg">{message.display}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="mt-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setInput("");
          setConversation((currentConversation: ClientMessage[]) => [
            ...currentConversation,
            { id: nanoid(), role: "user", display: input },
          ]);

          const message = await continueConversation(input);

          setConversation((currentConversation: ClientMessage[]) => {
            console.log({ currentConversation });
            return [...currentConversation, message];
          });
        }}
      >
        <div className="flex items-end space-x-4">
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
            className="bg-slate-700 p-2 rounded-lg text-slate-50 w-full flex-1 "
          />
          <button className="p-2 bg-blue-500 rounded-lg">Send Message</button>
        </div>
      </form>
    </div>
  );
}
