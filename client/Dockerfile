FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json .
RUN npm install
COPY client/ .
COPY data/ /data/
ARG VITE_SERVER_URL=http://localhost:3001
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
