import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    type: (s.type as string) === "merchant" ? "merchant" : "personal",
  }),
  component: LoginPlaceholder,
  head: () => ({ meta: [{ title: "Sign in to BadePay" }] }),
});

function LoginPlaceholder() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui" }}>
      <p style={{ opacity: 0.6 }}>Login page — paste the code next.</p>
    </div>
  );
}
