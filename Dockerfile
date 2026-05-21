# Use a lightweight official Node.js Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Set default port environment variable
ENV PORT=5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
