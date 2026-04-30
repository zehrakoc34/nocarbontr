#!/usr/bin/env bash
# ============================================================
# Nocarbontr — install.sh
# Git hook'larını .git/hooks/'a kurar.
# Kullanım: bash hooks/install.sh
# ============================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HOOKS_SRC="$ROOT/hooks"
HOOKS_DEST="$ROOT/.git/hooks"
BASE_HOOKS="/Users/macpart/YZ/nocarbontr-base/hooks"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   NOCARBONTR HOOKS KURULUMU          ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""

# .git/hooks dizini
mkdir -p "$HOOKS_DEST"

install_hook() {
  local src="$1"
  local dest_name="$2"
  local dest="$HOOKS_DEST/$dest_name"

  if [ -f "$dest" ] && [ ! -L "$dest" ]; then
    cp "$dest" "${dest}.backup-$(date +%Y%m%d%H%M%S)"
    echo -e "  ${YELLOW}⚠ Mevcut $dest_name yedeklendi${RESET}"
  fi

  cp "$src" "$dest"
  chmod +x "$dest"
  echo -e "  ${GREEN}✓ $dest_name kuruldu${RESET}"
}

# pre-commit hook
install_hook "$HOOKS_SRC/pre-commit.sh" "pre-commit"

# pre-push hook
install_hook "$HOOKS_SRC/pre-push.sh" "pre-push"

# post-commit hook (compliance raporu)
cat > "$HOOKS_DEST/post-commit" << 'HOOK'
#!/usr/bin/env bash
ROOT="$(git rev-parse --show-toplevel)"
# Arka planda compliance raporu güncelle (sessiz)
bash "$ROOT/hooks/check-compliance.sh" > /dev/null 2>&1 &
HOOK
chmod +x "$HOOKS_DEST/post-commit"
echo -e "  ${GREEN}✓ post-commit kuruldu (arka plan compliance raporu)${RESET}"

# nocarbontr-base/hooks'a da kopyala (kullanıcı isteği)
if [ -d "$BASE_HOOKS" ]; then
  echo ""
  echo -e "  ${CYAN}→ nocarbontr-base/hooks'a da kopyalanıyor...${RESET}"
  cp "$HOOKS_SRC"/*.sh "$BASE_HOOKS/"
  cp "$HOOKS_SRC"/.test-credentials.example.json "$BASE_HOOKS/" 2>/dev/null || true
  cp "$HOOKS_SRC/rules.md" "$BASE_HOOKS/"
  echo -e "  ${GREEN}✓ nocarbontr-base/hooks güncellendi${RESET}"
fi

# Test credentials kontrolü
echo ""
if [ ! -f "$HOOKS_SRC/.test-credentials.json" ]; then
  echo -e "  ${YELLOW}⚠ Test kimlik bilgileri eksik${RESET}"
  echo -e "  ${CYAN}→ Oluşturmak için:${RESET}"
  echo -e "     cp hooks/.test-credentials.example.json hooks/.test-credentials.json"
  echo -e "     # Sonra Supabase URL ve test kullanıcı bilgilerini gir"
else
  echo -e "  ${GREEN}✓ Test kimlik bilgileri mevcut${RESET}"
fi

echo ""
echo -e "${BOLD}Kurulu hooklar:${RESET}"
ls -1 "$HOOKS_DEST" | grep -v '\.sample$' | grep -v '\.backup' | \
  while read -r h; do echo -e "  • $h"; done

echo ""
echo -e "${GREEN}${BOLD}✓ Kurulum tamamlandı!${RESET}"
echo ""
echo -e "${CYAN}Komutlar:${RESET}"
echo -e "  Sürekli izleme:   bash hooks/watch.sh"
echo -e "  Manuel kontrol:   bash hooks/check-compliance.sh"
echo -e "  Son rapor:        cat hooks/.last-compliance-report.txt"
echo ""
