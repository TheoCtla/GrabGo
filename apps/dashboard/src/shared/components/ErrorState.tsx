import { Link } from 'react-router-dom';

type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

export function ErrorState({ title, message, actionLabel, actionHref }: ErrorStateProps) {
  return (
    <section className="state state--error" aria-labelledby="error-state-title" role="alert">
      <h1 id="error-state-title">{title}</h1>
      <p>{message}</p>
      {actionLabel && actionHref ? (
        <Link className="button button--secondary" to={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
