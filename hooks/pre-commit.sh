#!/usr/bin/env bash
# ============================================================
# Nocarbontr — pre-commit hook
# Hızlı, yerel kontroller. Build yok (yavaş).
# ============================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$ROOT/hooks"
PASS=0
FAIL=0
WARNS=0

# Renk kodları
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_pass() { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS + 1)); }
log_fail() { echo -e "  ${RED}✗${RESET} ${RED}$1${RESET}"; FAIL=$((FAIL + 1)); }
log_warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; WARNS=$((WARNS + 1)); }
log_info() { echo -e "  ${CYAN}→${RESET} $1"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOCARBONTR PRE-COMMIT CHECKS       ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""

# ─────────────────────────────────────────
# 1. Yasaklı dosyalar staged mi?
# ─────────────────────────────────────────
echo -e "${BOLD}[1/5] Gizli Dosya Kontrolü${RESET}"

STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if echo "$STAGED" | grep -q "\.env\.local$"; then
  log_fail "ERR_SECRET_ENV: .env.local staged! — rules.md §1.2"
else
  log_pass ".env.local staged değil"
fi

if echo "$STAGED" | grep -q "^node_modules/"; then
  log_fail "ERR_NODE_MODULES: node_modules staged! — rules.md §2.1"
else
  log_pass "node_modules staged değil"
fi

# ─────────────────────────────────────────
# 2. Gizli bilgi sızıntısı — staged içerik
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}[2/5] Secret Leak Kontrolü${RESET}"

STAGED_CONTENT=$(git diff --cached 2>/dev/null || true)

if echo "$STAGED_CONTENT" | grep -qE 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}'; then
  log_fail "ERR_SECRET_JWT: Staged kodda JWT token tespit edildi! — rules.md §1.2"
else
  log_pass "JWT token sızıntısı yok"
fi

if echo "$STAGED_CONTENT" | grep -qE 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*["\x27]?ey'; then
  log_fail "ERR_SECRET_KEY: service_role key staged kodda! — rules.md §1.3"
else
  log_pass "Service role key sızıntısı yok"
fi

# Browser client içinde service role key kullanımı
if echo "$STAGED_CONTENT" | grep -qE 'createBrowserClient.*SERVICE_ROLE'; then
  log_fail "ERR_SECRET_KEY: createBrowserClient ile service role key kullanımı! — rules.md §1.3"
else
  log_pass "Browser client güvenli"
fi

# ─────────────────────────────────────────
# 3. TypeScript Kontrolü (hızlı)
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}[3/5] TypeScript Kontrolü${RESET}"

cd "$ROOT"
if export PATH="$HOME/.local/bin:$PATH" && npx tsc --noEmit --skipLibCheck 2>/dev/null; then
  log_pass "TypeScript hata yok"
else
  log_fail "ERR_TYPESCRIPT: TypeScript hataları mevcut — rules.md §2.1"
  log_info "Detay için: npx tsc --noEmit"
fi

# ─────────────────────────────────────────
# 4. CBAM Uyumluluk — Kaynak Kod
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}[4/5] CBAM Uyumluluk Kontrolü${RESET}"

# formula_version eksik insert
if echo "$STAGED_CONTENT" | grep -qE '\.from\("emission_data"\)\.insert' ; then
  if ! echo "$STAGED_CONTENT" | grep -qE 'formula_version'; then
    log_warn "ERR_FORMULA_VERSION: emission_data insert'te formula_version eksik? — rules.md §3.1"
  else
    log_pass "formula_version mevcut"
  fi
else
  log_pass "emission_data insert yok (kontrol atlandı)"
fi

# verification_hash boş bırakılmış mı
if echo "$STAGED_CONTENT" | grep -qE '\.from\("evidence_vault"\)\.insert'; then
  if echo "$STAGED_CONTENT" | grep -qE 'verification_hash\s*:\s*["'"'"']{2}'; then
    log_fail "ERR_HASH_EMPTY: verification_hash boş string! — rules.md §3.2"
  else
    log_pass "verification_hash dolu"
  fi
else
  log_pass "evidence_vault insert yok (kontrol atlandı)"
fi

# Yıl kontrolü (hardcoded 2025 veya daha küçük)
if echo "$STAGED_CONTENT" | grep -qE 'year\s*[:=]\s*(202[0-4]|201[0-9]|20[0-1][0-9])'; then
  log_warn "Emission year < 2026 tespit edildi? rules.md §3.3 kontrol et"
else
  log_pass "Emission year kısıtı OK"
fi

# ─────────────────────────────────────────
# 5. Dosya Boyutu
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}[5/5] Dosya Boyutu Kontrolü${RESET}"

LARGE_FILES=false
while IFS= read -r file; do
  if [ -f "$ROOT/$file" ]; then
    SIZE=$(wc -c < "$ROOT/$file" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 512000 ]; then
      log_fail "Büyük dosya staged: $file ($(( SIZE / 1024 ))KB > 500KB)"
      LARGE_FILES=true
    fi
  fi
done <<< "$STAGED"
[ "$LARGE_FILES" = false ] && log_pass "Tüm dosyalar boyut limitinde"

# ─────────────────────────────────────────
# Sonuç
# ─────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}Geçti: $PASS${RESET}  |  ${RED}Başarısız: $FAIL${RESET}  |  ${YELLOW}Uyarı: $WARNS${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}✗ COMMIT REDDEDİLDİ — $FAIL kural ihlali${RESET}"
  echo -e "  Detaylar: hooks/rules.md"
  echo ""
  exit 1
fi

echo -e "${GREEN}${BOLD}✓ Commit onaylandı${RESET}"
echo ""
exit 0
