import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'

type MarkdownProps = {
    content: string
}

export function Markdown({ content }: MarkdownProps) {
    return (
        <div className='prose prose-invert max-w-none'>
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag='div' {...props}>
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        )
                    },
                    p({ children }) {
                        return <p className='whitespace-pre-line'>{children}</p>
                    },
                    ul({ children }) {
                        return <ul className='list-disc space-y-1 pl-5'>{children}</ul>
                    },
                    ol({ children }) {
                        return <ol className='list-decimal space-y-1 pl-5'>{children}</ol>
                    },
                    li({ children }) {
                        return <li className='mb-1'>{children}</li>
                    },
                }}>
                {content}
            </ReactMarkdown>
        </div>
    )
}
