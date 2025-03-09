import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'

type MarkdownProps = {
    content: string
}

export function Markdown({ content }: MarkdownProps) {
    return (
        <ReactMarkdown
            // @ts-expect-error - TODO: fix this
            className='prose prose-invert max-w-none'
            components={{
                // @ts-expect-error - TODO: fix this
                code({ _node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                        <SyntaxHighlighter
                            // @ts-expect-error - TODO: fix this
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag='div'
                            {...props}>
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    )
                },
            }}>
            {content}
        </ReactMarkdown>
    )
}
