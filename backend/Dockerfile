FROM node:20-alpine

WORKDIR /app

# Install netcat for database connection check
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install && \
    npm install --save-dev @nestjs/swagger @types/express @types/multer @types/pg && \
    npm install @prisma/client pg

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