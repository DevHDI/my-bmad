interface LoadingStatusProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function LoadingStatus({ label = "Loading…", children, className }: LoadingStatusProps) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
