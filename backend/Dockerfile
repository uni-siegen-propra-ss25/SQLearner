FROM node:20-alpine

WORKDIR /app

# Install netcat for database connection check
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && \
    npm install --save-dev --legacy-peer-deps \
        @nestjs/swagger@11.2.0 \
        @types/express@5.0.2 \
        @types/multer@1.4.12 \
        @types/pg@8.15.2 \
        @types/node@22.10.7 \
        typescript@5.7.3 \
        ts-node@10.9.2 \
        @nestjs/testing@11.0.1 && \
    npm install --legacy-peer-deps \
        @prisma/client@6.8.2 \
        prisma@6.8.2 \
        pg@8.16.0 \
        express@4.18.2 \
        @nestjs/common@11.1.2 \
        @nestjs/config@4.0.2 \
        @nestjs/core@11.1.2 \
        @nestjs/platform-express@11.0.1 \
        @nestjs/jwt@11.0.0 \
        @nestjs/passport@11.0.5 \
        passport@0.7.0 \
        passport-jwt@4.0.1 \
        passport-local@1.0.0 \
        bcrypt@6.0.0 \
        class-validator@0.14.2 \
        class-transformer@0.5.1 \
        reflect-metadata@0.2.2 \
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