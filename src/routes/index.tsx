import { createFileRoute } from "@tanstack/react-router";
import { ClientOnlyApp } from "@/ClientOnlyApp";

export const Route = createFileRoute("/")({
  ssr: false,
  component: ClientOnlyApp,
});
