# This is meant to be run as dave@club
# to properly update the repository with new changes,
# but it works on anything that has the right
# things installed:
#
# Setup for another computuer:
#    - Make sure git pull works without
#    typing else into it (i.e. ssh key)
#    - An .env file exists and is setup
#    - PM2 is installed and the process is started
#    with name `elemental4` (pm2 start . --name elemental4)
#
#### THE ACTUAL SCRIPT ####
pm2 stop elemental4

git pull

npm install -D

node build-client.js
npm run build-server

pm2 start elemental4
pm2 save
