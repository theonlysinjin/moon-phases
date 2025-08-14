#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

OUT_DIR="frames"
BASE_URL="https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004310/frames/5760x3240_16x9_30p"
CONCURRENCY="${CONCURRENCY:-10}"

mkdir -p "$OUT_DIR"

if command -v aria2c >/dev/null 2>&1; then
  TMP_LIST="$(mktemp)"
  for n in $(seq 1 236); do
    printf "%s/moon.%04d.tif\n" "$BASE_URL" "$n" >> "$TMP_LIST"
  done
  aria2c -x 8 -s 8 -j "$CONCURRENCY" -c -d "$OUT_DIR" --file-allocation=none -i "$TMP_LIST"
  rm -f "$TMP_LIST"
  exit 0
fi

if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
  echo "Error: need curl or wget installed." >&2
  exit 1
fi

export BASE_URL OUT_DIR
printf "%04d\n" $(seq 1 236) | xargs -P "$CONCURRENCY" -I{} sh -c '
  f="moon.{}.tif"
  if [ -s "$OUT_DIR/$f" ]; then
    printf "skip %s\n" "$f"
    exit 0
  fi
  url="$BASE_URL/$f"
  printf "get  %s\n" "$f"
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 5 --retry-delay 2 --connect-timeout 15 -o "$OUT_DIR/$f" "$url"
  else
    wget -c -O "$OUT_DIR/$f" "$url"
  fi
'

echo "Done. Files saved to $OUT_DIR/"

