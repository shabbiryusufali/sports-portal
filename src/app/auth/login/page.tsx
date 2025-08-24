import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./LoginForm";

export default async function AuthPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
      className="text-black"
    >
      <section className="p-8 border border-gray-700 rounded-lg shadow-lg bg-white">
        <h1>Sign In</h1>
        <LoginForm />
      </section>
    </main>
  );
}
