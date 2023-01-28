# find all block devices
sudo lvmdiskscan

# mark the storage devices as LVM physical volumes
sudo pvcreate /dev/sdb

# create a new volume group
sudo vgcreate gluster-vg /dev/sdb

# create a logical volume
sudo lvcreate -l 100%FREE -n gluster gluster-vg

# format volume
sudo mkfs.ext4 /dev/gluster-vg/gluster

# add auto mount config
echo "/dev/gluster-vg/gluster /gluster ext4 defaults 0 2" > sudo tee -a /etc/fstab

# create folder
sudo mkdir /gluster

# mount volume
sudo mount /gluster

# install glusterfs
sudo apt update
sudo apt install -y glusterfs-server

# enable glusterd
sudo systemctl start glusterd
sudo systemctl enable glusterd

# create share folder
sudo mkdir /gluster/volume1
sudo gluster volume create share-gfs internal-domain:/gluster/volume1
sudo gluster volume start share-gfs

# install plugin on docker node
docker plugin install --alias glusterfs mikebarkmin/glusterfs:9 SERVERS=internal-domain VOLNAME=share-gfs

# # install glusterfs client
# sudo apt update
# sudo apt-get install -y glusterfs-client

# # mount share folder
# sudo mkdir /share-gfs
# echo "internal-domain:/share-gfs /share-gfs glusterfs defaults,_netdev,log-level=WARNING,log-file=/var/log/gluster.log 0 0" > sudo tee -a /etc/fstab
# sudo mount.glusterfs internal-domain:/share-gfs /share-gfs
# sudo chown -R root:docker /share-gfs
