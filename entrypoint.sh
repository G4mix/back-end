#!/bin/bash

npm run db:mig:deploy

ENV_FILE=".env"

cat <<EOL > $ENV_FILE
PORT=$PORT
FRONTEND_URL=$FRONTEND_URL
PG_DB_URL=$PG_DB_URL
AWS_S3_KEY=$AWS_S3_KEY
AWS_S3_SECRET=$AWS_S3_SECRET
AWS_SES_KEY=$AWS_SES_KEY
AWS_SES_SECRET=$AWS_SES_SECRET
PUBLIC_BUCKET_NAME=$PUBLIC_BUCKET_NAME
PRIVATE_BUCKET_NAME=$PRIVATE_BUCKET_NAME
EOL

echo ".env file created with environment variables."

npm start