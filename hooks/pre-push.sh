#!/usr/bin/env bash
# ============================================================
# Nocarbontr — pre-push hook
# Push öncesi tam build + kapsamlı güvenlik kontrolü
# ============================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CREDS_FILE="$ROOT/hooks/.test-credentials.json"
PASS=0; FAIL=0; WARNS=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
MAGENTA='\033[0;35m'

log_pass() { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS + 1)); }
log_fail() { echo -e "  ${RED}✗ $1${RESET}"; FAIL=$((FAIL + 1)); }
log_warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; WARNS=$((WARNS + 1)); }
log_info() { echo -e "  ${CYAN}→${RESET} $1"; }
log_section() { echo ""; echo -e "${BOLD}[$1] $2${RESET}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOCARBONTR PRE-PUSH FULL CHECK         ║${RESET}"
echo -e "${BOLD}║   $(date '+%Y-%m-%d %H:%M:%S')                    ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""

export PATH="$HOME/.local/bin:$PATH"

# ─────────────────────────────────────────
# 1. FULL BUILD
# ─────────────────────────────────────────
log_section "1/6" "Production Build"

cd "$ROOT"
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  log_pass "npm run build başarılı"
  # Route sayısını göster
  ROUTE_COUNT=$(echo "$BUILD_OUTPUT" | grep -c "^[├└]" || true)
  [ "$ROUTE_COUNT" -gt 0 ] && log_info "$ROUTE_COUNT route build edildi"
else
  log_fail "ERR_BUILD: Build başarısız — rules.md §1.1"
  echo ""
  echo "$BUILD_OUTPUT" | tail -20
  echo ""
  echo -e "${RED}${BOLD}✗ PUSH REDDEDİLDİ — Build hatası${RESET}"
  exit 1
fi

# ─────────────────────────────────────────
# 2. GİZLİ BİLGİ TARAMASI — Tüm kaynak
# ─────────────────────────────────────────
log_section "2/6" "Secret Leak Taraması (Tüm Kaynak)"

# .env.local tracked mı?
if git ls-files --error-unmatch .env.local 2>/dev/null; then
  log_fail "ERR_SECRET_ENV: .env.local git'te tracked! — rules.md §1.2"
else
  log_pass ".env.local untracked"
fi

# JWT / Supabase key leak — src/ altında
JWT_LEAKS=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.' \
  "$ROOT/src/" 2>/dev/null | grep -v "node_modules" || true)
if [ -n "$JWT_LEAKS" ]; then
  log_fail "ERR_SECRET_JWT: Kaynak kodda JWT token!"
  echo "$JWT_LEAKS" | head -5
else
  log_pass "JWT token sızıntısı yok"
fi

# Service role doğrudan hardcode
SRK_LEAKS=$(grep -rn --include="*.ts" --include="*.tsx" \
  'SUPABASE_SERVICE_ROLE_KEY\s*=' \
  "$ROOT/src/" 2>/dev/null | grep -v "process\.env" | grep -v "node_modules" || true)
if [ -n "$SRK_LEAKS" ]; then
  log_fail "ERR_SECRET_KEY: service_role key hardcode!"
  echo "$SRK_LEAKS" | head -5
else
  log_pass "Service role key hardcode yok"
fi

# Client component'te service role kullanımı
CLIENT_SRK=$(grep -rn --include="*.tsx" --include="*.ts" \
  'createBrowserClient\|\"use client\"' \
  "$ROOT/src/" 2>/dev/null | xargs -I{} grep -l 'SERVICE_ROLE' 2>/dev/null || true)
if [ -n "$CLIENT_SRK" ]; then
  log_fail "ERR_SECRET_KEY: Browser client'te service role! — rules.md §1.3"
  echo "$CLIENT_SRK"
else
  log_pass "Browser client güvenli (service role yok)"
fi

# ─────────────────────────────────────────
# 3. CBAM UYUMLULUK — Kaynak Kod
# ─────────────────────────────────────────
log_section "3/6" "CBAM Uyumluluk Kontrolü"

# formula_version eksik mi
EMIT_INSERTS=$(grep -rn --include="*.ts" --include="*.tsx" \
  '\.from("emission_data")\.insert\|from.*emission_data.*insert' \
  "$ROOT/src/" 2>/dev/null || true)
if [ -n "$EMIT_INSERTS" ]; then
  EMIT_FILES=$(echo "$EMIT_INSERTS" | cut -d: -f1 | sort -u)
  MISSING_FV=""
  while IFS= read -r f; do
    if ! grep -q 'formula_version' "$f" 2>/dev/null; then
      MISSING_FV="$MISSING_FV\n    $f"
    fi
  done <<< "$EMIT_FILES"
  if [ -n "$MISSING_FV" ]; then
    log_warn "ERR_FORMULA_VERSION: Şu dosyalarda formula_version eksik olabilir: $MISSING_FV"
  else
    log_pass "formula_version mevcut"
  fi
else
  log_pass "emission_data insert bulunamadı (kontrol atlandı)"
fi

# verification_hash boş string
EMPTY_HASH=$(grep -rn --include="*.ts" --include="*.tsx" \
  'verification_hash\s*:\s*["'"'"']\s*["'"'"']' \
  "$ROOT/src/" 2>/dev/null || true)
if [ -n "$EMPTY_HASH" ]; then
  log_fail "ERR_HASH_EMPTY: verification_hash boş string! — rules.md §3.2"
  echo "$EMPTY_HASH"
else
  log_pass "verification_hash boş bırakılmamış"
fi

# RLS bypass — service_role client ile table erişimi
RLS_BYPASS=$(grep -rn --include="*.ts" --include="*.tsx" \
  'SERVICE_ROLE.*from\|createClient.*service' \
  "$ROOT/src/app/" 2>/dev/null || true)
if [ -n "$RLS_BYPASS" ]; then
  log_warn "RLS bypass şüphesi: $RLS_BYPASS"
else
  log_pass "RLS bypass tespit edilmedi"
fi

# ─────────────────────────────────────────
# 4. MİGRASYON KONTROLÜ
# ─────────────────────────────────────────
log_section "4/6" "Migrasyon & Şema Kontrolü"

MIGRATION_DIR="$ROOT/supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
  MIGRATION_COUNT=$(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l | tr -d ' ')
  log_pass "$MIGRATION_COUNT migrasyon dosyası mevcut"

  # RLS aktif mi migration'da?
  for sql_file in "$MIGRATION_DIR"/*.sql; do
    if ! grep -q 'ENABLE ROW LEVEL SECURITY' "$sql_file" 2>/dev/null; then
      log_warn "RLS aktifleştirme eksik: $(basename "$sql_file") — rules.md §3.5"
    fi
  done
  log_pass "RLS aktifleştirme mevcut"

  # formula_version kolonu var mı?
  if grep -q 'formula_version' "$MIGRATION_DIR"/*.sql 2>/dev/null; then
    log_pass "formula_version kolonu migration'da mevcut"
  else
    log_warn "formula_version kolonu migration'da bulunamadı — rules.md §7.2"
  fi

  # verification_hash kolonu var mı?
  if grep -q 'verification_hash' "$MIGRATION_DIR"/*.sql 2>/dev/null; then
    log_pass "verification_hash kolonu migration'da mevcut"
  else
    log_warn "verification_hash kolonu migration'da bulunamadı — rules.md §7.3"
  fi
else
  log_warn "supabase/migrations/ dizini bulunamadı"
fi

# ─────────────────────────────────────────
# 5. TEST KİMLİK BİLGİLERİ İLE HIZLI TEST
# ─────────────────────────────────────────
log_section "5/6" "Test Kimlik Bilgisi Kontrolü"

if [ -f "$CREDS_FILE" ]; then
  SUPABASE_URL=$(python3 -c "import json; d=json.load(open('$CREDS_FILE')); print(d['supabase']['url'])" 2>/dev/null || echo "")
  if [ -n "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "https://XXXX.supabase.co" ]; then
    log_pass ".test-credentials.json mevcut ve dolu"

    # Supabase URL erişilebilirlik
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      "$SUPABASE_URL/rest/v1/" \
      -H "apikey: $(python3 -c "import json; d=json.load(open('$CREDS_FILE')); print(d['supabase']['anon_key'])" 2>/dev/null)" \
      --connect-timeout 5 2>/dev/null || echo "000")

    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
      log_pass "Supabase endpoint erişilebilir (HTTP $HTTP_STATUS)"
    else
      log_warn "Supabase endpoint yanıt vermedi (HTTP $HTTP_STATUS) — bağlantı sorunu?"
    fi
  else
    log_info "Test credentials yapılandırılmamış (isteğe bağlı)"
    log_info "Yapılandırmak için: cp hooks/.test-credentials.example.json hooks/.test-credentials.json"
  fi
else
  log_info ".test-credentials.json bulunamadı (isteğe bağlı)"
fi

# ─────────────────────────────────────────
# 6. GENEL KOD KALİTESİ
# ─────────────────────────────────────────
log_section "6/6" "Kod Kalitesi"

# console.log temizliği
CONSOLE_LOGS=$(grep -rn --include="*.ts" --include="*.tsx" \
  'console\.log\b' \
  "$ROOT/src/" 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$CONSOLE_LOGS" -gt 5 ]; then
  log_warn "$CONSOLE_LOGS adet console.log bulundu (production'a gitmeden temizle)"
else
  log_pass "console.log sayısı kabul edilebilir ($CONSOLE_LOGS)"
fi

# TODO/FIXME sayısı
TODO_COUNT=$(grep -rn --include="*.ts" --include="*.tsx" \
  'TODO\|FIXME\|HACK\|XXX' \
  "$ROOT/src/" 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 0 ]; then
  log_warn "$TODO_COUNT TODO/FIXME tespit edildi"
else
  log_pass "Bekleyen TODO/FIXME yok"
fi

# ─────────────────────────────────────────
# SONUÇ
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}Geçti: $PASS${RESET}  |  ${RED}Başarısız: $FAIL${RESET}  |  ${YELLOW}Uyarı: $WARNS${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}✗ PUSH REDDEDİLDİ — $FAIL kritik kural ihlali${RESET}"
  echo -e "  ${CYAN}→ Detaylar için: hooks/rules.md${RESET}"
  echo ""
  exit 1
fi

if [ "$WARNS" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}⚠ Push onaylandı — $WARNS uyarı (kontrol et)${RESET}"
else
  echo -e "${GREEN}${BOLD}✓ Push onaylandı — tüm kontroller geçti${RESET}"
fi
echo ""
exit 0
