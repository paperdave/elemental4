npm run build-server

trap 'kill $PID1; kill $PID2; exit' INT

npm run serve &
PID1=$!
npm run watch-game &
PID2=$!

wait
