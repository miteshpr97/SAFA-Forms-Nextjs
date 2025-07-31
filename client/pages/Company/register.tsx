//pages/Company/CompanyRegis.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"; // Optional if using Next.js 13/14+ with App Router

import { ChangeEvent, FormEvent, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router"; // ✅ Changed from react-router-dom
import styles from "./CompanyRegis.module.scss"; // ✅ Using module-based CSS

interface CompanyFormData {
  company_name: string;
  company_logo: File | null;
  company_email: string;
  company_phone: string;
  company_address: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
}

const CompanyRegis = () => {
  const router = useRouter(); // ✅ changed to Next.js navigation
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: "",
    company_logo: null,
    company_email: "",
    company_phone: "",
    company_address: "",
    country: "",
    state: "",
    city: "",
    pinCode: "",
  });

  console.log(styles.companyRegis);


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" && files?.length ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requiredFields = [
      "company_name",
      "company_email",
      "company_phone",
      "company_address",
      "country",
      "state",
      "city",
      "pinCode",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof CompanyFormData]) {
        toast.error(`Please fill in ${field.replace("_", " ")}`);
        return;
      }
    }

    setIsLoading(true);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      const response = await fetch("/api/v1/company/addCompany", {
        method: "POST",
        body: data,
      });

      if (response.ok && response.status === 201) {
        toast.success("Company profile created successfully!");
        setFormData({
          company_name: "",
          company_logo: null,
          company_email: "",
          company_phone: "",
          company_address: "",
          country: "",
          state: "",
          city: "",
          pinCode: "",
        });
        setTimeout(() => router.push("/company-success"), 2000); // ✅ navigate
      } else {
        const errorData = await response.json();
        toast.error(errorData?.message || "Failed to create company profile.");
      }
    } catch (err: any) {
      toast.error("An error occurred while creating the profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className={styles.companyRegis}>
        <div className={styles.leftSection}>
          <p className={styles.tagline}>Build Forms Effortlessly</p>
          <h1 className={styles.heading}>
            Create and manage forms with ease using our intuitive form builder
          </h1>
          <button className={styles.learnMoreBtn}>Learn More</button>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.formWrapper}>
            <h2 className="text-lg font-semibold mb-4 text-[#1a315d] text-center">
              Request a Call Back
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="company_name"
                placeholder="Company Name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                required
              />
              <input
                type="email"
                name="company_email"
                placeholder="Company Email"
                value={formData.company_email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                required
              />
              <input
                type="tel"
                name="company_phone"
                placeholder="Company Phone"
                value={formData.company_phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                required
              />
              <input
                type="text"
                name="company_address"
                placeholder="Company Address"
                value={formData.company_address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                required
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"

                  required
                />
                <input
                  type="text"
                  name="pinCode"
                  placeholder="Pin Code"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#007a7a] focus:ring-[#007a7a]"

                  required
                />
              </div>
              {/* <input
                type="file"
                name="company_logo"
                accept="image/*"
                onChange={handleChange}
              /> */}
              {formData.company_logo && (
                <p className="text-sm mt-1 text-green-600 truncate">
                  Selected: {formData.company_logo.name}
                </p>
              )}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyRegis;










