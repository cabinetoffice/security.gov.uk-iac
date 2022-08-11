#!/usr/bin/env bash

CWD="$(pwd)"
echo "Current directory: $CWD"

if [[ "$CWD" =~ cdn\/?$ ]]; then
  echo "Changing directory to: $CWD/lambda-api"
  cd lambda-api/ || exit 1
fi

rm -rf ../lambda-api-build || echo "Build directory doesn't exist yet"
mkdir -p ../lambda-api-build

cp app.js ../lambda-api-build/
cp lambda.js ../lambda-api-build/
cp package.json ../lambda-api-build/

cd ../lambda-api-build/  || exit 1
echo "Running: npm install --omit=dev"
npm install --omit=dev

echo "Changing directory to: $CWD"
cd "$CWD"  || exit 0
