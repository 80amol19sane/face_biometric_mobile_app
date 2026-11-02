#!/usr/bin/env bash
# Fetches the MobileFaceNet weights used for development builds.
# The source repository publishes no licence, so the file is not committed here.
# Replace it with a model you are licensed to ship before any production rollout,
# and bump MODEL_VERSION in mobile/src/face/config.ts plus the backend "Embedding Model" setting.
set -euo pipefail

URL="https://raw.githubusercontent.com/estebanuri/face_recognition/master/android/app/src/main/assets/mobile_face_net.tflite"
SHA256="b67366e085ec9f6c2afb05c10397a46edeb823367abaec77f64f5ce946ac2847"
DEST="$(cd "$(dirname "$0")/.." && pwd)/mobile/assets/models/mobilefacenet.tflite"

mkdir -p "$(dirname "$DEST")"
curl -fsSL "$URL" -o "$DEST"
echo "$SHA256  $DEST" | sha256sum -c -
