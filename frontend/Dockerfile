# Step 1: Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Production Stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing if needed
RUN printf "server {\n  listen 80;\n  location / {\n    root /usr/share/nginx/html;\n    index index.html index.htm;\n    try_files \$uri \$uri/ /index.html;\n  }\n  location /api/v1 {\n    proxy_pass http://backend:4000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade \$http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host \$host;\n    proxy_cache_bypass \$http_upgrade;\n  }\n}" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
