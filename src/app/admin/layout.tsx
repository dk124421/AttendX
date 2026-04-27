import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return redirect("/login");
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar role="ADMIN" />
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8 transition-all duration-300 relative z-10">
        <div className="mx-auto max-w-7xl">
          <TopHeader />
          {children}
        </div>
      </main>
    </div>
  );
}
