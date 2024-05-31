"use client";

import { ClientMessage } from "@/actions";
import { type Transaction } from "@/schema/transaction";
import { useActions, useUIState } from "ai/rsc";
import React, { PropsWithChildren } from "react";

type Props = {
  transaction: Transaction & { id: string };
  updated?: boolean;
};

export default function TransactionUI({ transaction, updated }: PropsWithChildren<Props>) {
  const { date, description, category, type, amount, id } = transaction;

  const [isEditMode, setIsEditMode] = React.useState(false);
  const { updateTransaction } = useActions();
  const [, setMessages] = useUIState();
  const [newAmount, setNewAmount] = React.useState(amount);
  const [isUpdated, setIsUpdated] = React.useState(false);

  const toggleEditMode = () => {
    setIsEditMode((current) => !current);
  };

  return (
    <>
      <p>
        Your transaction has been {updated ? "updated" : "recorded"}, {"here's"} the detail
      </p>
      <div className="bg-slate-900 p-3 rounded-lg mt-4">
        <p className="text-xs">{date}</p>
        <div className="flex justify-between items-center mt-2">
          <div>
            <p>{description}</p>
            <p className="text-xs text-slate-200">{category}</p>
          </div>
          <div>
            <p className={`text-lg ${type === "outcome" ? "text-red-500" : "text-green-500"}`}>
              {type === "outcome" ? "-" : ""}${amount}
            </p>
          </div>
        </div>
      </div>
      {!isEditMode && !isUpdated && (
        <div className="flex justify-end">
          <button onClick={toggleEditMode} className="p-2 bg-blue-500 rounded-lg text-xs mt-4 ml-auto">
            Update
          </button>
        </div>
      )}

      {isEditMode && (
        <div className="mt-4 space-y-2">
          <input
            onChange={(e) => {
              setNewAmount(e.target.value);
            }}
            value={newAmount}
            className="bg-slate-800 p-2 rounded-lg text-slate-50 w-full"
          />
          <button
            onClick={async () => {
              toggleEditMode();
              const result = await updateTransaction({ ...transaction, amount: newAmount });
              setMessages((current: any) => [...current.filter((m: any) => m.id !== id), result.newMessage]);
              setIsEditMode(false);
              setIsUpdated(true);
            }}
            className="p-2 bg-blue-500 rounded-lg text-xs mt-4 ml-auto"
          >
            Confirm
          </button>
        </div>
      )}
    </>
  );
}
