/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.scss"; 

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginForm>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Both email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/v1/user/login", formData, {
        withCredentials: true,
      });

      const user = response.data?.data;

      // Redirect based on role
      if (user.role === "admin") {
        router.push("/dashboard");
      } else if (user.role === "user") {
        router.push("/response");
      } else {
        router.push("/");
      }

    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginpage}>
      {/* Left Section: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md transition-transform duration-500 transform hover:scale-[1.01]">
          <div className="flex items-center justify-center mb-2">
            <Image
              src="/Safa Forms logo-1-Fit.png"
              alt="Logo"
              width={160}
              height={40}
              className="me-2"
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm text-gray-600">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#007a7a] text-sm"
                required
              />
            </div>

            <div className="relative">
              <label className="block mb-1 text-sm text-gray-600">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#007a7a] text-sm"
                required
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute top-9 right-4 text-gray-500 hover:text-[#007a7a] cursor-pointer"
              >
                <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
              </button>
            </div>

            {error && <p className="text-[#ff3c3c] text-center text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#007a7a] text-white rounded-full font-semibold hover:bg-[#006565] transition duration-300 ease-in-out cursor-pointer"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/forget" className="text-sm text-gray-500 hover:text-[#007a7a] transition">
              Forgot Password?
            </Link>
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            Don’t have an account?{" "}
            <a href="#" className="text-[#007a7a] font-medium hover:underline">
              Create New
            </a>
          </div>
        </div>
      </div>

      {/* Right Section: Banner */}
      <div className={styles.rightSection}>
        <div className="w-full flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            SAFA FORMS
          </h1>
          <p className="text-lg font-medium text-gray-100 mt-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            on Industrial Watch and Enterprise Mobile
          </p>
          <Image
            src="/safa-banner2.png"
            alt="Safa Forms Banner"
            width={500}
            height={300}
            className="object-contain mt-4"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
