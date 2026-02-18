interface RepoLayoutProps {
  children: React.ReactNode;
}

export default function RepoLayout({ children }: RepoLayoutProps) {
  return (
    <div className="mesh-gradient min-h-full">
      <div className="pt-6 lg:pt-8">
        {children}
      </div>
    </div>
  );
}
