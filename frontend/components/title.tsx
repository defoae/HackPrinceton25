export function TypographyH1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-5xl font-extrabold text-center text-white drop-shadow-lg">
      {children}
    </h1>
  );
}