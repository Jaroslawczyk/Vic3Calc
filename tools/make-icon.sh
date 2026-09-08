#!/usr/bin/env bash
# ============================================================================
# tools/make-icon.sh - Build app/assets/vic3calc.ico from a game PNG.
# ---------------------------------------------------------------------------
# EN: Windows .ico files may embed a PNG directly (Vista and later), so no image
#     library is needed: we just write the 22-byte header and append the PNG.
#     Run this only if you want to change the desktop icon.
#
#         tools/make-icon.sh [path-to-source.png]
#
# RU: В Windows .ico может содержать PNG напрямую (Vista и новее), поэтому
#     библиотека для картинок не нужна: пишем 22 байта заголовка и добавляем
#     PNG. Запускайте, только если хотите сменить иконку на рабочем столе.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:-img/icons/buildings/png/120px-Building_tooling_workshops.png}"
OUT="app/assets/vic3calc.ico"

[ -f "$SRC" ] || { echo "No such file: $SRC" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"

# PNG dimensions live at byte offsets 16..23 (big-endian 32-bit each).
read -r W H < <(od -An -tu1 -j16 -N8 "$SRC" |
  awk '{print ($1*16777216+$2*65536+$3*256+$4), ($5*16777216+$6*65536+$7*256+$8)}')
SIZE=$(stat -c%s "$SRC")

# A dimension byte of 0 means 256 in the ICO format.
bw=$(( W >= 256 ? 0 : W ))
bh=$(( H >= 256 ? 0 : H ))

le32() { # little-endian 32-bit
  printf "$(printf '\\x%02x\\x%02x\\x%02x\\x%02x' \
    $(( $1 & 0xff )) $(( ($1 >> 8) & 0xff )) \
    $(( ($1 >> 16) & 0xff )) $(( ($1 >> 24) & 0xff )))"
}

{
  # ICONDIR: reserved=0, type=1 (icon), count=1
  printf '\x00\x00\x01\x00\x01\x00'
  # ICONDIRENTRY: width, height, colours=0, reserved=0, planes=1, bpp=32
  printf "$(printf '\\x%02x\\x%02x' "$bw" "$bh")"
  printf '\x00\x00\x01\x00\x20\x00'
  le32 "$SIZE"      # bytes of image data
  le32 22           # offset: 6-byte header + 16-byte entry
  cat "$SRC"
} > "$OUT"

echo "Wrote $OUT  (${W}x${H}, $(stat -c%s "$OUT") bytes) from $SRC"
