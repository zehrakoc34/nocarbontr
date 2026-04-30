#!/usr/bin/env bash
# ============================================================
# Nocarbontr — watch.sh
# Dosya değişikliklerini izler, ilgili kontrolü tetikler.
# Kullanım: ./hooks/watch.sh
# Çıkmak için: Ctrl+C
# ============================================================

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HOOKS="$ROOT/hooks"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

export PATH="$HOME/.local/bin:$PATH"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOCARBONTR FILE WATCHER                ║${RESET}"
echo -e "${BOLD}║   Ctrl+C ile durdur                      ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""

# Bağımlılık kontrolü
check_dep() {
  command -v "$1" &>/dev/null && return 0
  echo -e "${YELLOW}⚠ '$1' kurulu değil${RESET}"
  return 1
}

# ─── fswatch yoksa polling ile izle ───
run_with_polling() {
  echo -e "${CYAN}→ Polling modu (2 saniye aralık)${RESET}"
  echo ""

  LAST_HASH=""
  LAST_MIGRATION_HASH=""

  while true; do
    # src/ değişikliği
    CURRENT_HASH=$(find "$ROOT/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
      sort | xargs md5 2>/dev/null | md5 2>/dev/null || echo "")

    if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
      echo -e "\n${CYAN}[$(date '+%H:%M:%S')] Kaynak kod değişti — TypeScript kontrolü...${RESET}"
      if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo -e "  ${GREEN}✓ TypeScript OK${RESET}"
      else
        echo -e "  ${RED}✗ TypeScript hataları var${RESET}"
        echo -e "  ${CYAN}→ Detay: npx tsc --noEmit${RESET}"
      fi
      LAST_HASH="$CURRENT_HASH"
    fi

    [ -z "$LAST_HASH" ] && LAST_HASH="$CURRENT_HASH"

    # supabase/migrations/ değişikliği
    CURRENT_MIG=$(find "$ROOT/supabase/migrations" -name "*.sql" 2>/dev/null | \
      sort | xargs md5 2>/dev/null | md5 2>/dev/null || echo "")

    if [ "$CURRENT_MIG" != "$LAST_MIGRATION_HASH" ] && [ -n "$LAST_MIGRATION_HASH" ]; then
      echo -e "\n${CYAN}[$(date '+%H:%M:%S')] Migration değişti — RLS kontrolü...${RESET}"

      # RLS hızlı kontrol
      MIGRATION_FILES=$(find "$ROOT/supabase/migrations" -name "*.sql" 2>/dev/null)
      RLS_OK=true
      for f in $MIGRATION_FILES; do
        if ! grep -q 'ENABLE ROW LEVEL SECURITY' "$f"; then
          echo -e "  ${RED}✗ RLS eksik: $(basename "$f")${RESET}"
          RLS_OK=false
        fi
      done
      [ "$RLS_OK" = true ] && echo -e "  ${GREEN}✓ RLS politikaları mevcut${RESET}"
      LAST_MIGRATION_HASH="$CURRENT_MIG"
    fi
    [ -z "$LAST_MIGRATION_HASH" ] && LAST_MIGRATION_HASH="$CURRENT_MIG"

    sleep 2
  done
}

# ─── fswatch varsa event-driven izle ───
run_with_fswatch() {
  echo -e "${GREEN}→ fswatch ile event-driven izleme aktif${RESET}"
  echo ""
  echo -e "  İzlenen: ${CYAN}src/**/*.ts(x)${RESET}  |  ${CYAN}supabase/migrations/*.sql${RESET}"
  echo ""

  fswatch -r -e ".*" -i "\\.tsx?$" -i "\\.sql$" "$ROOT/src" "$ROOT/supabase" 2>/dev/null | \
  while read -r changed_file; do
    timestamp=$(date '+%H:%M:%S')

    if [[ "$changed_file" == *.ts || "$changed_file" == *.tsx ]]; then
      echo -e "\n${CYAN}[$timestamp]${RESET} Değişti: ${BOLD}$(basename "$changed_file")${RESET}"

      # Lib/supabase değişikliği → secret kontrolü
      if [[ "$changed_file" == *"/lib/supabase/"* ]]; then
        echo -e "  ${YELLOW}→ Supabase client değişikliği tespit edildi — secret kontrolü...${RESET}"
        if grep -q 'SERVICE_ROLE' "$changed_file" 2>/dev/null; then
          echo -e "  ${RED}✗ ERR_SECRET_KEY: service_role key kullanımı${RESET}"
        elif grep -qE 'eyJhbGci' "$changed_file" 2>/dev/null; then
          echo -e "  ${RED}✗ ERR_SECRET_JWT: JWT token tespit edildi${RESET}"
        else
          echo -e "  ${GREEN}✓ Güvenlik OK${RESET}"
        fi
      fi

      # TypeScript hızlı check
      if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo -e "  ${GREEN}✓ TypeScript OK${RESET}"
      else
        echo -e "  ${RED}✗ TypeScript hatası${RESET} — npx tsc --noEmit"
      fi

    elif [[ "$changed_file" == *.sql ]]; then
      echo -e "\n${CYAN}[$timestamp]${RESET} Migration değişti: ${BOLD}$(basename "$changed_file")${RESET}"
      if grep -q 'ENABLE ROW LEVEL SECURITY' "$changed_file" 2>/dev/null; then
        echo -e "  ${GREEN}✓ RLS aktif${RESET}"
      else
        echo -e "  ${YELLOW}⚠ RLS eksik — rules.md §7.1${RESET}"
      fi
      if grep -q 'formula_version' "$changed_file" 2>/dev/null; then
        echo -e "  ${GREEN}✓ formula_version mevcut${RESET}"
      else
        echo -e "  ${YELLOW}⚠ formula_version kolonu eksik — rules.md §7.2${RESET}"
      fi
    fi
  done
}

# fswatch varsa kullan, yoksa polling
if check_dep fswatch; then
  run_with_fswatch
else
  echo -e "${YELLOW}⚠ fswatch kurulu değil — polling modu kullanılacak${RESET}"
  echo -e "  Daha iyi deneyim için: brew install fswatch"
  echo ""
  run_with_polling
fi
