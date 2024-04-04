"use client";

import { formatDistanceToNow } from "date-fns";
import { Email } from "database/schema";
import { MailIcon, InboxIcon, RefreshIcon } from "icons";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Link from "next/link";

const queryClient = new QueryClient();

export function MailItem({ mail: item }: { mail: Email }) {
  return (
    <Link
      href={`/mails/${item.id}`}
      key={item.id}
      className={
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-zinc-100"
      }
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{item.from.name}</div>
          </div>
          <div className={"ml-auto text-xs"}>
            {formatDistanceToNow(new Date(item.date || item.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>
        <div className="text-xs font-medium">{item.subject}</div>
      </div>
      <div className="line-clamp-2 text-xs text-zinc-600 font-normal">
        {item.text || item.html || "".substring(0, 300)}
      </div>
    </Link>
  );
}

async function fetchMails() {
  try {
    const resp = await fetch("http://localhost:3000/api/mails");
    return await resp.json();
  } catch (e) {
    return [];
  }
}

export function MailList(props: { mails: Email[] }) {
  const { data, isFetching } = useQuery({
    queryKey: ["mails"],
    queryFn: fetchMails,
    initialData: props.mails,
    refetchInterval: 10000,
  });

  return (
    <>
      <div className="border rounded-md p-2 flex items-center bg-zinc-800 text-zinc-200 gap-2">
        <MailIcon />
        mails
        <button
          className="rounded ml-auto p-1"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["mails"],
            })
          }
        >
          <RefreshIcon className={`${isFetching && "animate-spin"}`} />
        </button>
      </div>
      <div className="flex flex-col flex-1 min-h-0 border overflow-y-auto rounded-md p-2">
        {data.length === 0 && (
          <div className="w-full items-center h-full flex-col justify-center flex">
            <InboxIcon className="size-20 opacity-75" />
            <p className="text-zinc-600">No mails found</p>
          </div>
        )}
        {data.map((mail: Email) => (
          <MailItem mail={mail} key={mail.id} />
        ))}
      </div>
    </>
  );
}

export default function MailListWithQuery({ mails }: { mails: Email[] }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MailList mails={mails} />
    </QueryClientProvider>
  );
}
