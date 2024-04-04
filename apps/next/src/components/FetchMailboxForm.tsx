"use client";

import { fetchMailbox } from "@/app/api/mailbox/route";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

export default function FetchMailboxFormWithCaptcha({
  siteKey,
}: {
  siteKey: string;
}) {
  const [disabled, setDisabled] = useState(true);
  return (
    <form action={fetchMailbox} className="flex flex-col gap-2">
      <Turnstile
        siteKey={siteKey}
        options={{
          theme: "light",
        }}
        onSuccess={() => setDisabled(false)}
      />
      <button
        type="submit"
        disabled={disabled}
        className="p-4  rounded-md w-full bg-blue-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500"
      >
        Get a new email
      </button>
    </form>
  );
}
