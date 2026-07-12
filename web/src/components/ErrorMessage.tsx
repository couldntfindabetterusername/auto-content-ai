interface Props {
  message: string;
  suggestion?: string;
}

export function ErrorMessage({ message, suggestion }: Props) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">{message}</p>
      {suggestion && (
        <p className="mt-1 text-sm text-red-600">{suggestion}</p>
      )}
    </div>
  );
}

export default ErrorMessage;
