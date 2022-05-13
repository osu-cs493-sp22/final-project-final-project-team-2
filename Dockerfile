FROM node
WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV PORT=8000
ENV MONGO_HOST="database"
ENV MONGO_PORT=27017
ENV MONGO_USER="db-manager"
ENV MONGO_PASSWORD="hunter2"
ENV MONGO_DB_NAME="tarpaulin"
ENV REDIS_HOST="redis-serv"
ENV REDIS_PORT=6379
EXPOSE ${PORT}
CMD [ "npm", "start" ]
