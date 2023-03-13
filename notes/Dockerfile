FROM node:16

RUN apt-get update -y \
    && apt-get upgrade -y \
    && apt-get -y install curl python build-essential git ca-certificates

ENV DEBUG="notes:*,socket.io:*"
ENV SEQUELIZE_CONNECT="models/sequelize-docker-mysql.yaml"
ENV NOTES_MODEL="sequelize"
ENV USER_SERVICE_URL="http://svc-userauth:5858"
ENV PORT="3000"

RUN mkdir -p /notesapp /notesapp/partials /notesapp/public /notesapp/routes /notesapp/views
COPY models/*.mjs models/*yaml /notesapp/models/
COPY partials/ /notesapp/partials/
COPY public/ /notesapp/public/
COPY routes/ /notesapp/routes/
COPY views/ /notesapp/views/
COPY *.mjs package.json /notesapp/

WORKDIR /notesapp

RUN npm install --unsafe-perm

VOLUME /session
EXPOSE 3000
CMD ["node", "./app.mjs"]

