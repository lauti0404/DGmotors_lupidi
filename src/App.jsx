import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/Auth";
import { DataProvider } from "./context/Data";
import { Layout } from "./components/Layout";
import { Logo } from "./components/ui";
import { startSupabaseKeepAlive } from "./lib/keepAlive";
import { Login, NewPassword } from "./views/Login";

function Gate() {
  const auth = useAuth();
  if (!auth.ready) {
    return (
      <div className="min-h-screen bg-[#151515] grid place-items-center">
        <Logo className="h-52 w-52" />
      </div>
    );
  }
  if (auth.recovery) return <NewPassword />;
  if (!auth.user) return <Login />;
  return (
    <DataProvider userId={auth.user.id}>
      <Layout />
    </DataProvider>
  );
}

export default function App() {
  useEffect(() => startSupabaseKeepAlive(), []);
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
