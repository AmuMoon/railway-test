FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start the app
CMD ["npm", "start"]
