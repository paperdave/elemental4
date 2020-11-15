trap 'kill $PID1; kill $PID2; exit' INT

node dev-server &
PID1=$!
npm run watch-game &
PID2=$!

wait
