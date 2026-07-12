import { getLoginUrl } from '../api/auth';

export function LoginButton() {
  return (
    <a href={getLoginUrl()}>
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
        Sign in with Google
      </button>
    </a>
  );
}
