export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0EFE9] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DA] shadow-lg p-8 sm:p-10">
        {children}
      </div>
    </div>
  );
}
