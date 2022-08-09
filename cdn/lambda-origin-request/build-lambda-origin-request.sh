rm -rf ../lambda-origin-request-build || echo "Doesn't exist..."
mkdir -p ../lambda-origin-request-build

cp router.js ../lambda-origin-request-build/
cp ../../../security.gov.uk-content/build/content_metadata.json ../lambda-origin-request-build/

cd ../lambda-origin-request-build/
# npm install --omit=dev
