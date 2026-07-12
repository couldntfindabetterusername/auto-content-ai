import { Copy, Check } from 'lucide-react';
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
      className="inline-flex items-center justify-center w-6 h-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded transition-colors shrink-0"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
