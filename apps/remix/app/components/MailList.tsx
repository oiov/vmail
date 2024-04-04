import { Link } from "@remix-run/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Email } from "database";
import { formatDistanceToNow } from "date-fns";
import { MailIcon } from "icons";
import Refresh from "./icons/Refresh";
import Lock from "./icons/Lock";
import Loader from "./icons/Loader";

import { useTranslation } from "react-i18next";

const queryClient = new QueryClient();

export function MailItem({ mail: item }: { mail: Email }) {
  return (
    <Link
      to={`/mails/${item.id}`}
      key={item.id}
      className={
        "flex flex-col items-start text-white gap-2 mb-1 rounded-lg border border-zinc-600 p-3 text-left text-sm transition-all hover:bg-zinc-700"
      }>
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
      <div className="line-clamp-2 text-xs text-zinc-300 font-normal w-full">
        {item.text || item.html || "".substring(0, 300)}
      </div>
    </Link>
  );
}

async function fetchMails() {
  try {
    const resp = await fetch("/api/mails");
    return await resp.json();
  } catch (e) {
    return [];
  }
}

export function MailList(props: { mails: Email[] }) {
  const { t } = useTranslation();

  const { data, isFetching } = useQuery({
    queryKey: ["mails"],
    queryFn: fetchMails,
    initialData: props.mails,
    refetchInterval: 10000,
  });

  return (
    <>
      <div className="rounded-md border border-cyan-50/20">
        <div className="w-full rounded-t-md p-2 flex items-center bg-zinc-800 text-zinc-200 gap-2">
          <MailIcon className="size-6" />
          <div className="flex items-center font-bold text-lg font-mono">
            {t("INBOX")}
            <span className="ml-1 text-base">
              {data.length > 0 && <span>({data.length})</span>}
            </span>
          </div>
          <button
            className="rounded ml-auto p-1"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["mails"],
              })
            }>
            {data.length === 0 && <Lock className="size-6 " />}
            {data.length > 0 && <Refresh className={`size-6 animate-spin`} />}
          </button>
        </div>

        <div className="grids flex flex-col flex-1 h-[418px] overflow-y-auto p-2">
          {data.length === 0 && (
            <div className="w-full items-center h-[418px] flex-col justify-center flex">
              <Loader />
              <p className="text-zinc-400 mt-6">{t("Waiting for emails...")}</p>
            </div>
          )}

          {data.map((mail: Email) => (
            <MailItem mail={mail} key={mail.id} />
          ))}
        </div>
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

