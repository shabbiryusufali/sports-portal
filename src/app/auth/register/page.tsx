import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";
import { auth } from "@/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <RegisterForm />
    </div>
  );
}
