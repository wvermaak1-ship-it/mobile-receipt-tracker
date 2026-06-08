import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {children}
      <MobileBottomNav />
    </div>
  );
}
