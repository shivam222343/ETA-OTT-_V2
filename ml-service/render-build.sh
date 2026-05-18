#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Install Playwright browser during build phase
python -m playwright install chromium

# Install Deno (required by yt-dlp for decrypting YouTube player signatures)
echo "Installing Deno..."
curl -fsSL https://deno.land/install.sh | sh

