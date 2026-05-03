'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MessageCircle,
  Utensils,
  Briefcase,
  Plus,
  Send,
  Trash2,
  History,
  X,
  Loader2,
  ImagePlus,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThemeToggle } from '@/components/ThemeToggle'

type CoachType = 'diet' | 'business'

interface SessionSummary {
  id: number
  type: CoachType
  title: string
  messageCount: number
  updatedAt: string
}

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  imagePaths?: string[] | null
}

const PLACEHOLDER: Record<CoachType, string> = {
  diet: '예: "호텔 미팅에서 빵 바스켓 나왔는데 먹어도 돼?" (사진도 첨부 가능)',
  business: '예: "Sukosol 호텔 디지털 담당이 미팅 잡자는데 가야 해?"',
}

function parseImagePaths(raw: unknown): string[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw)
      return Array.isArray(v) ? v : null
    } catch {
      return null
    }
  }
  return null
}

export default function CoachPage() {
  const [type, setType] = useState<CoachType>('diet')
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadSessions = useCallback(async (t: CoachType) => {
    const res = await fetch(`/api/sessions?type=${t}`)
    const data: SessionSummary[] = await res.json()
    setSessions(data)
    return data
  }, [])

  const loadSessionMessages = useCallback(async (id: number) => {
    const res = await fetch(`/api/sessions/${id}`)
    const data = await res.json()
    setMessages(
      data.messages.map((m: { id: number; role: string; content: string; imagePaths?: string | null }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        imagePaths: parseImagePaths(m.imagePaths),
      })),
    )
  }, [])

  const createSession = useCallback(async (t: CoachType) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: t }),
    })
    const s = await res.json()
    setActiveId(s.id)
    setMessages([])
    await loadSessions(t)
    return s.id as number
  }, [loadSessions])

  const deleteSession = useCallback(async (id: number) => {
    if (!confirm('이 대화를 삭제할까요?')) return
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    const remaining = await loadSessions(type)
    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id)
        await loadSessionMessages(remaining[0].id)
      } else {
        setActiveId(null)
        setMessages([])
      }
    }
  }, [activeId, type, loadSessions, loadSessionMessages])

  useEffect(() => {
    (async () => {
      const list = await loadSessions(type)
      if (list.length > 0) {
        setActiveId(list[0].id)
        await loadSessionMessages(list[0].id)
      } else {
        setActiveId(null)
        setMessages([])
      }
      setPendingImages([])
    })()
  }, [type, loadSessions, loadSessionMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streaming, pendingImages])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          alert(err.error || '업로드 실패')
          continue
        }
        const data = await res.json()
        setPendingImages((prev) => [...prev, data.path])
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

  const removePending = (i: number) => {
    setPendingImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  const send = useCallback(async () => {
    const text = input.trim()
    if ((!text && pendingImages.length === 0) || streaming) return

    let sid = activeId
    if (!sid) {
      sid = await createSession(type)
    }

    const sentImages = pendingImages
    setInput('')
    setPendingImages([])
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, imagePaths: sentImages.length ? sentImages : null },
      { role: 'assistant', content: '' },
    ])
    setStreaming(true)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, content: text, imagePaths: sentImages }),
      })
      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: acc }
          return next
        })
      }
    } catch (e) {
      console.error('Stream failed:', e)
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: '⚠️ 응답 실패. 다시 시도해주세요.' }
        return next
      })
    } finally {
      setStreaming(false)
      await loadSessions(type)
    }
  }, [input, pendingImages, streaming, activeId, type, createSession, loadSessions])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const TypeTab = ({ t, label, Icon }: { t: CoachType; label: string; Icon: typeof Utensils }) => {
    const active = type === t
    return (
      <button
        onClick={() => setType(t)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-12 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-6 h-6 text-stone-400" />
          <h1 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 flex-1">Coach</h1>
          <button
            onClick={() => setShowHistory(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="대화 목록"
          >
            <History className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900">
          <TypeTab t="diet" label="식이 코치" Icon={Utensils} />
          <TypeTab t="business" label="사업 코치" Icon={Briefcase} />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-40">
        {messages.length === 0 && (
          <div className="pt-12 text-center">
            <p className="text-5xl mb-3">{type === 'diet' ? '🍽️' : '💼'}</p>
            <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              {type === 'diet' ? '지금 이거 먹어도 될까?' : '이 방향, 맞을까?'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 px-6 leading-relaxed">
              {type === 'diet'
                ? '오늘 Phase + 맥락 룰로 즉석 판단합니다. 사진을 첨부해 메뉴를 보여줘도 됩니다.'
                : 'freedom-plan §5 의사결정 칼로 판단합니다.'}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m}
            streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
      </div>

      {/* Composer */}
      <div className="fixed bottom-20 inset-x-0 px-4 pb-2 pt-2 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-md">
          {pendingImages.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {pendingImages.map((p, i) => (
                <div key={p} className="relative shrink-0">
                  <Image
                    src={p}
                    alt="첨부 이미지"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                    unoptimized
                  />
                  <button
                    onClick={() => removePending(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center"
                    aria-label="삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 p-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || streaming}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors shrink-0"
              aria-label="사진 첨부"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={PLACEHOLDER[type]}
              rows={1}
              disabled={streaming}
              className="flex-1 px-2 py-1.5 bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 resize-none focus:outline-none max-h-32"
              style={{ minHeight: '32px' }}
            />
            <button
              onClick={send}
              disabled={(!input.trim() && pendingImages.length === 0) || streaming}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 disabled:opacity-30 transition-opacity shrink-0"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showHistory && (
        <HistoryPanel
          sessions={sessions}
          activeId={activeId}
          type={type}
          onClose={() => setShowHistory(false)}
          onSelect={async (id) => {
            setActiveId(id)
            await loadSessionMessages(id)
            setShowHistory(false)
          }}
          onCreate={async () => {
            await createSession(type)
            setShowHistory(false)
          }}
          onDelete={deleteSession}
        />
      )}
    </div>
  )
}

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === 'user'
  const imgs = parseImagePaths(message.imagePaths)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
        }`}
      >
        {imgs && imgs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {imgs.map((p) => (
              <Image
                key={p}
                src={p}
                alt="첨부 이미지"
                width={200}
                height={200}
                className="rounded-lg max-w-[200px] max-h-[200px] object-cover"
                unoptimized
              />
            ))}
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownContent text={message.content} />
        )}
        {streaming && message.content === '' && (
          <span className="inline-flex items-center text-stone-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </span>
        )}
      </div>
    </div>
  )
}

function MarkdownContent({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="prose-coach">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0 whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-stone-900 dark:text-stone-100">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h3 className="font-serif font-bold text-base mt-2 mb-1">{children}</h3>,
          h2: ({ children }) => <h3 className="font-serif font-bold text-base mt-2 mb-1">{children}</h3>,
          h3: ({ children }) => <h3 className="font-serif font-bold text-sm mt-2 mb-1">{children}</h3>,
          code: ({ children }) => (
            <code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-[12px] font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-stone-300 dark:border-stone-600 pl-3 my-1.5 text-stone-600 dark:text-stone-400">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline text-emerald-600 dark:text-emerald-400">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function HistoryPanel({
  sessions, activeId, type, onClose, onSelect, onCreate, onDelete,
}: {
  sessions: SessionSummary[]
  activeId: number | null
  type: CoachType
  onClose: () => void
  onSelect: (id: number) => void
  onCreate: () => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-stone-950 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <h2 className="font-serif text-lg font-bold">
            {type === 'diet' ? '식이 코치 대화' : '사업 코치 대화'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onCreate}
          className="mx-3 mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          새 대화
        </button>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 && (
            <p className="text-center text-sm text-stone-400 py-12">아직 대화가 없어요</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-colors cursor-pointer ${
                s.id === activeId
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900'
                  : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900'
              }`}
              onClick={() => onSelect(s.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{s.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {s.messageCount}개 메시지 · {format(new Date(s.updatedAt), 'M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(s.id)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
