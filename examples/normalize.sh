#!/usr/bin/env sh
set -eu
curl --fail-with-body --silent --show-error --get https://api.jusho.dev/normalize \
  --data-urlencode "address=東京都渋谷区渋谷２ー２１ー１"
