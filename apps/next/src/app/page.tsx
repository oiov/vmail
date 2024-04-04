import { fetchEmails, getMailbox } from "@/app/api/mails/route";
import CopyButton from "@/components/CopyButton";
import FetchMailboxFormWithCaptcha from "@/components/FetchMailboxForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MailListWithQuery from "@/components/MailList";

const turnstileKey = process.env.TURNSTILE_KEY || "1x00000000000000000000AA";

export default async function Home() {
  const mailbox = await getMailbox();
  const mails = await fetchEmails(mailbox);

  return (
    <div className="p-2 h-dvh flex flex-col gap-4 max-w-4xl mx-auto">
      <Header />
      <div className="flex flex-col font-semibold pt-4 items-center max-w-xl w-full mx-auto gap-4 p-4 border-2 border-dashed">
        <h1 className="text-xl">
          Your<span className="text-blue-500 mx-1">Temporary</span>
          Email Address
        </h1>
        {mailbox ? (
          <MailboxWithCopyButton mailbox={mailbox} />
        ) : (
          <FetchMailboxFormWithCaptcha siteKey={turnstileKey} />
        )}
      </div>
      <h2 className="text-zinc-600 p-2 font-semibold text-sm">
        Forget about spam, advertising mailings, hacking and attacking robots.
        Keep your real mailbox clean and secure. Temp Mail provides temporary,
        secure, anonymous, free, disposable email address.
      </h2>
      <MailListWithQuery mails={mails} />
      <Footer />
    </div>
  );
}

export function MailboxWithCopyButton({ mailbox }: { mailbox: string }) {
  return (
    <div className="flex items-center bg-zinc-100 p-2 px-4 rounded-md w-full">
      <span>{mailbox}</span>
      <CopyButton content={mailbox} className="p-1 rounded-md border ml-auto" />
    </div>
  );
}
