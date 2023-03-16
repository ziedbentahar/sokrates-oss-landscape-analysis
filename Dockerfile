FROM amazoncorretto:17-alpine3.17


RUN apk update && apk add curl \
    && apk add --update --no-cache nodejs npm \
    && apk add --no-cache bash \
    && apk add --no-cache git \
    && apk add --no-cache zip \
    && apk add --no-cache gettext \
    && apk add --no-cache aws-cli

WORKDIR /sokrates

RUN curl https://d2bb1mtyn3kglb.cloudfront.net/builds/sokrates-LATEST.jar --output sokrates-LATEST.jar

COPY . ./


RUN chmod u+x ./analysis-scripts/**/*.sh \
    && chmod u+x ./run.sh


ENTRYPOINT ["./run.sh"]

