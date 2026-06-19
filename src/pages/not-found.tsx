import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--background)]">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-[var(--color-danger)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            The page you are looking for does not exist.
          </p>
          
          <div className="mt-6">
            <a href="/" className="text-[var(--accent-text)] hover:underline">Go back home</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
