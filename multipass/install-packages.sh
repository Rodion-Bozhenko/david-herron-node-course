curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y nodejs build-essential mysql-server mysql-client
