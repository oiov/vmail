import { Outlet } from "@remix-run/react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Notifications from "~/components/Notification";

export default function HomeLayout() {
  return (
    <div className="mx-auto min-h-screen flex flex-col bg-[#1f2023]">
      <Header />
      {/* <Notifications /> */}
      <Outlet />
      <Footer />
    </div>
  );
}
