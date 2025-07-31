// pages/index.tsx
import dynamic from "next/dynamic";


// Lazy-load the CompanyRegis component
const CompanyRegis = dynamic(() => import("@/pages/company/register"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
     
      <CompanyRegis />
    </>
  );
}
