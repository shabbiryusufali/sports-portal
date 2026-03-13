import { auth, signOut } from "@/api/auth/auth";
import { redirect } from "next/navigation";

export default async function SignOut() {
  const session = await auth();
  return (
    <form
      action={async () => {
        "use server";
        if (session?.user) {
          await signOut({ redirectTo: "/" });
        } else {
          redirect("/auth/login");
        }
      }}
      className="inline-block"
    >
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 border border-zinc-700 transition"
      >
        {session?.user ? "Sign out" : "Sign in"}
      </button>
    </form>
  );
}
