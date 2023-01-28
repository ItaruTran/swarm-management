#!/bin/bash
set -e

# check env
# : "${SLOT?Need to set SLOT}"
: "${REDIS_REPLICAS?Need to set REDIS_REPLICAS}"
: "${NODE_COUNT?Need to set NODE_COUNT}"

CURR_IP=$(getent hosts $(hostname) | awk '{ print $1 }')

sleep "$(shuf -i 1-5 -n 1).${RANDOM:0:3}"

SLOT=1
while : ; do
  IP_FILE="./task-$SLOT.ip"
  if [ -f "$IP_FILE" ]; then
    ((SLOT++))
  else
    break
  fi
done

echo "Use slot $SLOT"

NODE_DIR="$(pwd)/node-$SLOT"
OLD_IP_FILE="./old-$SLOT.ip"

echo $CURR_IP > $IP_FILE
trap '{ rm -f -- "$IP_FILE"; }' EXIT

# Update cluster config
CONFIG=("$@")

CONFIG+=('--cluster-enabled' 'yes')
CONFIG+=('--cluster-config-file' "$NODE_DIR/nodes.conf")
CONFIG+=('--cluster-node-timeout' '5000')
CONFIG+=('--appendonly' 'yes')
CONFIG+=('--dir' "$NODE_DIR")

# declare -p CONFIG

function update_node_ip {
  OLD_IP=$(cat "$OLD_IP_FILE")

  for FILE in ./node-*; do
    sed -i "s/$OLD_IP/$CURR_IP/g" "$FILE/nodes.conf"
  done
}

function wait_all_node {
  set +e
  while :
  do
    sleep 1
    NODE_STATUS=()
    NODE_IPS=()
    readarray -t N_IPS < ./all-nodes.ip

    for i in "${N_IPS[@]}"
    do
      NODE_IPS+=("$i:6379")
      redis-cli -h $i ping >/dev/null 2>&1
      CURR_STATUS=$?

      [[ $CURR_STATUS -eq 0 ]] && NODE_STATUS+=('ok')
    done

    echo "Node online ${#NODE_STATUS[@]}"
    if [[ ${#NODE_STATUS[@]} -eq $NODE_COUNT ]]; then break; fi
  done

  export NODE_IPS
  set -e
}

# check this task join cluster or not
if [ -f "$NODE_DIR/nodes.conf" ]; then
  echo 'Update IP of Node'
  update_node_ip

  echo $CURR_IP > $OLD_IP_FILE

  docker-entrypoint.sh "${CONFIG[@]}"
else
  echo 'Preparing node to join cluster'
  echo $CURR_IP > $OLD_IP_FILE

  if [ ! -d "$NODE_DIR" ]; then
    mkdir "$NODE_DIR"
  fi

  echo 'Start redis server in background'
  docker-entrypoint.sh "${CONFIG[@]}" &
  REDIS_PID=$!

  # check isn't node 1
  if [[ $SLOT -ne '1' ]]; then
      sleep 3

    if [[ -f './all-nodes.ip' ]]; then
      echo 'Waiting for cluster created'

      echo $CURR_IP >> './all-nodes.ip'
    else
      echo 'Join to cluster as slave'

      redis-cli --cluster add-node "$CURR_IP:6379" "$(cat "./task-1.ip"):6379" --cluster-slave
    fi
  else
    echo 'Check all node online'

    echo $CURR_IP > './all-nodes.ip'

    wait_all_node
    declare -p NODE_IPS

    rm ./all-nodes.ip

    yes 'yes' | redis-cli --cluster create "${NODE_IPS[@]}" --cluster-replicas $REDIS_REPLICAS
  fi

  trap "kill -INT -$REDIS_PID" INT
  wait $REDIS_PID
fi
