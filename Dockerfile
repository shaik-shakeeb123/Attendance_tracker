# Use the official Microsoft Playwright image which includes Node.js and all browser dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.49.0-noble

# Set working directory inside the container
WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies (ignoring scripts to avoid running playwright install again)
RUN npm ci --ignore-scripts

# Copy the rest of the application code
COPY . .

# Set default port environment variable
ENV PORT=5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
