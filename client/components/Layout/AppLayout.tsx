// client/components/Layout/AppLayout.tsx
"use client";

import { useRouter } from "next/router";
import Navbar from "@/components/Navbar/Navbar";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const router = useRouter();
  const noNavbarRoutes = ["/auth/login", "/auth/forgot"];
  const shouldShowNavbar = !noNavbarRoutes.includes(router.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main>{children}</main>
    </>
  );
};

export default AppLayout;
