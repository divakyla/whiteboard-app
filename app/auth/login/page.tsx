"use client";
import React, { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignInContent = () => {
  const email = useRef("");
  const password = useRef("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const callbackUrl = "/whiteboard";
    try {
      const result = await signIn("credentials", {
        email: email.current,
        password: password.current,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result?.error);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      console.error("Login error:", "login Fail");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 via-blue-200 to-blue-400">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-6">
          LOGIN
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-center font-medium">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              defaultValue={email.current}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onChange={(e) => (email.current = e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onChange={(e) => (password.current = e.target.value)}
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Do not have an account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
const SignIn: React.FC = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SignInContent />
    </Suspense>
  );
};

export default SignIn;

// "use client";

// import { useEffect, useState, Suspense } from "react";
// import { getSession, signIn } from "next-auth/react";
// import { useSearchParams, useRouter } from "next/navigation";

// function SignInContent() {
//   const [checkingSession, setCheckingSession] = useState(true);
//   const searchParams = useSearchParams();
//   const fromLogout = searchParams.get("fromLogout");
//   const router = useRouter();

//   useEffect(() => {
//     // Clear stale logout indicators
//     localStorage.removeItem("auth_logout_timestamp");
//     document.cookie =
//       "logged_out=; path=/; domain=.webmagic-beta.com; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure";
//     document.cookie =
//       "next-auth.session-token=; path=/; domain=.webmagic-beta.com; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure";
//     document.cookie =
//       "__Secure-next-auth.session-token=; path=/; domain=.webmagic-beta.com; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure";

//     const checkSession = async () => {
//       try {
//         if (fromLogout) {
//           await new Promise((resolve) => setTimeout(resolve, 500));
//         }

//         const session = await getSession();
//         if (!session) {
//           if (!fromLogout) {
//             await new Promise((resolve) => setTimeout(resolve, 300));
//             await signIn("cognito", { callbackUrl: "/", lang: "ja" });
//           } else {
//             setCheckingSession(false);
//           }
//         } else {
//           const expiresAt = new Date(session.expires).getTime();
//           const now = Date.now();

//           if (now >= expiresAt) {
//             router.push("/auth/login?fromLogout=true");
//           } else {
//             router.push("/");
//           }
//         }
//       } catch (error) {
//         console.error("[SignIn] Error checking session:", error);
//         setCheckingSession(false);
//       }
//     };

//     checkSession();
//   }, [fromLogout, router]);

//   if (checkingSession) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 via-blue-200 to-blue-400">
//         <p className="text-blue-800 font-semibold text-lg">
//           セッションを確認中...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 via-blue-200 to-blue-400">
//       <p className="text-lg text-gray-700 mb-6">
//         ログアウトしました。再度ログインしてください。
//       </p>
//       <button
//         onClick={() => signIn("cognito", { callbackUrl: "/" })}
//         className="py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//       >
//         ログイン
//       </button>
//     </div>
//   );
// }

// export default function SignIn() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 via-blue-200 to-blue-400">
//           <p className="text-blue-800 font-semibold text-lg">Loading...</p>
//         </div>
//       }
//     >
//       <SignInContent />
//     </Suspense>
//   );
// }
