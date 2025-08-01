/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; // Only if using app router

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import styles from "./breadcrumbs.module.css";

const Breadcrumbs: React.FC = () => {
  const pathname = usePathname(); // Next.js hook for current path
  const pathnames = pathname.split("/").filter((x) => x);

  const user = useSelector((state: any) => state.user.user);
  const role = user?.User?.role;

  return (
    <div className={styles.breadcrumb}>
      {/* Show Dashboard link only for admin */}
      {role === "admin" && (
        <Link href="/dashboard" className={styles.link}>
          Dashboard
        </Link>
      )}

      {pathnames.map((name, index) => {
        const routeTo = "/" + pathnames.slice(0, index + 1).join("/");
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);

        if (index < 1) {
          return (
            <Link key={routeTo} href={routeTo} className={styles.link}>
              {role === "admin" ? " / " : ""}
              {displayName}
            </Link>
          );
        } else {
          return <span key={routeTo}> / {displayName}</span>;
        }
      })}
    </div>
  );
};

export default Breadcrumbs;
