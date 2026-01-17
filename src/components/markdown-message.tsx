"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

interface MarkdownMessageProps {
  content: string
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  // Return empty div if content is empty or undefined
  if (!content || content.trim() === "") {
    return null
  }

  const components: Components = {
    // Headers
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mt-3 mb-2 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-semibold mt-2 mb-1 first:mt-0">{children}</h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h6>
    ),
    
    // Paragraphs
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
    ),
    
    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-2 ml-4 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-2 ml-4 space-y-1">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="ml-2">{children}</li>
    ),
    
    // Code blocks
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "")
      const isInline = !className
      
      return isInline ? (
        <code
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-words"
          {...props}
        >
          {children}
        </code>
      ) : (
        <code
          className={`block bg-muted/50 p-3 rounded-md text-sm font-mono overflow-x-auto mb-2 border border-border`}
          {...props}
        >
          {children}
        </code>
      )
    },
    
    pre: ({ children }) => (
      <pre className="bg-muted/50 p-0 rounded-md overflow-x-auto mb-2 border border-border">
        {children}
      </pre>
    ),
    
    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:text-primary/80"
      >
        {children}
      </a>
    ),
    
    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-border pl-4 italic my-2 text-muted-foreground">
        {children}
      </blockquote>
    ),
    
    // Horizontal rule
    hr: () => <hr className="my-4 border-border" />,
    
    // Tables (from remark-gfm)
    table: ({ children }) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2">{children}</td>
    ),
    
    // Strong and emphasis
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
  }

  return (
    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
