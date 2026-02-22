#Wykorzystujemy obraz bazowy serwera Nginx na dystrybucji Alpine Linux
FROM nginx:alpine
#Informacja dla Dockera, że kontener nasłuchuje na porcie 80
EXPOSE 80
#Uruchomienie serwera Nginx w trybie pierwszoplanowym
CMD ["nginx", "-g", "daemon off;"]