/* Shared storefront frame for guests and customers. */
import { Outlet } from "react-router-dom";
import StorefrontFooter from "../components/navigation/StorefrontFooter";
import StorefrontHeader from "../components/navigation/StorefrontHeader";

export default function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] text-[#191c1b] selection:bg-[#91f78e] selection:text-[#00450d]">
      <StorefrontHeader />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
}
