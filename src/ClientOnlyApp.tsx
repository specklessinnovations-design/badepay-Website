import * as React from "react";

const App = React.lazy(() => import("./App"));

export function ClientOnlyApp() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  );
}
