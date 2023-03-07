### Create the database for UserAuthentication service

sudo mysql --user=root <<EOF
CREATE DATABASE notes;
CREATE USER 'notes'@'localhost' IDENTIFIED BY 'notes';
GRANT ALL PRIVILEGES ON notes.* TO 'notes'@'localhost'
WITH GRANT OPTION;
EOF

### Set up the UserAuthentication service code

sudo mkdir -p "/opt/notes"
sudo chmod 777 "/opt/notes"
(cd /build-notes || exit; tar cf - .) | (cd /opt/notes || exit; tar xf -)
(
    cd /opt/notes || exit
    rm -rf node_modules package-lock.json *.sqlite3
    npm install
)
