// pages/index.tsx
import dynamic from "next/dynamic";


// Lazy-load the CompanyRegis component
const CompanyRegis = dynamic(() => import("@/pages/Company/CompanyRegis"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
     
      <CompanyRegis />
    </>
  );
}
