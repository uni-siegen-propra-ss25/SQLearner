FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Set environment variables
ENV NODE_ENV=development
ENV JWT_SECRET=your_jwt_secret_key_here
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sqlearner?schema=public"

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"] 