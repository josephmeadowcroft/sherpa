import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  text: string;
  isUser: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ text, isUser }) => {
  const linkClass = isUser
    ? 'underline decoration-blue-200/60 hover:decoration-blue-100 text-blue-50'
    : 'underline decoration-blue-300 hover:decoration-blue-500 text-blue-700';

  const codeClass = isUser
    ? 'bg-blue-700/50 text-blue-50'
    : 'bg-gray-100 text-gray-800 border border-gray-200';

  return (
    <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className={`px-1 py-0.5 rounded text-xs font-mono ${codeClass}`}>{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-current/30 pl-3 italic opacity-90 mb-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-current/20" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};
