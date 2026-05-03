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
  Paperclip,
  Sparkles,
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
  diet: '먹어도 되는지 물어보세요',
  business: '방향성을 물어보세요',
}

const SUGGESTIONS: Record<CoachType, string[]> = {
  diet: [
    '호텔 미팅에서 빵 바스켓이 나왔어. 한 조각 먹어도 돼?',
    '와인 시음 자리에서 풀 글라스 한 잔 OK?',
    '회식 1차 끝나고 2차 가기 전에 뭐 먹는 게 좋아?',
    '출장 호텔 조식 메뉴 중 어떤 걸 먹어야 해?',
  ],
  business: [
    '동남아 호텔 그룹 미팅 요청이 왔어. 가야 할까?',
    '신규 그랜트 5천만원짜리가 떴는데 지원해야 할까?',
    '이번주 자문 요청이 3건인데 어떻게 우선순위 정할까?',
    '이번 분기 PrivéTag 진척도 점검해줘',
  ],
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, streaming, pendingImages])

  // textarea auto-grow
  useEffect(() => {
    const t = textareaRef.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 160) + 'px'
  }, [input])

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

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if ((!text && pendingImages.length === 0) || streaming) return

    let sid = activeId
    if (!sid) sid = await createSession(type)

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

  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-10 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-5 h-5 text-stone-400" />
          <h1 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 flex-1">Coach</h1>
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 pb-44">
        {isEmpty ? (
          <EmptyState type={type} onPick={(t) => send(t)} />
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
              />
            ))}
          </div>
        )}
      </div>

      <Composer
        input={input}
        setInput={setInput}
        onKeyDown={onKeyDown}
        textareaRef={textareaRef}
        placeholder={PLACEHOLDER[type]}
        streaming={streaming}
        uploading={uploading}
        pendingImages={pendingImages}
        onAttach={() => fileRef.current?.click()}
        onRemove={removePending}
        onSend={() => send()}
        canSend={!!input.trim() || pendingImages.length > 0}
        fileRef={fileRef}
        onFiles={handleFiles}
      />

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

function EmptyState({ type, onPick }: { type: CoachType; onPick: (text: string) => void }) {
  const Icon = type === 'diet' ? Utensils : Briefcase
  const title = type === 'diet' ? '지금 이거 먹어도 될까?' : '이 방향, 맞을까?'
  const sub =
    type === 'diet'
      ? '오늘 Phase + 단식 + 식사 로그 + 맥락 룰로 즉석 판단합니다. 사진도 첨부 가능.'
      : 'freedom-plan §5 의사결정 칼 (PrivéTag·뮤즈드마레 앞당기는가)로 판단합니다.'
  return (
    <div className="max-w-2xl mx-auto pt-8">
      <div className="text-center mb-8">
        <div className="inline-flex w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-900 items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-stone-500 dark:text-stone-400" />
        </div>
        <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{title}</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 px-6 leading-relaxed">{sub}</p>
      </div>
      <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-2 px-1">예시 질문</p>
      <div className="grid grid-cols-1 gap-2">
        {SUGGESTIONS[type].map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="text-left px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-colors text-sm text-stone-700 dark:text-stone-300 leading-snug"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message, streaming }: { message: Message; streaming: boolean }) {
  const isUser = message.role === 'user'
  const imgs = parseImagePaths(message.imagePaths)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md px-4 py-2.5 text-sm leading-relaxed bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100">
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
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  // assistant: 아이콘 옆 본문 (배경 없음)
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
        <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {message.content ? (
          <div className="text-[15px] text-stone-900 dark:text-stone-100">
            <MarkdownContent text={message.content} />
            {streaming && <BlinkingCursor />}
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-stone-400 text-sm pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            생각 중…
          </span>
        )}
      </div>
    </div>
  )
}

function BlinkingCursor() {
  return (
    <span className="inline-block w-[3px] h-[1em] -mb-[2px] ml-0.5 align-text-bottom bg-emerald-500 animate-pulse" />
  )
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0 leading-7 whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-stone-900 dark:text-stone-50">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-7">{children}</li>,
        h1: ({ children }) => <h3 className="font-serif font-bold text-base mt-4 mb-2">{children}</h3>,
        h2: ({ children }) => <h3 className="font-serif font-bold text-base mt-4 mb-2">{children}</h3>,
        h3: ({ children }) => <h3 className="font-serif font-bold text-[15px] mt-3 mb-1.5">{children}</h3>,
        code: ({ children }) => (
          <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[13px] font-mono text-stone-900 dark:text-stone-100">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-900 overflow-x-auto text-[13px] font-mono">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-stone-600 dark:text-stone-400 italic">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
            {children}
          </a>
        ),
        hr: () => <hr className="my-4 border-stone-200 dark:border-stone-800" />,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="min-w-full text-[13px] border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-stone-200 dark:border-stone-700 px-2 py-1 bg-stone-50 dark:bg-stone-900 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-stone-200 dark:border-stone-700 px-2 py-1">{children}</td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

function Composer({
  input,
  setInput,
  onKeyDown,
  textareaRef,
  placeholder,
  streaming,
  uploading,
  pendingImages,
  onAttach,
  onRemove,
  onSend,
  canSend,
  fileRef,
  onFiles,
}: {
  input: string
  setInput: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  placeholder: string
  streaming: boolean
  uploading: boolean
  pendingImages: string[]
  onAttach: () => void
  onRemove: (i: number) => void
  onSend: () => void
  canSend: boolean
  fileRef: React.RefObject<HTMLInputElement | null>
  onFiles: (f: FileList | null) => void
}) {
  return (
    <div className="fixed bottom-20 inset-x-0 px-3 pb-2 pt-3 bg-background/85 backdrop-blur-md border-t border-stone-200/50 dark:border-stone-800/50">
      <div className="mx-auto max-w-2xl">
        {pendingImages.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {pendingImages.map((p, i) => (
              <div key={p} className="relative shrink-0">
                <Image
                  src={p}
                  alt="첨부 이미지"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                  unoptimized
                />
                <button
                  onClick={() => onRemove(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center"
                  aria-label="삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-sm">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={streaming}
            className="w-full px-4 pt-3 pb-2 bg-transparent text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-400 resize-none focus:outline-none"
            style={{ minHeight: '44px', maxHeight: '160px' }}
          />
          <div className="flex items-center justify-between px-2 py-2 border-t border-stone-100 dark:border-stone-800/50">
            <button
              onClick={onAttach}
              disabled={uploading || streaming}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
              aria-label="사진 첨부"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <button
              onClick={onSend}
              disabled={!canSend || streaming}
              className="h-9 px-3.5 flex items-center gap-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium disabled:opacity-30 transition-opacity"
            >
              {streaming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  답변 중
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  보내기
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-stone-400 text-center mt-1.5">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>
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
