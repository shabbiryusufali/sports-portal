import { signIn } from "@/auth";

export default function LoginForm() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        await signIn("credentials", { email, password });
        // await signIn("google");
      }}
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
  );
}