// mock data
// [
//   {
//     id: "aeCTc74ipMGDdbMHTlDiX",
//     message_from: "3224266014@qq.com",
//     message_to: "awesome.sammet@vmail.dev",
//     headers:
//       '[{"key":"received","value":"from out203-205-251-53.mail.qq.com (203.205.251.53) by email.cloudflare.net (unknown) id D5nXkWMHMsFK for <awesome.sammet@vmail.dev>; Fri, 15 Mar 2024 02:34:36 +0000"},{"key":"received-spf","value":"pass (mx.cloudflare.net: domain of 3224266014@qq.com designates 203.205.251.53 as permitted sender) receiver=mx.cloudflare.net; client-ip=203.205.251.53; envelope-from=\\"3224266014@qq.com\\"; helo=out203-205-251-53.mail.qq.com;"},{"key":"authentication-results","value":"mx.cloudflare.net; dkim=pass header.d=qq.com header.s=s201512 header.b=U858z6ui; dmarc=pass header.from=qq.com policy.dmarc=quarantine; spf=none (mx.cloudflare.net: no SPF records found for postmaster@out203-205-251-53.mail.qq.com) smtp.helo=out203-205-251-53.mail.qq.com; spf=pass (mx.cloudflare.net: domain of 3224266014@qq.com designates 203.205.251.53 as permitted sender) smtp.mailfrom=3224266014@qq.com; arc=none smtp.remote-ip=203.205.251.53"},{"key":"arc-seal","value":"i=1; a=rsa-sha256; s=2023; d=email.cloudflare.net; cv=none; b=R8Q2PYy/wGmJunygmKExIytwvxwaH0LjlsU08iATh91KQ5WN1sYZGPvdAwmOsas/I4tyqg/VD vhaK30uFxHB5QyRc8/NK11DMjRExIrRSnJ68pGCXdFPliCtRMc0M0znPa1kZymrxDkjIdmBG5g0 HNuGbw5gDAc+GA5R8ROU6bMHVAMmEM/rkOBKbpJP3VwqsCUmIRODUnLD8wzJC7hRWzF3Rp2cASQ dygnp+imVhcVZrOgj17Y25UnpYnN7/1Wvv+Ulo3pLNlH2L6BSiAeLn46ITEJtOZj18LSSjqr8CD AdE0ZytXUSdvASOpOYQvVm9BXpetcLAT20ftE2/EcmLg==;"},{"key":"arc-message-signature","value":"i=1; a=rsa-sha256; s=2023; d=email.cloudflare.net; c=relaxed/relaxed; h=Date:Subject:To:From:reply-to:cc:resent-date:resent-from:resent-to :resent-cc:in-reply-to:references:list-id:list-help:list-unsubscribe :list-subscribe:list-post:list-owner:list-archive; t=1710470077; x=1711074877; bh=px4SUpQyLBVnyjE57Mp5QXjrTqPzLkIoPFkbg66xYyw=; b=cDi5nuh8qe T7vow5BqJYAWeluGIJdsiMJkjf3pktJRbL6hCPUXh4AEW5wMMhVHBKn4vuLqRs1htEvw2he5jxD FlzTzF9o/u4vH24xzK4jhK6CWYibNEnyYGWF4Ad/qFDMXR+bsJJVAvz+yzKKt2yzthi4BPOt2Nt rFlzsKJJRkYthD/r542rT2yPM1+cuCw5/No7l97UMgtoRJ2FMeHdP4g7iyS8SUZ0CAvNpo5RQNV PwsqfwiBYDSVLfPuYeZxrVMxiTiKg8bAoCF75WpMLKH08WnXNlG1W6P9/mJPwpzFUaMqc1kPHbg xuzxthZlz6YVLNDtb2s+ghqsrS1Y02lw==;"},{"key":"arc-authentication-results","value":"i=1; mx.cloudflare.net; dkim=pass header.d=qq.com header.s=s201512 header.b=U858z6ui; dmarc=pass header.from=qq.com policy.dmarc=quarantine; spf=none (mx.cloudflare.net: no SPF records found for postmaster@out203-205-251-53.mail.qq.com) smtp.helo=out203-205-251-53.mail.qq.com; spf=pass (mx.cloudflare.net: domain of 3224266014@qq.com designates 203.205.251.53 as permitted sender) smtp.mailfrom=3224266014@qq.com; arc=none smtp.remote-ip=203.205.251.53"},{"key":"dkim-signature","value":"v=1; a=rsa-sha256; s=2023; d=email.cloudflare.net; c=relaxed/relaxed; h=Date:Subject:To:From:reply-to:cc:resent-date:resent-from:resent-to :resent-cc:in-reply-to:references:list-id:list-help:list-unsubscribe :list-subscribe:list-post:list-owner:list-archive; t=1710470077; x=1711074877; bh=px4SUpQyLBVnyjE57Mp5QXjrTqPzLkIoPFkbg66xYyw=; b=ftyaJR/xbe oa5ie/A2L3JGWQxFD+joaGpsOOfuj8RpfQTXLyUnAXFITnjSmdFq0gEzhC0CKXNhmUwxwjldPYC MPouDS0U52ETFszQB0UmVf3+vcabkM0e72qI2A/tKEY4Y9UBOUJ4eXUirPX4LnXviS08VDRVJjr le/byEUp+/MiGJEEvMYfEWz5iJbJ59ORVQy38mWDqeuLRu4T8XN1m0nUcoq5NZskahlchzEld6v xitMQhDv6jFGIWgD2juLM5rS2DUK3Qfv6zvH01KQ1SaPM6zRy9iK/THMbkI/5e/qXE0fxH1Wngx 2rrjKeaenQpOSyP6CUmKQGtrZJtMqBxQ==;"},{"key":"dkim-signature","value":"v=1; a=rsa-sha256; c=relaxed/relaxed; d=qq.com; s=s201512; t=1710470076; bh=px4SUpQyLBVnyjE57Mp5QXjrTqPzLkIoPFkbg66xYyw=; h=From:To:Subject:Date; b=U858z6uiN4zyrFAkDg7x8cj04dpyFmrrpcU7eE3G89VsuImeY0hAHWcVYKXzzrPzZ 5S63C5xBuRIPiGH8p91ANHWrHY52K8LZlQsLegaIoFB6uiZoB0SsDa6qFuf0v9UDGo G5Xmpvy/CA/5QeumNLawtwwCEo2SVq+vicS8f4L8="},{"key":"x-qq-xmrinfo","value":"NS+P29fieYNw95Bth2bWPxk="},{"key":"x-qq-xmailinfo","value":"M64zl37VfDx/BgF7AXnfEfhMLVMfkIa4nyoOKyVB7rDonF5OKLNY7MsjcQ2XkH y3ufd0dAcrYd91XCkF4KQdWkYv2rTklLPDRGaEHlcbRrHKkCGaSpvk7Xpx7vMzG/J0TgVTmeVJt3T InzZf5QzUYwNdl8ONy5cUz840O6wcmdbOTau7HgOm2y9y+YInk5Clxv3LW/t2faectEXDXTvZSUdh XLwNCVBXzCt+zUOPo/iORwbcaaGsm6eG6QWGwKTsaRN0WHDkuwxXsaentKrDdDXPa5gySPaN5waGf IyoC+btSnjKdIJSQTaZUN7CYoNpNxEKcyin58m9fDfKmWYZWvy5VhY05CdhJgF4PEm2qFSbN/Jf0s LRYWUgzCrWInfUd+5O9u30Kn48iLIW0y2Ex8H5hoIMX2R2bJaPKFWJIXo3jUT/1ZpHXZIPqYRnen7 0XpmeLXYfkAyd8wsFajAiScEvUHIdNUnuSmnS1m9xTyszjf3p0a1BRgy8eeXJqeW2MGGTo+cWZQ/9 WR9VJQZAHs6pHWNk157Ka4gxEemi60YvbEQvS7zBk0IP7q2Ryavls4KHvbn5aFTU5QdOoMk8d+n/7 My7Q0k4g13BINACn1tMzdUsbELDAqjxSnsimaeq2oG9vrzO6XQhxPc0n7eVQ5/F7PZn/0xVi9cUDY swntU3ZXBLF7l98eMsodPPjeD+nv2ZEw0q4pHxRW254WlakZF64ERe/LFZvpEGJNcQG2do6vqeEIj NCWhddxb8+SMTlJnhXSdAkjWurUSLKu/TnOhyqh5FJguLVK2NOzq5Im+zBm9QMYD4PbSbexMrUN4T Q7MxUJs3jbrAUbg/TWd9iy0jGaAz5ZfPC21PMaDCa612uA1RENFMDJTU1Mu+XSazinl+n1C7lhF/e 6C85lgJ5B5VyICEs3UO3GHwKTeNvosMoWe3CJaoKIOImwi4iY5LxbMHiIqayyD/K5OovGEjuZ7Mez ucLVx1pw=="},{"key":"from","value":"\\"=?utf-8?B?5piO5pyI5riF6aOO?=\\" <3224266014@qq.com>"},{"key":"to","value":"\\"=?utf-8?B?YXdlc29tZS5zYW1tZXQ=?=\\" <awesome.sammet@vmail.dev>"},{"key":"subject","value":"wqrfq"},{"key":"mime-version","value":"1.0"},{"key":"content-type","value":"multipart/alternative; boundary=\\"----=_NextPart_65F3B3BB_3C6FF320_76716BB8\\""},{"key":"content-transfer-encoding","value":"8Bit"},{"key":"date","value":"Fri, 15 Mar 2024 10:34:35 +0800"},{"key":"x-priority","value":"3"},{"key":"message-id","value":"<tencent_B12A799058C7084B70BBDD68D9ECFEDC290A@qq.com>"},{"key":"x-qq-mime","value":"TCMime 1.0 by Tencent"},{"key":"x-mailer","value":"QQMail 2.x"},{"key":"x-qq-mailer","value":"QQMail 2.x"},{"key":"x-qq-mid","value":"xmsesza5-0t1710470075tr01aemyf"}]',
//     from: { address: "xxxxxx@qq.com", name: "inke" },
//     sender: null,
//     reply_to: null,
//     delivered_to: null,
//     return_path: null,
//     to: '[{"address":"awesome.sammet@vmail.dev","name":"awesome.sammet"}]',
//     subject: "wqrfq",
//     message_id:
//       "<tencent_B12A799058C7084B70BBDD68D9ECFEDC290A@qq.com>",
//     in_reply_to: null,
//     references: null,
//     date: "2024-03-15T02:34:35.000Z",
//     html: '<div class="qmbox"><p style="font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, &quot;Microsoft YaHei&quot;, sans-serif; font-size: 10.5pt; color: rgb(46, 48, 51);">哈哈哈</p><p style="font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, &quot;Microsoft YaHei&quot;, sans-serif; font-size: 10.5pt; color: rgb(46, 48, 51);"><br  /></p></div>',
//     text: "info info",
//     created_at: 1710470077,
//     updated_at: 1710470077,
//     cc: null,
//     bcc: null,
//   },
// ]
