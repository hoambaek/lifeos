#!/bin/bash
# 매일 새벽 1시 실행: hub 작업 내용을 정리하여 lifeos에 동기화 후 커밋/푸시
# crontab: 0 1 * * * /Users/hoambaek/Documents/Cursor/lifeos/scripts/daily-sync.sh

set -e

HUB_DIR="/Users/hoambaek/Documents/Cursor/hub"
LIFEOS_DIR="/Users/hoambaek/Documents/Cursor/lifeos"
SYNC_FILE="$LIFEOS_DIR/src/data/hub-tasks.json"
DATE=$(date +%Y-%m-%d)
GIT=/usr/bin/git

# hub의 team-status 파일에서 작업 항목 추출
extract_tasks() {
  local dir="$HUB_DIR/context/team-status"
  local result="["
  local first=true

  for file in "$dir"/*.md; do
    [ -f "$file" ] || continue
    local name=$(basename "$file" .md | sed 's/-status$//')

    # 팀 이름 매핑
    case "$name" in
      patent) team="특허" ;;
      gov-support) team="지원사업" ;;
      privetag) team="프리베태그" ;;
      musedemaree) team="뮤즈드마레" ;;
      marketing) team="마케팅" ;;
      brand-design) team="브랜드디자인" ;;
      investment) team="투자유치" ;;
      singapore) team="싱가폴" ;;
      rnd) team="R&D" ;;
      management) team="경영" ;;
      *) team="$name" ;;
    esac

    # 미완료 작업 추출 (- [ ] 패턴)
    while IFS= read -r line; do
      task=$(echo "$line" | sed 's/^- \[ \] //')
      if [ "$first" = true ]; then
        first=false
      else
        result+=","
      fi
      # JSON 이스케이프
      task=$(echo "$task" | sed 's/"/\\"/g')
      result+="{\"team\":\"$team\",\"task\":\"$task\"}"
    done < <(grep '^- \[ \]' "$file" 2>/dev/null || true)
  done

  # shared 파일에서도 추출
  for file in "$HUB_DIR/context/shared"/*.md; do
    [ -f "$file" ] || continue
    while IFS= read -r line; do
      task=$(echo "$line" | sed 's/^- \[ \] //')
      if [ "$first" = true ]; then
        first=false
      else
        result+=","
      fi
      task=$(echo "$task" | sed 's/"/\\"/g')
      result+="{\"team\":\"전사\",\"task\":\"$task\"}"
    done < <(grep '^- \[ \]' "$file" 2>/dev/null || true)
  done

  result+="]"
  echo "$result"
}

# data 디렉토리 생성
mkdir -p "$LIFEOS_DIR/src/data"

# 작업 추출 및 저장
TASKS=$(extract_tasks)
cat > "$SYNC_FILE" << JSONEOF
{
  "updatedAt": "$DATE",
  "tasks": $TASKS
}
JSONEOF

# git 커밋 & 푸시
cd "$LIFEOS_DIR"
$GIT add src/data/hub-tasks.json
if $GIT diff --cached --quiet; then
  echo "[$DATE] 변경사항 없음"
else
  $GIT commit -m "chore: 일일 hub 작업 동기화 ($DATE)"
  $GIT push origin main
  echo "[$DATE] 동기화 완료"
fi
