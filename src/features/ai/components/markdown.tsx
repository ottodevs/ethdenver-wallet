import { cn } from '@/lib/utils/tailwind'
import ReactMarkdown from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import rehypeRaw from 'rehype-raw'

interface MarkdownProps {
    content: string
    className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
    return (
        <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{
                    code(props) {
                        const { className, children, ...rest } = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                            <SyntaxHighlighter
                                language={match[1]}
                                style={docco}
                                // {...rest}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...rest}>
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
