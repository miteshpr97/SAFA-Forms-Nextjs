// client/pages/_app.tsx
import "@/styles/globals.css";
import "@/styles/main.scss";
import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <main className="">
        <Component {...pageProps} />
      </main>
    </>
  );
}
