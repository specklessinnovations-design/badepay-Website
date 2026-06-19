import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  component: ContactPlaceholder,
  head: () => ({ meta: [{ title: "Contact BadePay" }] }),
});

function ContactPlaceholder() {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui" }}>
      <p style={{ opacity: 0.6 }}>Contact page placeholder.</p>
    </div>
  );
}
