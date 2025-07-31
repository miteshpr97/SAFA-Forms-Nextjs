// /* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { Icon } from "@iconify/react";

import { AppDispatch, RootState } from "@/store";
import { fetchUser } from "@/features/userSlice";

import styles from "./Navbar.module.scss";

const Navbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const user = useSelector((state: RootState) => state.user.user);
  const role = user?.role || "";

  const allLinks = [
    {
      name: "Dashboard",
      to: "/dashboard",
      roles: ["admin"],
      icon: "mdi:view-dashboard-outline",
    },
    {
      name: "Project",
      to: "/project",
      roles: ["admin"],
      icon: "mdi:folder-outline",
    },
    {
      name: "Manage",
      to: "/manage-forms",
      roles: ["admin"],
      icon: "mdi:cog-outline",
    },
    {
      name: "Response",
      to: "/response",
      roles: ["admin", "user"],
      icon: "mdi:chart-bar",
    },
  ];

  const filteredLinks = allLinks.filter((link) => link.roles.includes(role));
  const isActive = (path: string) => router.pathname.startsWith(path);

  useEffect(() => {
    if (!user) {
      dispatch(fetchUser());
    }
  }, [user, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        mobileMenuRef.current &&
        !(mobileMenuRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/user/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("user");
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav className={`${styles.navbar} navbar-expand-lg navbar-light`}>
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/Safa Forms logo-1-Fit.png"
            alt="Logo"
            width={120}
            height={40}
            className={styles.logo}
          />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex items-center gap-6 text-sm">
            {filteredLinks.map((link) => (
              <Link
                key={link.name}
                href={link.to}
                className={`flex items-center gap-2 no-underline hover:text-blue-600 ${
                  isActive(link.to)
                    ? "text-[#007a7a] font-semibold"
                    : "text-gray-700"
                }`}
              >
                <Icon icon={link.icon} className="text-lg" /> {link.name}
              </Link>
            ))}
          </div>
        )}

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="text-xs cursor-pointer rounded-full bg-blue-500 text-white w-7 h-7 flex items-center justify-center"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user.full_name?.charAt(0).toUpperCase()}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50">
                <div className="px-4 py-3 border-b flex items-center gap-3">
                  <p className="font-semibold text-sm text-black">
                    {user.full_name}
                  </p>
                </div>
                <ul className="text-sm py-2">
                  <li
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 border-t mt-1 text-black"
                    onClick={handleLogout}
                  >
                    <Icon icon="mdi:logout" /> Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/login" className="text-sm text-gray-700 hover:text-blue-600">
            <button className="bg-[#0b5b6e] text-white px-5 py-2 text-sm rounded hover:bg-[#338496] cursor-pointer">
              Log In
            </button>
          </Link>
        )}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-800 text-xl"
        >
          <Icon icon={menuOpen ? "mdi:close" : "mdi:menu"} />
        </button>
      </div>

      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full right-0 mt-2 w-full bg-white shadow-md flex flex-col gap-4 px-4 py-4 md:hidden text-sm text-gray-700 z-50"
        >
          {user ? (
            <>
              {filteredLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.to}
                  className={`hover:text-blue-600 ${
                    isActive(link.to)
                      ? "text-blue-600 font-semibold underline"
                      : "text-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon icon={link.icon} className="mr-1" /> {link.name}
                </Link>
              ))}
              <hr />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="hover:text-blue-600 flex items-center gap-2 cursor-pointer"
              >
                <Icon icon="mdi:logout" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
              <Link href="#" className="hover:text-blue-600">
                Templates
              </Link>
              <Link href="#" className="hover:text-blue-600">
                Features
              </Link>
              <hr />
              <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
