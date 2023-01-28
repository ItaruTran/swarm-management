FROM denoland/deno:1.14.2

# The port that your application listens to.
ENV PORT=3000
EXPOSE $PORT

WORKDIR /app

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.ts .
COPY deno.jsonc deno.jsonc
RUN deno cache --config deno.jsonc deps.ts

# These steps will be re-run upon each file change in your working directory:
ADD server server
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache --config deno.jsonc server/index.ts

CMD ["run", "--allow-net", "--allow-run", "--unstable", "--allow-env", "--config", "deno.jsonc", "server/index.ts"]