import { useClipboard } from '../hooks/useClipboard';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label }: Props) {
  const { copied, copyToClipboard } = useClipboard();

  return (
    <button
      onClick={() => copyToClipboard(text)}
      title={label ?? 'Copy to clipboard'}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
    >
      {copied ? (
        <span className="text-green-600 font-medium">Copied!</span>
      ) : (
        <span>Copy</span>
      )}
    </button>
  );
}
