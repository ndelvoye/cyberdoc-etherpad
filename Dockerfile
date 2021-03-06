# Etherpad Lite Dockerfile
#
# https://github.com/ether/etherpad-lite
#
# Author: muxator

FROM ubuntu:20.04
LABEL maintainer="Etherpad team, https://github.com/ether/etherpad-lite"

# disable linux interactive requests
ENV DEBIAN_FRONTEND=noninteractive

# install node
RUN apt-get update 
RUN apt-get -y install wget
RUN wget -qO- https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get -y install nodejs
RUN npm i -g npm@latest

# install libreoffice
RUN apt-get update && apt-get install -y libreoffice

# plugins to install while building the container. By default no plugins are
# installed.
# If given a value, it has to be a space-separated, quoted list of plugin names.
#
# EXAMPLE:
#   ETHERPAD_PLUGINS="ep_codepad ep_author_neat"
ARG ETHERPAD_PLUGINS=

# By default, Etherpad container is built and run in "production" mode. This is
# leaner (development dependencies are not installed) and runs faster (among
# other things, assets are minified & compressed).
ENV NODE_ENV=production

# Follow the principle of least privilege: run as unprivileged user.
#
# Running as non-root enables running this image in platforms like OpenShift
# that do not allow images running as root.
RUN useradd --uid 5001 --create-home etherpad

RUN mkdir /opt/etherpad-lite && chown etherpad:0 /opt/etherpad-lite

USER etherpad

WORKDIR /opt/etherpad-lite

COPY --chown=etherpad:0 ./ ./

# install node dependencies for Etherpad
RUN bin/installDeps.sh && \
	rm -rf ~/.npm/_cacache

# Install the plugins, if ETHERPAD_PLUGINS is not empty.
#
# Bash trick: in the for loop ${ETHERPAD_PLUGINS} is NOT quoted, in order to be
# able to split at spaces.
RUN for PLUGIN_NAME in ${ETHERPAD_PLUGINS}; do npm install "${PLUGIN_NAME}" || exit 1; done

# Copy the configuration file.
COPY --chown=etherpad:0 ./settings.json.docker /opt/etherpad-lite/settings.json

# Fix permissions for root group
RUN chmod -R g=u .

EXPOSE 9001
CMD ["node", "--experimental-worker", "node_modules/ep_etherpad-lite/node/server.js"]
