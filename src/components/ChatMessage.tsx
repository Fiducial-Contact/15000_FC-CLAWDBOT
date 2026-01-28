'use client';

import { memo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded transition-all duration-200 ${
        copied
          ? 'bg-green-100 text-green-600'
          : 'bg-black/5 text-[var(--fc-body-gray)] hover:bg-black/10 hover:text-[var(--fc-black)]'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace('language-', '') || '';

  return (
    <div className="relative group my-2">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton text={children} />
      </div>
      {language && (
        <div className="absolute left-3 top-2 text-[10px] font-medium text-[var(--fc-light-gray)] uppercase tracking-wider">
          {language}
        </div>
      )}
      <pre className={`${className || ''} rounded-lg bg-[#1e1e1e] text-[#d4d4d4] p-3 pt-7 overflow-x-auto text-[13px] leading-relaxed`}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isInline = !className;
    const content = String(children).replace(/\n$/, '');

    if (isInline) {
      return (
        <code className="px-1 py-0.5 bg-black/5 rounded text-[13px] font-mono" {...props}>
          {content}
        </code>
      );
    }

    return <CodeBlock className={className}>{content}</CodeBlock>;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--fc-action-red)] hover:underline"
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>;
  },
  li({ children }) {
    return <li>{children}</li>;
  },
  p({ children }) {
    return <p className="my-1.5 leading-relaxed">{children}</p>;
  },
  h1({ children }) {
    return <h1 className="text-lg font-semibold mt-3 mb-1.5">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-base font-semibold mt-2.5 mb-1.5">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-3 border-[var(--fc-border-gray)] pl-3 my-2 text-[var(--fc-body-gray)] italic">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border-collapse border border-[var(--fc-border-gray)] text-sm">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-[var(--fc-border-gray)] px-2 py-1.5 bg-black/5 font-semibold text-left">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border border-[var(--fc-border-gray)] px-2 py-1.5">
        {children}
      </td>
    );
  },
};

export const ChatMessage = memo(function ChatMessage({
  content,
  role,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const [showCopy, setShowCopy] = useState(false);

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      <div className={`relative max-w-[85%] md:max-w-[75%] ${isUser ? 'mr-1' : 'ml-1'}`}>
        {/* Bubble tail */}
        <div
          className={`absolute top-0 w-3 h-3 ${
            isUser
              ? 'right-[-6px] bg-[var(--fc-charcoal)]'
              : 'left-[-6px] bg-white'
          }`}
          style={{
            clipPath: isUser
              ? 'polygon(0 0, 100% 0, 0 100%)'
              : 'polygon(100% 0, 0 0, 100% 100%)',
          }}
        />

        <motion.div
          className={`relative px-3 py-2 text-[14px] ${
            isUser
              ? 'bg-[var(--fc-charcoal)] text-white rounded-lg rounded-tr-none'
              : 'bg-white text-[var(--fc-black)] rounded-lg rounded-tl-none shadow-sm border border-[var(--fc-border-gray)]/50'
          }`}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          {/* Copy button on hover */}
          {showCopy && (
            <div className={`absolute top-1 ${isUser ? 'left-1' : 'right-1'}`}>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(content);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                className={`p-1 rounded transition-all duration-200 ${
                  isUser
                    ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    : 'bg-black/5 text-[var(--fc-body-gray)] hover:bg-black/10 hover:text-[var(--fc-black)]'
                }`}
                title="Copy"
              >
                <Copy size={12} />
              </button>
            </div>
          )}

          {isUser ? (
            <div className="flex flex-col">
              <p className="whitespace-pre-wrap leading-relaxed pr-12">{content}</p>
              {timestamp && (
                <span className="text-[10px] text-white/60 self-end mt-0.5 -mb-0.5">
                  {timestamp}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="markdown-content pr-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </div>
              {timestamp && (
                <span className="text-[10px] text-[var(--fc-body-gray)]/70 self-end mt-1 -mb-0.5">
                  {timestamp}
                </span>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
});
