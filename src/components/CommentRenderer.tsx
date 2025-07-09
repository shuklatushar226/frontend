import React from 'react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import CodeContextCard from './CodeContextCard';

interface CommentRendererProps {
  content: string;
  author: string;
  createdAt: string;
  commentType?: 'review' | 'issue' | 'general' | 'bot';
  // Code context fields for review comments
  filePath?: string | null;
  lineNumber?: number | null;
  diffHunk?: string | null;
  originalLine?: number | null;
  side?: 'LEFT' | 'RIGHT' | null;
}

const CommentRenderer: React.FC<CommentRendererProps> = ({ 
  content, 
  author, 
  createdAt, 
  commentType = 'general',
  filePath,
  lineNumber,
  diffHunk,
  originalLine,
  side
}) => {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const isBot = author.includes('[bot]') || commentType === 'bot';
  const isHTMLContent = content.includes('<') && content.includes('>');

  // Sanitize HTML content
  const sanitizeHTML = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'strike', 'code', 'pre',
        'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'div', 'span', 'details', 'summary', 'picture', 'source'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height', 'align',
        'class', 'id', 'target', 'rel', 'media', 'srcset'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i
    });
  };

  const renderContent = () => {
    if (isHTMLContent) {
      // For HTML content (like bot comments), sanitize and render as HTML
      const sanitizedHTML = sanitizeHTML(content);
      return (
        <div 
          className="comment-html-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
        />
      );
    } else {
      // For Markdown content, use ReactMarkdown
      return (
        <div className="comment-markdown-content">
          <ReactMarkdown
            components={{
              // Custom components for better styling
              code: ({ node, className, children, ...props }: any) => {
                const isInline = !className;
                return isInline ? (
                  <code className="inline-code" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="code-block">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              a: ({ node, children, href, ...props }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="comment-link"
                  {...props}
                >
                  {children}
                </a>
              ),
              img: ({ node, src, alt, ...props }) => (
                <img 
                  src={src} 
                  alt={alt} 
                  className="comment-image"
                  loading="lazy"
                  {...props}
                />
              ),
              table: ({ node, children, ...props }) => (
                <div className="table-wrapper">
                  <table className="comment-table" {...props}>
                    {children}
                  </table>
                </div>
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    }
  };

  // Check if this is a review comment with code context
  const hasCodeContext = commentType === 'review' && filePath && (lineNumber || originalLine);

  return (
    <div className={`comment-container ${isBot ? 'bot-comment' : 'user-comment'}`}>
      <div className="comment-header">
        <div className="comment-author-info">
          <span className={`comment-author ${isBot ? 'bot-author' : ''}`}>
            {author}
            {isBot && <span className="bot-badge">BOT</span>}
            {commentType === 'review' && (
              <span className="comment-type-badge bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded ml-2">
                Code Review
              </span>
            )}
          </span>
          <span className="comment-timestamp">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
      
      {/* Show code context card for review comments with file context */}
      {hasCodeContext && (
        <div className="code-context-section mb-3">
          <CodeContextCard
            filePath={filePath!}
            lineNumber={lineNumber || null}
            diffHunk={diffHunk || null}
            side={side || null}
            originalLine={originalLine || null}
          />
        </div>
      )}
      
      <div className="comment-body">
        {renderContent()}
      </div>
    </div>
  );
};

export default CommentRenderer;
