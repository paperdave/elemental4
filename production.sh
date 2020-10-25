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
#    with name `elem4` and `elem4-anarchy` (pm2 start . --name elemental4)
#
#### THE ACTUAL SCRIPT ####
git checkout .
git pull

npm install -D

npm run build-server

pm2 restart elem4
pm2 restart elem4-anarchy
pm2 save
