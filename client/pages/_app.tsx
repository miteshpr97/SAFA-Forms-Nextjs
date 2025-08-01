// client/pages/_app.tsx
import "@/styles/globals.css";
import "@/styles/main.scss";
import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { store } from "../store";
import AppLayout from "@/components/Layout/AppLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </Provider>
  );
}
