import { signIn } from "@/api/auth/auth";

export default function LoginForm() {
  return (
    <div>
      <div>
        <button
          onClick={async () => {
            "use server";
            await signIn("google", { callback: "/" });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign in with Google
        </button>
      </div>
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          await signIn();
          // await signIn("google");
        }}
        className="text-black"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
