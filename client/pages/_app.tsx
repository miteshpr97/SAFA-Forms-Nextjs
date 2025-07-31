// client/pages/_app.tsx
import "@/styles/globals.css";
import "@/styles/main.scss";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "@/store"; // adjust this path if needed
import Navbar from "@/components/Navbar/Navbar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Navbar />
      <main>
        <Component {...pageProps} />
      </main>
    </Provider>
  );
}
