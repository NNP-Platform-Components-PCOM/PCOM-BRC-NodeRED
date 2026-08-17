#!/bin/bash

trap stop SIGINT SIGTERM

function stop() {
	kill $CHILD_PID
	wait $CHILD_PID
}


cp   /tmp/settings.js /data/settings.js
cp -r /tmp/icons  /data/icons

/usr/bin/node $NODE_OPTIONS node_modules/node-red/red.js --userDir /data --settings $SETTINGS  $FLOWS "${@}" &

CHILD_PID="$!"

wait "${CHILD_PID}"
