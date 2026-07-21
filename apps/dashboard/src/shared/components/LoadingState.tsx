type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Chargement en cours...' }: LoadingStateProps) {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
