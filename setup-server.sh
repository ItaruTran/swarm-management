#!/bin/bash

sudo apt-get update
sudo apt-get upgrade -y

### Add DNS server
echo "DNS=8.8.8.8 8.8.4.4" | sudo tee /etc/systemd/resolved.conf > /dev/null

### Install docker
# This setup may be out of date, please visit https://docs.docker.com/engine/install/ubuntu/

# Install tools
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add gpg key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add docker host to apt
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Update docker settings
# Replace x.x.x.x ip by server ip
printf "{\n\
  \"icc\": false,\n\
  \"userland-proxy\": false,\n\
  \"no-new-privileges\": true,\n\
  \"metrics-addr\" : \"$1:9323\",\n\
  \"experimental\" : true,\n\
  \"log-driver\": \"json-file\",\n\
  \"log-opts\": {\n\
    \"max-size\": \"20m\",\n\
    \"max-file\": \"10\",\n\
    \"labels\": \"production_status\",\n\
    \"env\": \"os,customer\"\n\
  }\n\
}" | sudo tee /etc/docker/daemon.json > /dev/null

# Reload docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install plugins
docker plugin install grafana/loki-docker-driver:latest --alias loki
docker plugin install --alias glusterfs mikebarkmin/glusterfs:9 SERVERS=internal-domain VOLNAME=share-gfs