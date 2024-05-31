"use client";

import React, { PropsWithChildren } from "react";
import { AI } from "./actions";

export default function Provider({ children }: PropsWithChildren) {
  return <AI>{children}</AI>;
}
