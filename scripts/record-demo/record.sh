#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# DHTC Meta App Review — End-to-End Screen Recorder
#
# Usage:
#   cd scripts/record-demo
#   FB_PAGE_USERNAME=yourpage bash record.sh
#
# Output: output/final_meta.mp4
#
# Requirements (auto-installed if missing):
#   - ffmpeg (brew install ffmpeg)
#   - node >= 18
#   - playwright npm package (npm install)
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"
RAW="${OUTPUT_DIR}/raw_recording.mp4"
FINAL="${OUTPUT_DIR}/final_meta.mp4"

SCREEN_DEVICE="3"     # avfoundation index — "Capture screen 0" (from list_devices)
MIC_DEVICE="1"        # avfoundation audio index — MacBook Pro Microphone
FRAMERATE="30"
VIDEO_BITRATE="6M"

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }
header()  { echo -e "\n${BOLD}$*${RESET}"; echo "────────────────────────────────────────"; }

# ── Dependency check ──────────────────────────────────────────────────────────
header "Checking dependencies"

if ! command -v ffmpeg &>/dev/null; then
  info "Installing ffmpeg via Homebrew..."
  brew install ffmpeg
fi
success "ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"

if ! command -v node &>/dev/null; then
  error "Node.js not found. Install via: brew install node"
fi
success "node $(node --version)"

if [ ! -d "${SCRIPT_DIR}/node_modules/playwright" ]; then
  info "Installing npm dependencies..."
  cd "${SCRIPT_DIR}" && npm install
fi

# Install Playwright Chromium browser if not present
if ! node -e "require('playwright')" 2>/dev/null; then
  info "Installing Playwright browsers..."
  cd "${SCRIPT_DIR}" && npx playwright install chromium
fi
success "playwright ready"

mkdir -p "${OUTPUT_DIR}"

# ── Grant screen recording permission check ───────────────────────────────────
header "Screen Recording Permission"
warn "macOS requires Terminal/iTerm to have Screen Recording permission."
warn "System Settings → Privacy & Security → Screen Recording → enable Terminal."
echo ""
read -r -p "Press Enter when ready (or Ctrl+C to cancel)..." _

# ── List audio devices for user to confirm ───────────────────────────────────
header "Audio capture (microphone narration)"
info "Detected audio devices:"
ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep "AVFoundation audio" -A 20 | grep "^\[" | head -10
echo ""
info "Using mic device index: ${MIC_DEVICE} (MacBook Pro Microphone)"
info "Speak your narration during recording. Ctrl+C if you want no audio."
echo ""

# ── Verify screen device ──────────────────────────────────────────────────────
info "Using screen device index: ${SCREEN_DEVICE} (Capture screen 0)"
info "Output file: ${FINAL}"
echo ""

# ── Start recording ───────────────────────────────────────────────────────────
header "Starting recording"
info "ffmpeg will start → then Playwright opens the browser automatically."
echo ""

# Trap to clean up ffmpeg on exit
FFMPEG_PID=""
cleanup() {
  if [ -n "${FFMPEG_PID}" ] && kill -0 "${FFMPEG_PID}" 2>/dev/null; then
    info "Stopping ffmpeg (PID ${FFMPEG_PID})..."
    kill "${FFMPEG_PID}"
    wait "${FFMPEG_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Start ffmpeg recording (screen + mic, cursor captured by default on macOS)
ffmpeg \
  -f avfoundation \
  -framerate "${FRAMERATE}" \
  -capture_cursor 1 \
  -capture_mouse_clicks 1 \
  -i "${SCREEN_DEVICE}:${MIC_DEVICE}" \
  -c:v h264_videotoolbox \
  -b:v "${VIDEO_BITRATE}" \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -y "${RAW}" \
  2>"${OUTPUT_DIR}/ffmpeg.log" &

FFMPEG_PID=$!
info "ffmpeg started (PID ${FFMPEG_PID})"

# Give ffmpeg 2s to initialise before browser opens
sleep 2

# ── Run Playwright demo ───────────────────────────────────────────────────────
header "Playwright demo"
cd "${SCRIPT_DIR}"
FB_PAGE_USERNAME="${FB_PAGE_USERNAME:-}" node demo.mjs
PLAYWRIGHT_EXIT=$?

# ── Stop recording ────────────────────────────────────────────────────────────
header "Stopping recording"
sleep 1
kill "${FFMPEG_PID}" 2>/dev/null || true
wait "${FFMPEG_PID}" 2>/dev/null || true
FFMPEG_PID=""
success "Recording stopped"

if [ ${PLAYWRIGHT_EXIT} -ne 0 ]; then
  warn "Playwright exited with code ${PLAYWRIGHT_EXIT} — check demo.mjs output above."
fi

# ── Check raw file ────────────────────────────────────────────────────────────
if [ ! -f "${RAW}" ] || [ ! -s "${RAW}" ]; then
  error "Raw recording not found or empty: ${RAW}\nCheck ${OUTPUT_DIR}/ffmpeg.log for errors."
fi

RAW_SIZE=$(du -sh "${RAW}" | cut -f1)
RAW_DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${RAW}" 2>/dev/null | xargs printf "%.0f" || echo "?")
success "Raw recording: ${RAW_SIZE} · ${RAW_DURATION}s"

# ── Post-process ──────────────────────────────────────────────────────────────
header "Post-processing → final_meta.mp4"

# Re-encode with libx264 for broad compatibility + target <100MB
# CRF 24 ≈ 60-85 MB for 3 minutes 1440×900
info "Encoding final.mp4 (CRF 24, libx264)..."
ffmpeg -i "${RAW}" \
  -c:v libx264 \
  -preset medium \
  -crf 24 \
  -vf "scale=1440:900" \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  -y "${FINAL}" \
  2>"${OUTPUT_DIR}/encode.log"

FINAL_SIZE=$(du -sh "${FINAL}" | cut -f1)
FINAL_SIZE_BYTES=$(stat -f%z "${FINAL}" 2>/dev/null || stat -c%s "${FINAL}")
FINAL_MB=$((FINAL_SIZE_BYTES / 1024 / 1024))

success "Final file: ${FINAL} · ${FINAL_SIZE}"

if [ "${FINAL_MB}" -gt 100 ]; then
  warn "File is ${FINAL_MB}MB — over 100MB limit. Re-encoding with CRF 28..."
  ffmpeg -i "${RAW}" \
    -c:v libx264 -preset medium -crf 28 \
    -vf "scale=1440:900" \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    -y "${FINAL}" \
    2>>"${OUTPUT_DIR}/encode.log"
  FINAL_SIZE=$(du -sh "${FINAL}" | cut -f1)
  success "Re-encoded: ${FINAL} · ${FINAL_SIZE}"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
header "Done 🎬"
echo -e "${GREEN}${BOLD}  Output: ${FINAL}${RESET}"
echo ""
echo "  Next steps:"
echo "  1. Watch the video: open '${FINAL}'"
echo "  2. Upload to YouTube (Unlisted)"
echo "  3. Paste URL into Meta App Review submission"
echo ""

# Open in QuickTime automatically
if command -v open &>/dev/null; then
  open "${FINAL}"
fi
