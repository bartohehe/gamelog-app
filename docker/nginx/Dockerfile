FROM nginx:alpine

# Install certbot for Let's Encrypt support
RUN apk add --no-cache certbot

# nginx config templates (http and https)
COPY templates/ /etc/nginx/templates/

# Startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r//' /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
