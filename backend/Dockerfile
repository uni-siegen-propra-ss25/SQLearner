FROM node:20-alpine

WORKDIR /app

# Install netcat for database connection check
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && \
    npm install --save-dev --legacy-peer-deps \
        @nestjs/swagger@6.3.0 \
        @types/express@4.17.21 \
        @types/multer@1.4.11 \
        @types/pg@8.10.9 \
        @types/node@20.11.24 \
        typescript@5.3.3 \
        ts-node@10.9.2 \
        @typescript-eslint/parser@6.21.0 \
        @typescript-eslint/eslint-plugin@6.21.0 && \
    npm install --legacy-peer-deps \
        @prisma/client@5.10.2 \
        pg@8.11.3 \
        @nestjs/common@10.3.3 \
        @nestjs/core@10.3.3 \
        @nestjs/platform-express@10.3.3 \
        reflect-metadata@0.2.1 \
        rxjs@7.8.1

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV JWT_SECRET=your_jwt_secret_key_here
ENV JWT_EXPIRES_IN=1h
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/sqlearner?schema=public"

# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["sh", "-c", "while ! nc -z db 5432; do sleep 1; done && npx prisma migrate deploy && npm run start:dev"] 