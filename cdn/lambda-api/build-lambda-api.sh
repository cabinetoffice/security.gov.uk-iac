rm -rf ../lambda-api-build || echo "Doesn't exist..."
mkdir -p ../lambda-api-build

cp app.js ../lambda-api-build/
cp lambda.js ../lambda-api-build/
cp package.json ../lambda-api-build/
cp ../../../security.gov.uk-content/build/content_metadata.json ../lambda-api-build/

cd ../lambda-api-build/
npm install --omit=dev
