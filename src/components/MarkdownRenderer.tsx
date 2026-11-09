import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  // Normalizza sia i newline reali sia eventuali sequenze literal "\n" salvate a DB
  // e converte i bullet unicode (•, ●, ○) a inizio riga in liste markdown standard (- )
  const normalizedContent = content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/^[ \t]*[•●○]\s*/gm, "- ");

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none text-foreground/90 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base sm:text-lg font-black text-foreground mt-4 mb-2 pb-1 border-b border-border/60" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-extrabold text-foreground mt-3.5 mb-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400 mt-3 mb-1 uppercase tracking-wider" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-bold text-foreground mt-2 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-xs sm:text-sm leading-relaxed mb-2.5 text-foreground/90" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-2.5 text-xs sm:text-sm text-foreground/90 pl-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2.5 text-xs sm:text-sm text-foreground/90 pl-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-xs sm:text-sm leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/80" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-primary/60 pl-3 my-2 italic text-muted-foreground bg-muted/20 py-1 rounded-r" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-border/60" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border/70">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="bg-muted/60 p-2 font-bold text-foreground border-b border-border/70" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2 border-b border-border/50 text-foreground/90" {...props} />
          ),
          code: ({ node, className: codeClass, children, ...props }: any) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-semibold" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-muted/80 p-2.5 rounded-lg overflow-x-auto font-mono text-xs my-2 border border-border/70">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
