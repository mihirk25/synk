import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SESSION_COOKIE, SESSION_KIND_COOKIE } from "@/lib/auth/constants";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has(SESSION_COOKIE);

  if (hasSession) {
    const kind = cookieStore.get(SESSION_KIND_COOKIE)?.value;
    redirect(kind === "staff" ? "/close" : "/dashboard");
  }

  return <WelcomeScreen />;
}
