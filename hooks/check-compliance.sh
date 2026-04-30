#!/usr/bin/env bash
# ============================================================
# Nocarbontr — check-compliance.sh
# Tek seferlik veya CI'da çalıştırılabilir kapsamlı kontrol.
# Çıktı: PASS / WARN / FAIL satırları + özet rapor
# ============================================================
set -euo pipefail

ROOT="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
REPORT_FILE="$ROOT/hooks/.last-compliance-report.txt"
CREDS_FILE="$ROOT/hooks/.test-credentials.json"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

PASS=0; FAIL=0; WARNS=0
REPORT_LINES=()

pass()  { echo -e "  ${GREEN}PASS${RESET}  $1"; REPORT_LINES+=("PASS  $1"); PASS=$((PASS + 1)); }
fail()  { echo -e "  ${RED}FAIL${RESET}  $1"; REPORT_LINES+=("FAIL  $1"); FAIL=$((FAIL + 1)); }
warn()  { echo -e "  ${YELLOW}WARN${RESET}  $1"; REPORT_LINES+=("WARN  $1"); WARNS=$((WARNS + 1)); }
info()  { echo -e "  ${CYAN}INFO${RESET}  $1"; }
title() { echo ""; echo -e "${BOLD}══ $1 ══${RESET}"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOCARBONTR COMPLIANCE CHECK                ║${RESET}"
echo -e "${BOLD}║   $(date '+%Y-%m-%d %H:%M:%S')                      ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""
info "Proje kökü: $ROOT"

export PATH="$HOME/.local/bin:$PATH"

# ══════════════════════════════════════
# A. GÜVENLİK
# ══════════════════════════════════════
title "A. Güvenlik & Secret Yönetimi"

# .env.local git-tracked değil
if git -C "$ROOT" ls-files --error-unmatch .env.local 2>/dev/null; then
  fail "ERR_SECRET_ENV: .env.local git'te izleniyor"
else
  pass ".env.local untracked"
fi

# Kaynak kodda JWT yok
JWT_COUNT=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.' \
  "$ROOT/src/" 2>/dev/null | grep -cv "node_modules" || true)
[ "$JWT_COUNT" -eq 0 ] && pass "JWT token kaynak kodda yok" || fail "ERR_SECRET_JWT: $JWT_COUNT yerde JWT token"

# createBrowserClient sadece ANON_KEY kullanıyor
BROWSER_SRK=$(grep -rn --include="*.ts" --include="*.tsx" \
  'createBrowserClient' "$ROOT/src/" 2>/dev/null | grep 'SERVICE_ROLE' || true)
[ -z "$BROWSER_SRK" ] && pass "Browser client: yalnızca ANON_KEY" || fail "ERR_SECRET_KEY: Browser client'te service role key"

# ══════════════════════════════════════
# B. CBAM FORMÜL VERSİYONLAMA (nctr_1.md §7.2)
# ══════════════════════════════════════
title "B. CBAM Formül Versiyonlama"

# Migration'da formula_version kolonu var mı
if ls "$ROOT/supabase/migrations/"*.sql 2>/dev/null | xargs grep -l 'formula_version' &>/dev/null; then
  pass "formula_version kolonu migration'da mevcut"
else
  fail "ERR_FORMULA_VERSION: formula_version migration'da bulunamadı"
fi

# Src'de emission_data insert varsa formula_version içermeli
EMIT_INSERT_FILES=$(grep -rl --include="*.ts" --include="*.tsx" \
  'emission_data.*insert\|\.insert.*emission' \
  "$ROOT/src/" 2>/dev/null || true)
if [ -n "$EMIT_INSERT_FILES" ]; then
  ALL_HAVE_FV=true
  while IFS= read -r f; do
    if ! grep -q 'formula_version' "$f"; then
      warn "ERR_FORMULA_VERSION: $f — formula_version eksik"
      ALL_HAVE_FV=false
    fi
  done <<< "$EMIT_INSERT_FILES"
  [ "$ALL_HAVE_FV" = true ] && pass "Tüm emission insert'lerde formula_version var"
fi

# Desteklenen versiyonlar: v1, v2, ...
FV_UNKNOWN=$(grep -rn --include="*.ts" --include="*.tsx" \
  "formula_version.*['\"]" "$ROOT/src/" 2>/dev/null | \
  grep -Ev "formula_version.*['\"]v[0-9]+['\"]" | \
  grep -v "formula_version.*process.env" || true)
[ -z "$FV_UNKNOWN" ] && pass "formula_version değerleri geçerli format" || warn "Geçersiz formula_version format: $FV_UNKNOWN"

# ══════════════════════════════════════
# C. KANIT BÜTÜNLÜĞÜ (nctr_1.md §7.3)
# ══════════════════════════════════════
title "C. Kanıt Bütünlüğü"

if ls "$ROOT/supabase/migrations/"*.sql 2>/dev/null | xargs grep -l 'verification_hash' &>/dev/null; then
  pass "verification_hash kolonu migration'da mevcut"
else
  fail "ERR_HASH_EMPTY: verification_hash migration'da bulunamadı"
fi

# Boş hash string kontrolü
EMPTY_HASH=$(grep -rn --include="*.ts" --include="*.tsx" \
  "verification_hash\s*:\s*['\"]['\"]" "$ROOT/src/" 2>/dev/null || true)
[ -z "$EMPTY_HASH" ] && pass "verification_hash boş atama yok" || fail "ERR_HASH_EMPTY: Boş verification_hash: $EMPTY_HASH"

# ══════════════════════════════════════
# D. RLS POLİTİKALARI (nctr_1.md §7.1)
# ══════════════════════════════════════
title "D. Row Level Security"

CRITICAL_TABLES=("organizations" "network_connections" "emission_data" "evidence_vault")
for tbl in "${CRITICAL_TABLES[@]}"; do
  if ls "$ROOT/supabase/migrations/"*.sql 2>/dev/null | xargs grep -l "ENABLE ROW LEVEL SECURITY" &>/dev/null; then
    if ls "$ROOT/supabase/migrations/"*.sql 2>/dev/null | xargs grep -q "$tbl" 2>/dev/null; then
      pass "RLS: $tbl migration'da mevcut"
    else
      warn "RLS: $tbl migration'da bulunamadı"
    fi
  else
    fail "RLS: ENABLE ROW LEVEL SECURITY yok migration'da"
    break
  fi
done

# auth_org_id() fonksiyonu var mı
if ls "$ROOT/supabase/migrations/"*.sql 2>/dev/null | xargs grep -q 'auth_org_id' 2>/dev/null; then
  pass "auth_org_id() yardımcı fonksiyonu mevcut"
else
  warn "auth_org_id() fonksiyonu eksik — organizasyon bazlı izolasyon riski"
fi

# ══════════════════════════════════════
# E. PERFORMANS & MİMARİ
# ══════════════════════════════════════
title "E. Performans & Mimari"

# Server Component / Client Component ayrımı
CC_COUNT=$(grep -rl '"use client"' "$ROOT/src/" 2>/dev/null | wc -l | tr -d ' ')
SC_COUNT=$(grep -rl '"use server"' "$ROOT/src/" 2>/dev/null | wc -l | tr -d ' ')
info "Client Component sayısı: $CC_COUNT | Server Action sayısı: $SC_COUNT"

# Dashboard sayfaları Server Component olmalı
DASH_CLIENTS=$(grep -l '"use client"' "$ROOT/src/app/dashboard"/**/*.tsx 2>/dev/null || true)
if [ -n "$DASH_CLIENTS" ]; then
  warn "Dashboard sayfalarında Client Component: $DASH_CLIENTS (performans kontrolü yap)"
else
  pass "Dashboard sayfaları Server Component"
fi

# Büyük dosyalar
LARGE=$(find "$ROOT/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
  xargs wc -l 2>/dev/null | sort -rn | awk '$1 > 300 {print $2 " (" $1 " satır)"}' || true)
[ -z "$LARGE" ] && pass "Tüm dosyalar 300 satır altında" || warn "Büyük dosyalar (refactor değerlendir):\n    $LARGE"

# ══════════════════════════════════════
# F. TEST KİMLİK BİLGİLERİ BAĞLANTI TESTİ
# ══════════════════════════════════════
title "F. Supabase Bağlantı Testi"

if [ -f "$CREDS_FILE" ]; then
  SUPA_URL=$(python3 -c "import json; d=json.load(open('$CREDS_FILE')); print(d['supabase']['url'])" 2>/dev/null || echo "")
  ANON_KEY=$(python3 -c "import json; d=json.load(open('$CREDS_FILE')); print(d['supabase']['anon_key'])" 2>/dev/null || echo "")

  if [ -n "$SUPA_URL" ] && [ "$SUPA_URL" != "https://XXXX.supabase.co" ]; then
    # REST API erişimi
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
      "$SUPA_URL/rest/v1/organizations?select=count" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ANON_KEY" \
      --connect-timeout 8 2>/dev/null || echo "000")

    case "$HTTP" in
      200) pass "Supabase REST API erişilebilir (HTTP 200)" ;;
      401) pass "Supabase erişilebilir — auth gerekiyor (HTTP 401, normal)" ;;
      404) warn "Supabase HTTP 404 — tablo henüz yok (migration çalıştırılmamış)" ;;
      000) warn "Supabase bağlantı zaman aşımı" ;;
      *)   warn "Supabase HTTP $HTTP — beklenmedik yanıt" ;;
    esac

    # RLS test: Anonim kullanıcı organizations görmemeli
    ANON_ORGS=$(curl -s \
      "$SUPA_URL/rest/v1/organizations?select=id&limit=1" \
      -H "apikey: $ANON_KEY" \
      -H "Authorization: Bearer $ANON_KEY" \
      --connect-timeout 8 2>/dev/null || echo "")
    if echo "$ANON_ORGS" | grep -q '"id"'; then
      fail "RLS İHLALİ: Anonim kullanıcı organizations verisi görebiliyor!"
    else
      pass "RLS: Anonim kullanıcı organizations erişemiyor"
    fi
  else
    info "Test credentials yapılandırılmamış — Supabase testi atlandı"
    info "Ayarlamak: cp hooks/.test-credentials.example.json hooks/.test-credentials.json"
  fi
else
  info ".test-credentials.json yok — Supabase testi atlandı"
fi

# ══════════════════════════════════════
# RAPORU KAYDET
# ══════════════════════════════════════
{
  echo "Nocarbontr Compliance Report — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "PASS=$PASS FAIL=$FAIL WARN=$WARNS"
  echo "---"
  printf '%s\n' "${REPORT_LINES[@]}"
} > "$REPORT_FILE"

# ══════════════════════════════════════
# SONUÇ
# ══════════════════════════════════════
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET}  |  ${RED}FAIL: $FAIL${RESET}  |  ${YELLOW}WARN: $WARNS${RESET}"
echo -e "  Rapor: hooks/.last-compliance-report.txt"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

[ "$FAIL" -gt 0 ] && exit 1 || exit 0
