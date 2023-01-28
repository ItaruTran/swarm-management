#!/bin/bash
set -e

# check env
# : "${SLOT?Need to set SLOT}"
# : "${SERVICE_NAME?Need to set SERVICE_NAME}"

# echo "Have ip"
# getent hosts | awk '{ print $1 }'

# for IP in $(getent hosts | awk '{ print $1 }'); do
#   if [ "$IP" != "127.0.0.1" ]; then
#     CURR_IP=$IP
#     break
#   fi
# done

CURR_IP=$(uname -n)

sleep "$(shuf -i 1-5 -n 1).${RANDOM:0:3}"

SLOT=1
while : ; do
  IP_FILE="./data/task-$SLOT.ip"
  if [ -f "$IP_FILE" ]; then
    ((SLOT++))
  else
    break
  fi
done

echo "Use slot $SLOT"

OLD_IP_FILE="./data/old-$SLOT.ip"

echo $CURR_IP > $IP_FILE
trap '{ rm -f -- "$IP_FILE"; }' EXIT

NODE_DIR="/usr/share/elasticsearch/data/node-$SLOT"
UNICAST_HOSTS="./data/unicast_hosts.txt"
NODE_NAME="es-$SLOT"

# Update cluster env
CONFIG=("path.data=$NODE_DIR")
CONFIG+=("node.name=$NODE_NAME")
# CONFIG+=("node.roles=data,master")
CONFIG+=("discovery.seed_providers=file")
# CONFIG+=("discovery.seed_hosts=tasks.$SERVICE_NAME")
CONFIG+=("cluster.initial_master_nodes=es-1,es-2,es-3")

# Fix node can't discover other nodes
CONFIG+=("network.publish_host=$CURR_IP")
# Fix run in version 8
CONFIG+=("xpack.security.enabled=false")

if [ ! -d "$NODE_DIR" ]; then
  mkdir -p "$NODE_DIR"
fi

if [ -f "$UNICAST_HOSTS" ]; then
  # check old ip
  if [ -f "$OLD_IP_FILE" ]; then
    OLD_IP=$(cat "$OLD_IP_FILE")
    sed -i "s/$OLD_IP/$CURR_IP/g" $UNICAST_HOSTS

  # new host add to cluster
  else
    echo $CURR_IP >> $UNICAST_HOSTS
  fi
else
  echo $CURR_IP >> $UNICAST_HOSTS
fi

echo $CURR_IP > $OLD_IP_FILE

# copy unicast_hosts
cp $UNICAST_HOSTS ./config/unicast_hosts.txt

env "${CONFIG[@]}" "/usr/local/bin/docker-entrypoint.sh" "$@"

