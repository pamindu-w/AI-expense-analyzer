import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  getChatHistory,
  clearChatHistory,
  streamChat,
  type ChatMessage,
} from '../services/api'

const SUGGESTIONS = [
  'Where can I save money this month?',
  'How much have I spent so far this month?',
  'Am I over any of my budgets?',
  'Summarize my recurring subscriptions.',
]

// --- Markdown-lite renderer (React nodes only — no raw HTML) -------------

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i} className="chat-code">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}

function renderBlock(block: string, key: number) {
  const lines = block.split('\n').map((l) => l.trim())
  const bullet = lines.every((l) => /^[-*]\s+/.test(l))
  const numbered = lines.every((l) => /^\d+[.)]\s+/.test(l))

  if (bullet || numbered) {
    const items = lines.map((l) => l.replace(/^([-*]|\d+[.)])\s+/, ''))
    const Tag = bullet ? 'ul' : 'ol'
    return (
      <Tag className="chat-list" key={key}>
        {items.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>
    )
  }

  const heading = /^#{1,3}\s+/.test(lines[0]) ? lines[0].replace(/^#{1,3}\s+/, '') : null
  if (heading) {
    return (
      <p className="chat-h" key={key}>
        {renderInline(heading)}
      </p>
    )
  }

  return <p key={key}>{renderInline(lines.join(' '))}</p>
}

function renderRich(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
  return (
    <Fragment>
      {blocks.length === 0 ? text : blocks.map((b, i) => renderBlock(b, i))}
    </Fragment>
  )
}

