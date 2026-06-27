#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ICON_SOURCE="$ROOT/build/icon.png"
ICONSET="$ROOT/build/icon.iconset"
ICON_OUTPUT="$ROOT/build/icon.icns"
HELPER_SOURCE="$ROOT/build/macos/middle-click-helper.m"
HELPER_DIR="$ROOT/build/macos/bin"
HELPER_OUTPUT="$HELPER_DIR/mineradio-middle-click-helper"

[[ "$(uname -s)" == "Darwin" ]] || { echo "prepare:mac 只能在 macOS 上运行。" >&2; exit 1; }
command -v xcrun >/dev/null || { echo "缺少 Xcode Command Line Tools，请执行 xcode-select --install。" >&2; exit 1; }
[[ -f "$ICON_SOURCE" ]] || { echo "缺少图标：$ICON_SOURCE" >&2; exit 1; }

rm -rf "$ICONSET"
mkdir -p "$ICONSET" "$HELPER_DIR"

make_icon() {
  local size="$1"
  local name="$2"
  sips -z "$size" "$size" "$ICON_SOURCE" --out "$ICONSET/$name" >/dev/null
}

make_icon 16 icon_16x16.png
make_icon 32 icon_16x16@2x.png
make_icon 32 icon_32x32.png
make_icon 64 icon_32x32@2x.png
make_icon 128 icon_128x128.png
make_icon 256 icon_128x128@2x.png
make_icon 256 icon_256x256.png
make_icon 512 icon_256x256@2x.png
make_icon 512 icon_512x512.png
make_icon 1024 icon_512x512@2x.png
iconutil -c icns "$ICONSET" -o "$ICON_OUTPUT"
rm -rf "$ICONSET"

DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-12.0}"
IFS=',' read -r -a ARCH_LIST <<< "${MINERADIO_MAC_HELPER_ARCHS:-arm64,x86_64}"
ARCH_FLAGS=()
for arch in "${ARCH_LIST[@]}"; do
  [[ -n "$arch" ]] && ARCH_FLAGS+=("-arch" "$arch")
done

xcrun clang \
  -fobjc-arc \
  -O2 \
  -mmacosx-version-min="$DEPLOYMENT_TARGET" \
  "${ARCH_FLAGS[@]}" \
  -framework Cocoa \
  "$HELPER_SOURCE" \
  -o "$HELPER_OUTPUT"
chmod 755 "$HELPER_OUTPUT"

lipo -info "$HELPER_OUTPUT" || true
echo "macOS 资源已准备：$ICON_OUTPUT"
