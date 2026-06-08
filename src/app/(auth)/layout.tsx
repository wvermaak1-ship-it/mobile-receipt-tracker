export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-top safe-bottom bg-gradient-to-b from-teal-50 to-slate-50">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
