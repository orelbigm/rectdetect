FROM node:alpine AS development
# FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# see https://github.com/Automattic/node-canvas/issues/866
# end up avoiding OpenCV, and canvas seems to be a big deal of issue
# in linux,  all thie apk add below is to address build issues
# with canvas, notice this is not production ready as .build-deps 
# needs to be clean up after 
RUN apk add --no-cache --virtual .build-deps \
        build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
        cairo \
	jpeg \
	pango \
	giflib \
    && npm ci

# later on our release stage, we cleanup .build-deps

RUN npm install

COPY . . 

RUN npm run build

FROM node:alpine as production
# FROM node:21-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

# see https://github.com/Automattic/node-canvas/issues/866
# end up avoiding OpenCV, and canvas seems to be a big deal of issue
# in linux,  all thie apk add below is to address build issues
# with canvas, notice this is not production ready as .build-deps 
# needs to be clean up after 
RUN apk add --no-cache --virtual .build-deps \
        build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
        cairo \
	jpeg \
	pango \
	giflib \
    && npm ci

# later on our release stage, we cleanup .build-deps

RUN npm install --only=prod

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/src/main"]