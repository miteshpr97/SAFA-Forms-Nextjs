import dynamic from "next/dynamic";


// Lazy-load the CompanyRegis component
const CompanyRegis = dynamic(
  () => import("@/pages/Company/CompanyRegis"), // ✅ Adjust path if needed
  {
    ssr: false, // Disable SSR if the component relies on 'window' or browser APIs
  }
);

export default function HomePage() {
  return <CompanyRegis />;
}
