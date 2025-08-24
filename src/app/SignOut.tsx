import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignOut() {
  const session = await auth();
  return (
    <form
      action={async () => {
        "use server";
        if (session?.user) {
          await signOut();
        } else {
          redirect("/auth/login");
        }
      }}
      className="inline-block ml-4"
    >
      <button
        type="submit"
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {session?.user?.email ? "Sign out" : "Sign in"}
      </button>
    </form>
  );
}
