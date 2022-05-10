#!/usr/bin/bash

# to run:
# . dev_setup.sh
# ^-- The dot is important, it makes it so the enviroment variables are set to your current terminal instead of some random one that dies immediatly after

export MONGO_HOST="localhost"
export MONGO_USER="db-manager"
export MONGO_PASSWORD="hunter2"
export MONGO_DB_NAME="tarpaulin"

echo $MONGO_HOST
echo $MONGO_USER
echo $MONGO_PASSWORD
echo $MONGO_DB_NAME

# Setup command dev db container
# *** MUST make sure mongo-net is created via the 'docker network create' command
# docker run -d --name tarp-mongo-tester --network mongo-net -p "27017:27017" tarp-mongo-tester

# Build dev image
# docker build --tag tarp-mongo-tester -f ./mongodockerfile .

docker start tarp-mongo-tester

# Start up nodemon
npm run dev

# Command to connect to mongo server as shell
# docker run --rm -it --network mongo-net mongo:latest mongo --host tarp-mongo-tester --username root --password hunter2 --authenticationDatabase admin