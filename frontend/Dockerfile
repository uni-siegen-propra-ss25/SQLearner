FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose the port
EXPOSE 4200

# Start the application with host flag to listen on all interfaces
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--disable-host-check"] 