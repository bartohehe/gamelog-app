#Wykorzystujemy minimalny obraz systemu Linux (Alpine)
FROM alpine
#Instalacja narzędzia curl do testów łączności międzyserwisowej
RUN apk add --no-cache curl
#Wypisanie statusu i zapętlenie procesu, aby kontener pozostał aktywny
CMD ["sh", "-c", "echo 'Backend service is running...' && sleep infinity"]