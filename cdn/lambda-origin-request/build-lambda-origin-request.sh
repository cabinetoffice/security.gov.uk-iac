#!/usr/bin/env bash

CWD="$(pwd)"
echo "Current directory: $CWD"

if [[ "$CWD" =~ cdn\/?$ ]]; then
  echo "Changing directory to: $CWD/lambda-api"
  cd lambda-origin-request/ || exit 1
fi

rm -rf ../lambda-origin-request-build || echo "Build directory doesn't exist yet"
mkdir -p ../lambda-origin-request-build

cp router.js ../lambda-origin-request-build/
cp ../../../security.gov.uk-content/build/content_metadata.json ../lambda-origin-request-build/

echo "Content metadata in build directory:"
ls -lah ../lambda-origin-request-build/content_metadata.json
wc -l ../lambda-origin-request-build/content_metadata.json

cd ../lambda-origin-request-build/  || exit 1

echo "Changing directory to: $CWD"
cd "$CWD"  || exit 0
