import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const HUB_ROOT = '/Users/hoambaek/Documents/Cursor/hub'
const TEAM_STATUS_DIR = path.join(HUB_ROOT, 'context/team-status')
const SHARED_DIR = path.join(HUB_ROOT, 'context/shared')

function readMdFiles(dir: string): { name: string; content: string }[] {
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
    return files.map((f) => ({
      name: f.replace('.md', ''),
      content: fs.readFileSync(path.join(dir, f), 'utf-8'),
    }))
  } catch {
    return []
  }
}

function extractTasks(content: string): string[] {
  const tasks: string[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const match = line.match(/^-\s*\[\s*\]\s*(.+)/)
    if (match) tasks.push(match[1].trim())
  }
  return tasks
}

function extractIssues(content: string): string[] {
  const issues: string[] = []
  const lines = content.split('\n')
  let inIssueSection = false
  for (const line of lines) {
    if (line.includes('주요 이슈')) {
      inIssueSection = true
      continue
    }
    if (inIssueSection && line.startsWith('#')) break
    if (inIssueSection && line.startsWith('-') && !line.includes('없음')) {
      issues.push(line.replace(/^-\s*/, '').trim())
    }
  }
  return issues
}

function extractMilestones(content: string): string[] {
  const milestones: string[] = []
  const lines = content.split('\n')
  let inSection = false
  for (const line of lines) {
    if (line.includes('마일스톤') || line.includes('일정')) {
      inSection = true
      continue
    }
    if (inSection && line.startsWith('#')) break
    if (inSection && line.startsWith('-') && !line.includes('확인 필요')) {
      milestones.push(line.replace(/^-\s*/, '').trim())
    }
  }
  return milestones
}

function getTeamLabel(name: string): string {
  const map: Record<string, string> = {
    'patent-status': '특허',
    'gov-support-status': '지원사업',
    'privetag-status': '프리베태그',
    'musedemaree-status': '뮤즈드마레',
    'marketing-status': '마케팅',
    'brand-design-status': '브랜드디자인',
    'investment-status': '투자유치',
    'singapore-status': '싱가폴',
    'rnd-status': 'R&D',
    'management-status': '경영',
  }
  return map[name] || name
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'deep_work'

  const teamFiles = readMdFiles(TEAM_STATUS_DIR)
  const sharedFiles = readMdFiles(SHARED_DIR)

  const allTasks: { team: string; task: string; priority: 'high' | 'medium' | 'low' }[] = []
  const allIssues: { team: string; issue: string }[] = []
  const allMilestones: { team: string; milestone: string }[] = []

  for (const file of teamFiles) {
    const team = getTeamLabel(file.name)
    const tasks = extractTasks(file.content)
    const issues = extractIssues(file.content)
    const milestones = extractMilestones(file.content)

    tasks.forEach((task) => allTasks.push({ team, task, priority: 'medium' }))
    issues.forEach((issue) => allIssues.push({ team, issue }))
    milestones.forEach((milestone) => allMilestones.push({ team, milestone }))
  }

  for (const file of sharedFiles) {
    const tasks = extractTasks(file.content)
    tasks.forEach((task) => allTasks.push({ team: '전사', task, priority: 'high' }))
  }

  let recommendations: { label: string; items: { team: string; text: string }[] }[] = []

  switch (type) {
    case 'deep_work':
      recommendations = [
        {
          label: '전사 핵심 과제',
          items: allTasks
            .filter((t) => t.priority === 'high')
            .map((t) => ({ team: t.team, text: t.task })),
        },
        {
          label: '팀별 주요 작업',
          items: allTasks
            .filter((t) => t.priority === 'medium')
            .slice(0, 10)
            .map((t) => ({ team: t.team, text: t.task })),
        },
        {
          label: '해결 필요 이슈',
          items: allIssues.map((i) => ({ team: i.team, text: i.issue })),
        },
      ]
      break

    case 'reactive_work':
      recommendations = [
        {
          label: '처리할 업무',
          items: allTasks
            .filter((t) =>
              /정리|확인|입력|조사|리스트|업데이트/.test(t.task)
            )
            .map((t) => ({ team: t.team, text: t.task })),
        },
        {
          label: '팀 이슈 확인',
          items: allIssues.map((i) => ({ team: i.team, text: i.issue })),
        },
      ]
      break

    case 'skill_work':
      recommendations = [
        {
          label: '기술/개발 작업',
          items: allTasks
            .filter((t) =>
              /개발|구축|설계|분석|작성|모델/.test(t.task)
            )
            .map((t) => ({ team: t.team, text: t.task })),
        },
        {
          label: '다음 마일스톤',
          items: allMilestones.map((m) => ({ team: m.team, text: m.milestone })),
        },
      ]
      break

    case 'brain_log':
      recommendations = [
        {
          label: '오늘 진행한 작업 확인',
          items: allTasks.slice(0, 5).map((t) => ({ team: t.team, text: t.task })),
        },
        {
          label: '내일 집중할 과제 후보',
          items: allTasks
            .filter((t) => t.priority === 'high')
            .concat(allTasks.filter((t) => t.priority === 'medium').slice(0, 3))
            .map((t) => ({ team: t.team, text: t.task })),
        },
      ]
      break
  }

  // 빈 섹션 제거
  recommendations = recommendations.filter((r) => r.items.length > 0)

  return NextResponse.json({ type, recommendations })
}
