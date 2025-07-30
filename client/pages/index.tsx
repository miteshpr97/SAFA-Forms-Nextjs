// pages/index.tsx
import dynamic from "next/dynamic";
import Head from "next/head";

// Lazy-load the CompanyRegis component
const CompanyRegis = dynamic(() => import("@/pages/Company/CompanyRegis"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Company Registration</title>
      </Head>
      <CompanyRegis />
    </>
  );
}
