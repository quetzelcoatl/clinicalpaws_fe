# 1. Build phase: use Node to build the production bundle
FROM node:18 AS builder

# Create app directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your source code
COPY . .

# Build your React app (outputs to /app/build by default)
RUN npm run build

# 2. Production phase: use Nginx to serve the built files
FROM nginx:alpine

COPY ./nginx/sites-available/frontend.conf /etc/nginx/conf.d/default.conf

# Copy the compiled build from the builder stage into Nginx's HTML folder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 30 in the container
EXPOSE 30

# For local dev or debugging, you can also override the default.conf if needed:
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]