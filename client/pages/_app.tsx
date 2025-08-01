// client/pages/_app.tsx
import "@/styles/globals.css";
import "@/styles/main.scss";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store";
import Navbar from "@/components/Navbar/Navbar";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Routes where Navbar should NOT be shown
  const noNavbarRoutes = ["/auth/login", "/auth/forgot"];

  const shouldShowNavbar = !noNavbarRoutes.includes(router.pathname);

  return (
    <Provider store={store}>
      {shouldShowNavbar && <Navbar />}
      <main>
        <Component {...pageProps} />
      </main>
    </Provider>
  );
}
