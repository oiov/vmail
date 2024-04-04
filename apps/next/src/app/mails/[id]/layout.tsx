import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

export default function MailViewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="p-4 h-dvh flex flex-col gap-2 max-w-4xl mx-auto">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
