import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
  theme: {
    colorScheme: "light",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const url = process.env.LOGIN_API_LINK as string;
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: credentials?.email,
              password: credentials?.password,
            }),
            cache: "no-store",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Invalid credentials");
          }

          const res = await response.json();
          return {
            id: res.result.id,
            username: res.result.username,
            role: res.result.role,
            accessToken: res.result.accessToken,
          };
        } catch (error) {
          console.error("❌ Authorization error:", error);
          throw new Error("Authorization failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.username;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          username: token.name as string,
          role: token.role as string,
          accessToken: token.accessToken as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// import NextAuth from "next-auth";
// import CognitoProvider from "next-auth/providers/cognito";

// const handler = NextAuth({
//   providers: [
//     CognitoProvider({
//       clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
//       clientSecret: process.env.COGNITO_CLIENT_SECRET!,
//       issuer: process.env.COGNITO_ISSUER!,
//       authorization: {
//         params: {
//           lang: "ja",
//           scope: "openid email",
//         },
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//     maxAge: 24 * 60 * 60,
//     updateAge: 60 * 60,
//   },
//   callbacks: {
//     async jwt({ token, account }) {
//       if (account) {
//         token.accessToken = account.access_token;
//         token.idToken = account.id_token;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       session.user = {
//         id: token.sub ?? "",
//         username: token.name ?? "",
//         role: typeof token.role === "string" ? token.role : "",
//         accessToken:
//           typeof token.accessToken === "string" ? token.accessToken : "",
//       };
//       return session;
//     },
//   },
//   cookies: {
//     sessionToken: {
//       name: `__Secure-next-auth.session-token`,
//       options: {
//         httpOnly: true,
//         sameSite: "lax",
//         path: "/",
//         secure: true,
//         domain: ".webmagic-beta.com", // Shared domain
//       },
//     },
//   },
//   pages: {
//     signIn: "/auth/login",
//   },
//   debug: process.env.NODE_ENV === "development",
// });

// export { handler as GET, handler as POST };
