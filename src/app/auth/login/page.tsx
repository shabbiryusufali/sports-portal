import LoginForm from "./LoginForm";

export default function AuthPage() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          padding: 32,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#fff",
          minWidth: 320,
        }}
      >
        <h1>Sign In</h1>
        <LoginForm />
      </section>
    </main>
  );
}
