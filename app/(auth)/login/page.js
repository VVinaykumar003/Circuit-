"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await axios.post("/api/auth/session", { email, password });

    const role = res.data.role;

    if (role === "admin") {
     router.push("/dashboard");

    } else {
      router.push("/dashboard");
    }
  } catch (err) {
    setError("Invalid credentials or server error.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (email && password) {
      setError("");
    }
  }, [email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Login
        </h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <Label
              htmlFor="email"
              className="block text-gray-700 font-semibold mb-2"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <Label
              htmlFor="password"
              className="block text-gray-700 font-semibold mb-2"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className={`w-full py-3 mt-2 font-semibold transition-colors ${
              loading ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Back to{" "}
          <Link href="/" className="text-blue-500 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
