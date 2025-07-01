"use client";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ConfirmContent: React.FC = () => {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  const userSub = searchParams.get("userSub");

  const email = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!confirmationCode) {
      setError("Confirmation code is required.");
      return;
    }
    if (!username) {
      setError("Username is required.");
      return;
    }
    if (!userSub) {
      setError("UserSub is missing from the URL.");
      return;
    }

    try {
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          UserSub: userSub,
          confirmationCode: confirmationCode,
          username: username,
          email: email,
        }),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setError(responseBody.message || "Failed to confirm the user.");
        return;
      }

      if (responseBody.status === "success") {
        setSuccess(true);
        setError(""); // Clear any errors
        router.push(`/auth/login?username=${encodeURIComponent(email)}`);
      } else {
        setError("Confirmation failed.");
      }
    } catch (error) {
      console.error("Error confirming user:", error);
      setError("An error occurred while confirming the user.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 via-blue-200 to-blue-400">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-6">
          CONFIRM
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-center font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              readOnly
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirmationCode"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmation Code
            </label>
            <input
              type="text"
              id="confirmationCode"
              name="confirmationCode"
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onChange={(e) => setConfirmationCode(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm
          </button>
        </form>
      </div>
    </div>
  );
};

const Confirm: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ConfirmContent />
    </Suspense>
  );
};

export default Confirm;