function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<string[]>([])
  const streamRef = useRef('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    getChatHistory()
      .then((data) => {
        if (!cancelled) setMessages(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setError('Could not load chat history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, sending])

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setFollowUps([])
    streamRef.current = ''
    setStreamingText('')
    setSending(true)

    try {
      await streamChat(trimmed, {
        onChunk: (chunk) => {
          streamRef.current += chunk
          setStreamingText(streamRef.current)
        },
        onDone: (ups) => {
          const reply = streamRef.current.trim()
          if (reply) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: reply },
            ])
          }
          setStreamingText(null)
          setFollowUps(ups)
        },
        onError: (message) => {
          setError(message)
          setStreamingText(null)
        },
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setStreamingText(null)
    } finally {
      setSending(false)
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return
    try {
      await clearChatHistory()
      setMessages([])
      setStreamingText(null)
      setFollowUps([])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear chat.')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inconsolata:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080810;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
        }

        .chat-root {
          min-height: 100vh;
          background: #080810;
          position: relative;
          overflow-x: hidden;
        }

        .chat-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .chat-content {
          position: relative;
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }

        .back-link {
          display: inline-block;
          color: rgba(232,232,240,0.45);
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .back-link:hover { color: #f59e0b; }

        .chat-eyebrow {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f59e0b;
          margin-bottom: 0.3rem;
        }
        .chat-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 2rem;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .chat-header-left { flex: 1; }
        .chat-header-left .chat-eyebrow { margin-bottom: 0.3rem; }
        .chat-header-left .chat-title { margin-bottom: 0; }

        .chat-clear {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(232,232,240,0.6);
          font-family: 'Inconsolata', monospace;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.5rem 0.9rem;
          border-radius: 6px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
        }
        .chat-clear:hover {
          color: #f87171;
          border-color: rgba(239,68,68,0.5);
        }

        .chat-panel {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 62vh;
          min-height: 420px;
        }

        .chat-panel-top {
          height: 3px;
          background: linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-empty {
          margin: auto;
          text-align: center;
          color: rgba(232,232,240,0.35);
          font-size: 0.9rem;
          max-width: 420px;
          line-height: 1.6;
        }

        .chat-bubble {
          max-width: 78%;
          padding: 0.7rem 1rem;
          border-radius: 10px;
          font-size: 0.92rem;
          line-height: 1.55;
          word-break: break-word;
        }
        .chat-bubble.user {
          align-self: flex-end;
          background: #f59e0b;
          color: #080810;
          border-bottom-right-radius: 3px;
          font-weight: 500;
        }
        .chat-bubble.assistant {
          align-self: flex-start;
          background: rgba(255,255,255,0.06);
          color: #e8e8f0;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 3px;
        }
        .chat-bubble.assistant p { margin: 0 0 0.4rem; }
        .chat-bubble.assistant p:last-child { margin-bottom: 0; }
        .chat-bubble.assistant .chat-h {
          color: #fbbf24;
          font-weight: 600;
        }
        .chat-list {
          margin: 0 0 0.4rem 1.1rem;
          padding: 0;
        }
        .chat-list:last-child { margin-bottom: 0; }
        .chat-list li { margin-bottom: 0.2rem; }
        .chat-code {
          background: rgba(245,158,11,0.12);
          color: #fbbf24;
          padding: 0.05rem 0.3rem;
          border-radius: 4px;
          font-size: 0.85em;
        }

        .chat-typing {
          align-self: flex-start;
          display: flex;
          gap: 4px;
          padding: 0.85rem 1rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px 10px 10px 3px;
        }
        .chat-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          animation: chat-blink 1.2s infinite ease-in-out;
        }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chat-blink {
          0%, 80%, 100% { opacity: 0.25; }
          40% { opacity: 1; }
        }

        .chat-error {
          align-self: center;
          color: #f87171;
          font-size: 0.8rem;
          text-align: center;
          max-width: 80%;
        }

        .chat-followups {
          align-self: flex-start;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: -0.3rem;
        }
        .chat-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 1rem 1.5rem 0;
        }
        .chat-suggestion {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(232,232,240,0.7);
          font-family: 'Inconsolata', monospace;
          font-size: 0.75rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
        }
        .chat-suggestion:hover {
          color: #fbbf24;
          border-color: rgba(245,158,11,0.5);
          background: rgba(245,158,11,0.08);
        }

        .chat-composer {
          display: flex;
          gap: 0.6rem;
          padding: 1rem 1.5rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #e8e8f0;
          font-family: 'Inconsolata', monospace;
          font-size: 0.92rem;
          padding: 0.7rem 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: rgba(245,158,11,0.6); }
        .chat-input::placeholder { color: rgba(232,232,240,0.35); }

        .chat-send {
          background: #f59e0b;
          color: #080810;
          font-family: 'Inconsolata', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 8px;
          padding: 0 1.4rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .chat-send:hover:not(:disabled) { background: #fbbf24; transform: translateY(-1px); }
        .chat-send:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        @media (max-width: 500px) {
          .chat-content { padding: 1.5rem 1rem 3rem; }
          .chat-title { font-size: 1.8rem; }
          .chat-bubble { max-width: 90%; }
          .chat-clear { margin-left: 0.8rem; }
        }
      `}</style>

      <div className="chat-root">
        <Navbar />

        <div className="chat-content">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>

          <div className="chat-header">
            <div className="chat-header-left">
              <p className="chat-eyebrow">AI Assistant</p>
              <h1 className="chat-title">Ask about your money</h1>
            </div>
            {messages.length > 0 && (
              <button className="chat-clear" onClick={handleClear}>
                Clear chat
              </button>
            )}
          </div>

          <div className="chat-panel">
            <div className="chat-panel-top" />

            {messages.length === 0 && !loading && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="chat-suggestion"
                    onClick={() => handleSend(s)}
                    disabled={sending}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="chat-messages">
              {messages.length === 0 && !sending && !loading && (
                <div className="chat-empty">
                  Hi, I'm your finance assistant. Ask me anything about your spending,
                  budgets, or recurring subscriptions.
                </div>
              )}

              {messages.map((m, i) => (
                <div className={`chat-bubble ${m.role}`} key={`${i}-${m.role}`}>
                  {m.role === 'assistant' ? renderRich(m.content) : m.content}
                </div>
              ))}

              {sending && !streamingText && (
                <div className="chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}

              {streamingText !== null && (
                <div className="chat-bubble assistant">
                  {renderRich(streamingText) || '\u00a0'}
                </div>
              )}

              {!sending && followUps.length > 0 && (
                <div className="chat-followups">
                  {followUps.map((q) => (
                    <button
                      key={q}
                      className="chat-suggestion"
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="chat-error">{error}</div>}

              <div ref={bottomRef} />
            </div>

            <div className="chat-composer">
              <input
                className="chat-input"
                type="text"
                value={input}
                placeholder="Ask about your spending…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend(input)
                }}
                disabled={sending}
              />
              <button
                className="chat-send"
                onClick={() => handleSend(input)}
                disabled={sending || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Chat