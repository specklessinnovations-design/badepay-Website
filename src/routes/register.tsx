import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as string) === "merchant" ? "merchant" : "customer",
  }),
  component: RegisterPlaceholder,
  head: () => ({ meta: [{ title: "Create your BadePay account" }] }),
});

function RegisterPlaceholder() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui" }}>
      <p style={{ opacity: 0.6 }}>Register page — paste the code next.</p>
    </div>
  );
}
