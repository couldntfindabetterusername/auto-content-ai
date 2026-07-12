import { getLoginUrl } from '../api/auth';

export function LoginButton() {
  return (
    <a href={getLoginUrl()}>
      <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 cursor-pointer transition-colors">
        Sign in with Google
      </button>
    </a>
  );
}
