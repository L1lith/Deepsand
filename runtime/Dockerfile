# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Deepsand runtime image
#
# This image is the *entire* universe the contained DeepCode instance can see.
# Everything outside of the bind mounts Deepsand attaches at container start is
# unreachable, because it simply does not exist inside this image.
#
# Build:  docker build -t deepsand/runtime:dev runtime/
# ---------------------------------------------------------------------------
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim

LABEL org.opencontainers.image.title="Deepsand DeepCode runtime"
LABEL org.opencontainers.image.description="Sandboxed DeepCode CLI runtime managed by the Deepsand desktop app."
LABEL org.opencontainers.image.source="https://github.com/L1lith/DeepCode-Sandbox"
LABEL org.opencontainers.image.licenses="MIT"
LABEL deepsand.runtime.contract="1"

ARG DEEPCODE_CLI_VERSION=latest
ARG INSTALL_BUILD_TOOLS=0
# The tool selection and the DeepCode refresh are declared further down, next to the
# steps that use them. An ARG invalidates every instruction *after* it, so declaring
# them here made a change to one tool rebuild the base image, and made the DeepCode
# refresh -- which changes on every build by design -- rebuild everything below it.
# See "Selected tools" and "DeepCode CLI" near the end of this file.
ARG DEBIAN_FRONTEND=noninteractive

ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=UTC \
    TERM=xterm-256color \
    HOME=/home/deepcode \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_CACHE=/tmp/.npm \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEEPSAND_IMAGE_CONTRACT=1

# ---------------------------------------------------------------------------
# Base toolchain
#
# Only what the runtime itself needs. Everything an operator can select -- git, jq,
# ripgrep, zip, wget and the rest -- is installed by the "Selected tools" step from the
# project's own selection, so switching a tool off actually removes it.
#
# `curl` is the exception, and stays: the tool installers (rustup, nix, brew) download
# with it, so the image cannot build without it whatever was selected.
#
# Deliberately no: sudo, docker-cli, podman, nerdctl, sshd, gcc-setuid tools,
# nfs/cifs clients. Nothing in here grants a path out of the container.
# ---------------------------------------------------------------------------
# The apt lists and the downloaded packages live in build caches rather than in this
# layer. Without them every build re-downloads the index and every .deb; with them a
# rebuild fetches only what changed. `sharing=locked` matters: two projects can be
# building at once and apt's lists are not safe for two writers.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        xz-utils \
        less \
        procps \
        psmisc \
        iproute2 \
        iptables \
        util-linux \
        findutils \
        diffutils \
        patch \
        make \
        socat \
        tini

# ---------------------------------------------------------------------------
# Optional compiler toolchain (off by default; keeps the image ~250 MB smaller)
# ---------------------------------------------------------------------------
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    if [ "$INSTALL_BUILD_TOOLS" = "1" ]; then \
        apt-get update; \
        apt-get install -y --no-install-recommends \
            build-essential \
            pkg-config \
            python3 \
            python3-pip \
            python3-venv \
            python3-dev; \
    fi

# ---------------------------------------------------------------------------
# The unprivileged sandbox user.
#
# The `node` image ships uid/gid 1000 named `node`. We rename it to `deepcode`
# so in-container identity never collides with a host `node` user, then give it
# a home that the entrypoint can populate from the read-only settings mount.
# ---------------------------------------------------------------------------
RUN set -eux; \
    groupmod -n deepcode node; \
    usermod -l deepcode -d /home/deepcode -m -g deepcode -s /bin/bash node; \
    mkdir -p /home/deepcode/.deepcode /home/deepcode/.config /home/deepcode/.cache; \
    chown -R 1000:1000 /home/deepcode; \
    chmod 0755 /home/deepcode

# ---------------------------------------------------------------------------
# Deepsand runtime assets
# ---------------------------------------------------------------------------
COPY bin/ /usr/local/lib/deepsand/
COPY seccomp-hardened.json /usr/local/lib/deepsand/seccomp-hardened.json
RUN set -eux; \
    # Strip CR from these files. A CRLF shebang makes the entrypoint unrunnable
    # inside Linux ("/usr/bin/env: 'bash\r': No such file or directory"), and that
    # failure only appears at container start, never at build time. .gitattributes
    # keeps the sources LF, but a working tree copied in by hand -- or a tarball
    # with the wrong endings -- would reintroduce it, so normalise here and make
    # the image correct regardless of how the source arrived.
    sed -i 's/\r$$//' /usr/local/lib/deepsand/*.sh /usr/local/lib/deepsand/*.mjs; \
    chmod 0755 /usr/local/lib/deepsand/*.sh /usr/local/lib/deepsand/*.mjs; \
    ln -sf /usr/local/lib/deepsand/deepsand-display.sh /usr/local/bin/deepsand-display; \
    chmod 0644 /usr/local/lib/deepsand/seccomp-hardened.json; \
    # The profile's digest travels with the image so the host can prove that the bytes it
    # hands to `--security-opt=seccomp=` are the same bytes this image was built with.
    # The profile in the image is not the profile that gets applied -- the daemon reads
    # the host's copy -- so without this the two can drift and nothing notices. Round 3
    # of the escape assessment found exactly that: the applied rule set had the
    # socket-family rules and the in-image copy did not. The digest is taken over the
    # copied bytes, with no line-ending normalisation, because it must match the host
    # file byte for byte.
    test -s /usr/local/lib/deepsand/seccomp-hardened.json; \
    sha256sum /usr/local/lib/deepsand/seccomp-hardened.json | cut -d' ' -f1 > /usr/local/lib/deepsand/seccomp-hardened.sha256; \
    chmod 0644 /usr/local/lib/deepsand/seccomp-hardened.sha256; \
    ln -sf /usr/local/lib/deepsand/entrypoint.sh /usr/local/bin/deepsand-entrypoint; \
    ln -sf /usr/local/lib/deepsand/deepsand-mcp-bridge.mjs /usr/local/bin/deepsand-mcp-bridge; \
    ln -sf /usr/local/lib/deepsand/ffdec.sh /usr/local/bin/ffdec; \
    # Fail the build rather than ship a broken shebang.
    head -n 1 /usr/local/lib/deepsand/entrypoint.sh | grep -qx '#!/usr/bin/env bash'; \
    head -n 1 /usr/local/lib/deepsand/netfilter.sh | grep -qx '#!/usr/bin/env bash'; \
    head -n 1 /usr/local/lib/deepsand/deepsand-display.sh | grep -qx '#!/usr/bin/env bash'; \
    head -n 1 /usr/local/lib/deepsand/ffdec.sh | grep -qx '#!/usr/bin/env bash'

# ---------------------------------------------------------------------------
# Agent Skills.
#
# DeepCode discovers skills from four roots, in priority order:
#
#   <project>/.deepcode/skills   <project>/.agents/skills
#   ~/.deepcode/skills           ~/.agents/skills
#
# plus a `bundled:` root inside its own package. Skills are directories holding a
# SKILL.md, and they are selected by the model from their name and description
# rather than being always-on text. That makes them the right home for the
# per-task playbook, and it matters for a second reason: `AGENTS.md` has a
# precedence trap. DeepCode loads <project>/AGENTS.md or <project>/.deepcode/
# AGENTS.md if either exists, and only falls back to ~/.deepcode/AGENTS.md when
# the project has neither. Most real repositories ship their own AGENTS.md, so a
# user-level AGENTS.md is silently ignored in exactly the projects that need it
# most. A skill has no such dependency.
#
# Installing at the user level (~/.agents/skills) rather than in the project
# keeps it out of the operator's repository, which must stay untouched.
#
# The tree is staged and installed after the "Selected tools" step, not here. Which
# skills a sandbox gets depends on the tools its image was built with; putting the COPY
# here would also make a skill edit invalidate the tool install layer below it, which is
# minutes of work for a text change.

# ---------------------------------------------------------------------------
# Git defaults.
#
# git is installed, but an unconfigured git is barely usable in a sandbox: it
# refuses to touch a bind-mounted repository ("detected dubious ownership") and
# aborts every commit ("Author identity unknown"). Both failures look like the
# project is broken rather than the sandbox being unconfigured, so the settings
# are baked in here. See runtime/gitconfig for the reasoning behind each key.
#
# System level, not global: the sandbox user's home is on the read-only image
# layer, so `git config --global` cannot write to it.
# Scratch space that exists even when no tmpfs is mounted (defensive; Deepsand
# always mounts tmpfs over /tmp and /run when the rootfs is read-only).
# ---------------------------------------------------------------------------
# Tools.
#
# One group per installer, each referencing the argument that governs it. An
# argument that a RUN does not mention does not invalidate its cache layer, so
# `$APT_PACKAGES` has to appear in the command for a changed package list to be
# noticed -- that is why these are separate from the variable declarations above.
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Selected tools
#
# One step rather than one per provider. Each provider used to have its own RUN, so a
# build showed the same nine steps whether one tool was selected or all of them: the
# work was conditional, but the log was not. Consolidating makes the log say what
# actually happened.
#
# The arguments live here, immediately before their use, because a changed ARG
# invalidates every instruction after it and nothing above this point depends on them.
# ---------------------------------------------------------------------------
# The C toolchain that `cargo install` needs is removed again once the binaries are
# built, and the Rust toolchain with it unless `cargo` was actually selected. A
# compiler inside the sandbox lowers the effort needed to develop and run local
# exploits, and one default tool (htmlq) was otherwise enough to install one.

ARG INSTALL_TOOLS=""
ARG APT_PACKAGES=""
ARG NPM_GLOBALS=""
ARG CARGO_INSTALLS=""
ARG WITH_NODE_REPO=0
ARG WITH_RUSTUP=0
ARG WITH_GO=0
ARG WITH_BREW=0
ARG WITH_NIX=0

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    --mount=type=cache,target=/root/.npm,sharing=locked \
    --mount=type=cache,target=/root/.m2,sharing=locked \
    --mount=type=bind,from=toolcache,target=/toolcache \
    set -eux; \
    # The app passes these three as comma-separated lists, because a build argument is one
    # argv entry and commas need no quoting. They are split here, once, rather than at each
    # use. The apt branch used to expand $APT_PACKAGES directly, so apt was handed the whole
    # list as a single package name and refused it:
    #
    #   E: Unable to locate package curl,git,jq,ripgrep,unzip,zip
    #
    # which meant no project whose tools needed an apt package could build an image at all.
    # A new list-valued argument gets split here too, for the same reason.
    APT_PACKAGES=$(echo "$APT_PACKAGES" | tr ',' ' '); \
    NPM_GLOBALS=$(echo "$NPM_GLOBALS" | tr ',' ' '); \
    CARGO_INSTALLS=$(echo "$CARGO_INSTALLS" | tr ',' ' '); \
    # The tools cache, filled from a previous successful build of this key. Copying the built
    # binaries in is the whole point: `cargo install` compiles for minutes, and this turns
    # that into a copy. The apt packages below are deliberately not cached -- the cache mounts
    # already cover their downloads, and moving installed system packages between images is
    # the fiddliest thing here for the smallest gain.
    #
    # Whether there *is* a cache is asked of the marker the app writes when it fills one, not of
    # the two directories. The app creates those before every build, because a build context has
    # to exist, so testing them is a test that is always true. That is how an image came to be
    # labelled `htmlq,puppeteer,wrangler` with none of the three installed: this step said "using
    # the cached tools", installed nothing, and the label written below is what
    # `deepsand_sandbox_info` hands the agent as the truth -- so the agent went looking for a
    # browser the image had told it it had. The app's own rule for using an entry is that same
    # marker (`toolcache::FILLED_MARKER`), and the two answers have to agree.
    TOOLS_CACHED=0; \
    if [ -f /toolcache/filled-at ]; then \
      echo "deepsand: using the cached tools"; \
      mkdir -p /usr/local/bin /usr/local/lib/node_modules; \
      cp -a /toolcache/bin/. /usr/local/bin/ 2>/dev/null || true; \
      cp -a /toolcache/node_modules/. /usr/local/lib/node_modules/ 2>/dev/null || true; \
      TOOLS_CACHED=1; \
    else \
      echo "deepsand: no tools cache for this key; the tools are installed below"; \
    fi; \
    if [ -z "$INSTALL_TOOLS" ]; then \
      echo "deepsand: no tools selected for this project"; \
    else \
      echo "deepsand: tools for this image: $INSTALL_TOOLS"; \
    fi; \
    if [ "$WITH_NODE_REPO" = "1" ]; then \
      curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -; \
      apt-get install -y --no-install-recommends nodejs; \
    fi; \
    if [ -n "$APT_PACKAGES" ]; then \
      echo "deepsand: apt-get install $APT_PACKAGES"; \
      apt-get update; \
      apt-get install -y --no-install-recommends $APT_PACKAGES; \
    fi; \
    if [ "$WITH_GO" = "1" ]; then \
      echo "deepsand: apt-get install golang-go"; \
      apt-get update; \
      apt-get install -y --no-install-recommends golang-go; \
    fi; \
    if [ -n "$NPM_GLOBALS" ]; then \
      for pkg in $NPM_GLOBALS; do \
        # Asked one package at a time, and asked of npm, rather than taken from $TOOLS_CACHED:
        # a cache entry can hold the marker and still be missing a package, and the listing a
        # tool produces about itself is what says whether it is there. A cache is an
        # accelerator, not an authority, so a partial entry heals itself here instead of
        # becoming an image that claims to have a tool it does not have.
        if npm ls -g --depth=0 "$pkg" >/dev/null 2>&1; then \
          echo "deepsand: $pkg is already installed"; \
        else \
          echo "deepsand: npm install -g $pkg"; \
          # The driver only, never the browser: a postinstall download here is a download before
          # the libraries a browser needs are on the system, and when it fails partway it leaves
          # a browser folder with no executable in it -- which then makes *every* later attempt
          # refuse with "the browser folder exists but the executable does not". That is the state
          # a real machine was found in: the package present, the cache directory present, and no
          # browser in it. The browser is fetched deliberately below, after the libraries, and an
          # image that cannot fetch one fails the build instead of shipping without it.
          PUPPETEER_SKIP_DOWNLOAD=1 npm install -g --no-fund --no-audit --fetch-retries=2 --fetch-timeout=60000 --fetch-retry-maxtimeout=30000 "$pkg@latest"; \
        fi; \
      done; \
    fi; \
    # The REA tool is an MCP server as well as a CLI, and the generated DeepCode
    # settings name `rea` as its command whenever it is selected. An image labelled
    # `rea` without the binary is therefore not just a thinner image: it is a sandbox
    # whose settings point at a program that is not there. Check the two things the
    # npm install cannot guarantee on its own -- that the Node runtime is one REA
    # supports, and that the executable is actually on PATH -- and fail the build
    # rather than ship the claim.
    case ",$INSTALL_TOOLS," in \
      *,rea,*) \
        echo "deepsand: checking the REA install"; \
        node -e 'const [major, minor] = process.versions.node.split(".").map(Number); const ok = (major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26; if (!ok) { console.error("deepsand: rea needs Node 22.19+, 24.11+ or 26+, but this image has " + process.versions.node); process.exit(1); }'; \
        if ! command -v rea >/dev/null 2>&1; then \
          echo "deepsand: rea was selected but is not on PATH; the npm global install did not produce its launcher" >&2; \
          exit 1; \
        fi; \
        rea --version; \
        ;; \
    esac; \
    # The Java half of the `dejared` tool. The npm package is only a wrapper: on first run it
    # downloads a ~25 MB JAR from GitHub Releases into a cache directory and then spawns
    # `java -jar`. Two things the base image does not have, and one thing the sandbox must not
    # do at run time:
    #
    #   * Java 17+. Installed here, because the wrapper needs a JRE on PATH.
    #   * The JAR itself. Fetched during the build, into the exact versioned path the wrapper
    #     computes from the installed package and `XDG_CACHE_HOME` (settings.json sets that to
    #     the cache root below). Without this the first MCP start would need a route to GitHub,
    #     which a `none` or allowlisted sandbox does not have.
    #   * `unzip` only for the integrity check below; it is not needed at run time.
    #
    # The JAR is versioned by the npm package that was just installed, not by a constant here,
    # so the two cannot disagree about which release the wrapper is expecting.
    case ",$INSTALL_TOOLS," in \
      *,dejared,*) \
        echo "deepsand: installing the Java runtime for dejared"; \
        apt-get update; \
        apt-get install -y --no-install-recommends openjdk-17-jre-headless unzip zip; \
        DEJARED_PACKAGE=/usr/local/lib/node_modules/dejared-mcp/package.json; \
        if [ ! -f "$DEJARED_PACKAGE" ]; then \
          echo "deepsand: dejared was selected but its npm package is not installed" >&2; \
          exit 1; \
        fi; \
        DEJARED_VERSION=$(node -p "require('$DEJARED_PACKAGE').version"); \
        DEJARED_JAR="/usr/local/share/dejared-mcp/cache/dejared-mcp/dejared-mcp-${DEJARED_VERSION}.jar"; \
        mkdir -p "$(dirname "$DEJARED_JAR")"; \
        echo "deepsand: fetching dejared-mcp v${DEJARED_VERSION}"; \
        if ! curl -fsSL --retry 2 --retry-delay 2 --max-time 180 \
             "https://github.com/hqkh4nh/dejared-mcp/releases/download/v${DEJARED_VERSION}/dejared-mcp-${DEJARED_VERSION}.jar" \
             -o "$DEJARED_JAR"; then \
          echo "deepsand: could not download dejared-mcp ${DEJARED_VERSION} from GitHub Releases" >&2; \
          exit 1; \
        fi; \
        test -s "$DEJARED_JAR"; \
        unzip -t "$DEJARED_JAR" >/dev/null; \
        unzip -p "$DEJARED_JAR" META-INF/MANIFEST.MF | grep -q '^Main-Class:'; \
        java -version; \
        if ! command -v dejared-mcp >/dev/null 2>&1; then \
          echo "deepsand: dejared was selected but its launcher is not on PATH" >&2; \
          exit 1; \
        fi; \
        chmod -R a+rX /usr/local/share/dejared-mcp; \
        ;; \
    esac; \
    # The `ffdec` tool is a source build, not a package. ffdec-mcp is compiled against the
    # JPEXS `ffdec_lib` and has no published package or release asset; the image therefore
    # downloads the pinned source, builds it with a JDK 25, keeps a JRE 25 to run it, and
    # removes the JDK, Maven and source afterwards. The same step installs the upstream
    # JPEXS FFDec CLI, because the MCP surface does not wrap every exporter the original
    # application has (images, sounds, shapes, SWF/XML, tag dumps). That CLI is what
    # `/usr/local/bin/ffdec` runs; it is not a second install the agent has to arrange.
    #
    # Everything is pinned: the ffdec-mcp tag, the ffdec_lib release the pom is written
    # against, the JPEXS CLI release, Maven and the Temurin 25 builds. A moving tag here
    # would make two builds of the same image disagree about what the tool is.
    case ",$INSTALL_TOOLS," in \
      *,ffdec,*) \
        echo "deepsand: building ffdec-mcp and installing the JPEXS FFDec CLI"; \
        apt-get update; \
        apt-get install -y --no-install-recommends unzip; \
        FFDEC_TMP=/tmp/ffdec-build; \
        rm -rf "$FFDEC_TMP"; \
        mkdir -p "$FFDEC_TMP/jdk" "$FFDEC_TMP/maven" "$FFDEC_TMP/src" "$FFDEC_TMP/ffdec_lib"; \
        echo "deepsand: fetching JDK 25 for the ffdec-mcp build"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 600 \
          "https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.4.1%2B1/OpenJDK25U-jdk_x64_linux_hotspot_25.0.4.1_1.tar.gz" \
          -o "$FFDEC_TMP/jdk25.tar.gz"; \
        tar -xzf "$FFDEC_TMP/jdk25.tar.gz" -C "$FFDEC_TMP/jdk" --strip-components=1; \
        echo "deepsand: fetching JRE 25 for the runtime"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 600 \
          "https://github.com/adoptium/temurin25-binaries/releases/download/jdk-25.0.4.1%2B1/OpenJDK25U-jre_x64_linux_hotspot_25.0.4.1_1.tar.gz" \
          -o "$FFDEC_TMP/jre25.tar.gz"; \
        mkdir -p /opt/java25; \
        tar -xzf "$FFDEC_TMP/jre25.tar.gz" -C /opt/java25 --strip-components=1; \
        echo "deepsand: fetching Maven"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 120 \
          "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.tar.gz" \
          -o "$FFDEC_TMP/maven.tar.gz"; \
        tar -xzf "$FFDEC_TMP/maven.tar.gz" -C "$FFDEC_TMP/maven" --strip-components=1; \
        echo "deepsand: fetching ffdec-mcp v1.0.0"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 120 \
          "https://github.com/Xeleron/ffdec-mcp/archive/refs/tags/v1.0.0.tar.gz" \
          -o "$FFDEC_TMP/ffdec-mcp.tar.gz"; \
        tar -xzf "$FFDEC_TMP/ffdec-mcp.tar.gz" -C "$FFDEC_TMP/src" --strip-components=1; \
        echo "deepsand: fetching ffdec_lib 25.1.3"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 300 \
          "https://github.com/jindrapetrik/jpexs-decompiler/releases/download/version25.1.3/ffdec_lib_25.1.3.zip" \
          -o "$FFDEC_TMP/ffdec_lib.zip"; \
        unzip -q "$FFDEC_TMP/ffdec_lib.zip" -d "$FFDEC_TMP/ffdec_lib"; \
        # The pom declares ffdec_lib 1.0.0. The upstream Dockerfile installs the same JAR
        # as 25.1.3, which does not satisfy that dependency; install it under the version
        # the pom actually asks for.
        JAVA_HOME="$FFDEC_TMP/jdk" "$FFDEC_TMP/maven/bin/mvn" -B install:install-file \
          -Dfile="$FFDEC_TMP/ffdec_lib/ffdec_lib.jar" \
          -DgroupId=com.jpexs -DartifactId=ffdec_lib -Dversion=1.0.0 -Dpackaging=jar; \
        (cd "$FFDEC_TMP/src" && JAVA_HOME="$FFDEC_TMP/jdk" "$FFDEC_TMP/maven/bin/mvn" -B -DskipTests package); \
        mkdir -p /usr/local/share/ffdec-mcp; \
        cp "$FFDEC_TMP/src/target/ffdec-mcp-server-1.0.0.jar" /usr/local/share/ffdec-mcp/ffdec-mcp.jar; \
        test -s /usr/local/share/ffdec-mcp/ffdec-mcp.jar; \
        echo "deepsand: fetching the JPEXS FFDec CLI"; \
        curl -fsSL --retry 2 --retry-delay 2 --max-time 300 \
          "https://github.com/jindrapetrik/jpexs-decompiler/releases/download/version26.3.0/ffdec_26.3.0.zip" \
          -o "$FFDEC_TMP/ffdec.zip"; \
        mkdir -p /usr/local/share/ffdec; \
        unzip -q "$FFDEC_TMP/ffdec.zip" -d /usr/local/share/ffdec; \
        test -s /usr/local/share/ffdec/ffdec-cli.jar; \
        # Both halves are checked before the image is declared built: a JAR with no
        # Main-Class and a CLI that cannot start are the failures this step exists to
        # catch, and neither would show up until the first sandbox session.
        /opt/java25/bin/java -version; \
        ffdec -help >/dev/null; \
        unzip -p /usr/local/share/ffdec-mcp/ffdec-mcp.jar META-INF/MANIFEST.MF | grep -q '^Main-Class:'; \
        # The `ffdec -help` check creates the CLI's writable home and its Jansi library
        # under it. They are run-time state, not image content; the wrapper recreates them
        # on first use. Remove them so the check leaves nothing in the image.
        rm -rf /tmp/ffdec-home /home/deepcode/.deepcode/ffdec-tmp; \
        rm -rf "$FFDEC_TMP"; \
        chmod -R a+rX /opt/java25 /usr/local/share/ffdec /usr/local/share/ffdec-mcp; \
        ;; \
    esac; \
    # The browser half of the `puppeteer` tool, which is two things the base image does not have.
    #
    # The npm package is the driver, not the browser: it installs in seconds and leaves puppeteer
    # pointing at a Chromium that was never fetched. And a browser links against a screenful of
    # libraries -- libnss3, libgbm, libatk, libcups and the rest -- none of which are here. So the
    # tool was described as "a browser controlled from Node, with its own copy of Chromium" while
    # delivering neither half, and an agent asked for a screenshot spent the turn finding that out
    # (measured here: it fetched Chrome by hand, could not run it for missing libraries, and gave
    # up). This step is what makes that description true.
    #
    # Gated on the tool id rather than on the plan's apt list, because these libraries are needed
    # by the browser rather than chosen by the operator: one is meaningless without the other.
    case ",$INSTALL_TOOLS," in \
      *,puppeteer*) \
        echo "deepsand: installing the libraries a browser links against"; \
        apt-get update; \
        # `unzip` is in this list on purpose rather than borrowed from the `zip` tool: without it
        # the browser *downloads* and then cannot be extracted -- "no zip archiver is available"
        # -- and because the fetch that does this is a postinstall, the failure is swallowed and
        # the image ends up claiming a browser it does not have. That is the failure this step
        # exists to end, so it must not depend on another tool being switched on.
        apt-get install -y --no-install-recommends \
          libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 \
          libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libx11-xcb1 \
          libpango-1.0-0 libcairo2 libasound2 libdbus-1-3 libgtk-3-0 \
          fonts-liberation xdg-utils unzip; \
        # Fetched now, into the directory the sandbox's own puppeteer looks in: HOME is
        # /home/deepcode and the sandbox runs as uid 1000, so the cache has to be there and
        # owned by them, not left in root's home where nothing will ever read it.
        export PUPPETEER_CACHE_DIR=/home/deepcode/.cache/puppeteer; \
        # Emptied first, because a browser folder with no executable in it is worse than none:
        # puppeteer sees the folder and refuses to fetch, reporting "the browser folder exists but
        # the executable does not" instead of repairing it. Nothing else lives in here.
        rm -rf "$PUPPETEER_CACHE_DIR"; \
        mkdir -p "$PUPPETEER_CACHE_DIR"; \
        if ! node /usr/local/lib/node_modules/puppeteer/install.mjs; then \
          # A future package may move that entry point; the documented way to fetch a browser is
          # the package's own cli, which is already on PATH because the package is installed.
          echo "deepsand: falling back to the puppeteer cli"; \
          npx --no-install puppeteer browsers install chrome || true; \
        fi; \
        # Verified rather than assumed, and verified as the sandbox user: an image that says it
        # has puppeteer and has no browser is the exact failure this step exists to remove, so a
        # build that cannot produce one fails here instead of shipping.
        if ! setpriv --reuid=1000 --regid=1000 --clear-groups \
             env HOME=/home/deepcode PUPPETEER_CACHE_DIR="$PUPPETEER_CACHE_DIR" \
             node -e 'const p=require("/usr/local/lib/node_modules/puppeteer"); p.executablePath().then((f)=>process.exit(require("fs").existsSync(f)?0:1),()=>process.exit(1))'; then \
          echo "deepsand: the browser could not be fetched or is not where the sandbox user looks; the puppeteer tool is not usable without it" >&2; \
          exit 1; \
        fi; \
        chown -R 1000:1000 "$PUPPETEER_CACHE_DIR"; \
        echo "deepsand: browser ready at $PUPPETEER_CACHE_DIR"; \
        ;; \
    esac; \
    if [ "$WITH_RUSTUP" = "1" ]; then \
      export RUSTUP_HOME=/home/deepcode/.rustup CARGO_HOME=/home/deepcode/.cargo; \
      if ! command -v cargo >/dev/null 2>&1; then \
        echo "deepsand: installing rustup"; \
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
          | sh -s -- -y --no-modify-path --profile minimal; \
      fi; \
    fi; \
    if [ "$TOOLS_CACHED" = "0" ] && [ -n "$CARGO_INSTALLS" ]; then \
      echo "deepsand: cargo install $CARGO_INSTALLS"; \
      # Skipped only for an entry the app marked as filled, which since the marker rule above
      # means one built by a run of this step -- so the compiled binaries are in the tree that
      # was just copied in. Unlike the npm globals there is no per-crate listing to ask here:
      # the cache holds binaries, and a crate's binary is not always named after it.
      # A minimal C toolchain. `cargo install` links its output and fails with
      # "linker `cc` not found" without one, and the default tool set includes a
      # cargo-installed program -- so without this the default image could not be
      # built at all unless the operator happened to also want the full build tools.
      apt-get update; \
      apt-get install -y --no-install-recommends gcc libc6-dev; \
      export RUSTUP_HOME=/home/deepcode/.rustup CARGO_HOME=/home/deepcode/.cargo; \
      export PATH="$CARGO_HOME/bin:$PATH"; \
      if ! command -v cargo >/dev/null 2>&1; then \
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
          | sh -s -- -y --no-modify-path --profile minimal; \
      fi; \
      for crate in $CARGO_INSTALLS; do \
        cargo install --locked --root /usr/local "$crate"; \
      done; \
      apt-get purge -y gcc libc6-dev || true; \
      apt-get autoremove -y || true; \
      case ",$INSTALL_TOOLS," in \
        *,cargo*) echo "deepsand: keeping the Rust toolchain, cargo was selected"; ;; \
        *) rm -rf /home/deepcode/.cargo /home/deepcode/.rustup; ;; \
      esac; \
    fi; \
    if [ "$WITH_BREW" = "1" ]; then \
      export NONINTERACTIVE=1; \
      export HOME=/home/deepcode; \
      mkdir -p /home/deepcode/.linuxbrew; \
      curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash; \
    fi; \
    if [ "$WITH_NIX" = "1" ]; then \
      apt-get update; \
      apt-get install -y --no-install-recommends xz-utils; \
      # A downloaded script rather than `sh <(...)`: process substitution is a bash
      # feature, and the Dockerfile's shell is dash, where it is a *parse* error that
      # fails the RUN even when this branch is not taken.
      curl -L https://nixos.org/nix/install -o /tmp/nix-install.sh; \
      sh /tmp/nix-install.sh --no-daemon --yes; \
    fi

# ---------------------------------------------------------------------------
# Skills for the tools this image actually carries
#
# A skill is not documentation sitting in a folder; DeepCode offers it to the model by
# name and description, and the model may act on it. Installing a playbook for a tool
# that is not in the image is therefore worse than installing nothing: the model reads
# a capability it cannot use and reports the sandbox as broken. The always-on skills
# explain the sandbox itself; a tool's skill is copied only when that tool is part of
# this image's selection, which is the same value the install plan above used.
#
# The staged tree is removed afterwards. It is not a discovery root, and leaving it
# behind would keep the playbook of an unselected tool inside the image even though no
# scan can see it.
#
# The COPY sits here, after the tools layer, so editing a skill does not invalidate the
# tool install above it. A skill is text; re-running a multi-minute install for it would
# be the same mistake the ARG placement earlier in this file exists to avoid.
# ---------------------------------------------------------------------------
COPY skills/ /usr/local/share/deepsand/skills/
RUN set -eux; \
    # Same CR caveat as the shell scripts: a stray CR inside a frontmatter line
    # or a fence would corrupt the skill body.
    find /usr/local/share/deepsand/skills -type f -exec sed -i 's/\r$$//' {} +; \
    # Every skill must be a directory containing a readable SKILL.md with a name,
    # or DeepCode will silently skip it.
    for skill in /usr/local/share/deepsand/skills/*/; do \
        test -f "$skill/SKILL.md"; \
        grep -q '^name:' "$skill/SKILL.md"; \
        grep -q '^description:' "$skill/SKILL.md"; \
    done

RUN set -eux; \
    mkdir -p /home/deepcode/.agents/skills; \
    for skill in deepsand-permissions deepsand-toolbox; do \
        cp -a "/usr/local/share/deepsand/skills/$skill" /home/deepcode/.agents/skills/; \
    done; \
    case ",$INSTALL_TOOLS," in \
      *,rea,*) \
        cp -a /usr/local/share/deepsand/skills/deepsand-rea /home/deepcode/.agents/skills/; \
        ;; \
    esac; \
    case ",$INSTALL_TOOLS," in \
      *,dejared,*) \
        cp -a /usr/local/share/deepsand/skills/deepsand-dejared /home/deepcode/.agents/skills/; \
        ;; \
    esac; \
    case ",$INSTALL_TOOLS," in \
      *,ffdec,*) \
        cp -a /usr/local/share/deepsand/skills/deepsand-ffdec /home/deepcode/.agents/skills/; \
        ;; \
    esac; \
    # Every installed skill has to be discoverable: a directory with a SKILL.md whose
    # frontmatter carries a name and a description. This asserts the installed tree,
    # because that is the tree the CLI scans.
    for skill in /home/deepcode/.agents/skills/*/; do \
        test -f "$skill/SKILL.md"; \
        grep -q '^name:' "$skill/SKILL.md"; \
        grep -q '^description:' "$skill/SKILL.md"; \
    done; \
    # A tool's skill must not survive into an image without the tool. The copy is gated
    # above; this is the assertion that the gate is the only way in.
    if [ -d /home/deepcode/.agents/skills/deepsand-rea ]; then \
      case ",$INSTALL_TOOLS," in \
        *,rea,*) ;; \
        *) echo "deepsand: the rea skill is present but the rea tool is not selected" >&2; exit 1 ;; \
      esac; \
    fi; \
    if [ -d /home/deepcode/.agents/skills/deepsand-dejared ]; then \
      case ",$INSTALL_TOOLS," in \
        *,dejared,*) ;; \
        *) echo "deepsand: the dejared skill is present but the dejared tool is not selected" >&2; exit 1 ;; \
      esac; \
    fi; \
    if [ -d /home/deepcode/.agents/skills/deepsand-ffdec ]; then \
      case ",$INSTALL_TOOLS," in \
        *,ffdec,*) ;; \
        *) echo "deepsand: the ffdec skill is present but the ffdec tool is not selected" >&2; exit 1 ;; \
      esac; \
    fi; \
    chown -R 1000:1000 /home/deepcode/.agents; \
    chmod -R a+rX /home/deepcode/.agents; \
    rm -rf /usr/local/share/deepsand/skills

# The system git config, applied after the tools so `git` exists when it was selected.
# A project without git still gets the file -- harmless -- but there is nothing to
# verify it against, so the check is skipped rather than failing the build.
COPY gitconfig /etc/gitconfig
RUN set -eux; \
    sed -i 's/\r//g' /etc/gitconfig; \
    chmod 0644 /etc/gitconfig; \
    if command -v git >/dev/null 2>&1; then \
      # Prove git actually reads it, because a config in the wrong place fails
      # silently and produces the very errors this is meant to prevent.
      # `grep -x` matches a whole line, so no anchors (and no `$`, which would have
      # to be escaped for the Dockerfile) are involved.
      git config --system --get safe.directory | grep -qx '[*]'; \
      git config --system --get user.email | grep -qx 'deepcode@deepsand.invalid'; \
      git config --system --get init.defaultBranch | grep -qx 'main'; \
    else \
      echo "deepsand: git was not selected, so the system config is not verified"; \
    fi

# Tool directories have to be on PATH or the tools are installed but unusable: a
# cargo-installed program lands in $CARGO_HOME/bin, which is not on the base image's
# PATH. Listing every home-relative location a provider might use means adding a
# provider later does not silently produce an invisible tool.
ENV PATH="/home/deepcode/.cargo/bin:/home/deepcode/.local/bin:/home/deepcode/.nix-profile/bin:/home/deepcode/.linuxbrew/bin:${PATH}"

# Record what the image was built with, so "which tools does this project have" is
# answerable from the image itself rather than by rebuilding the answer from settings
# that may since have changed.
# ---------------------------------------------------------------------------
# DeepCode CLI
#
# Last, and that placement is the point: anything after it is invalidated whenever this layer
# is, and at the end of the file that costs one layer rather than the whole image.
#
# The app resolves `latest` from npm on every start and passes it as DEEPCODE_CLI_VERSION, so
# the version here is pinned to what the registry actually offered. DEEPCODE_REFRESH is then
# `pinned`, which makes this layer's cache key the version itself: a build for another reason
# (a tool change) reuses it, and a new release changes the key. Only when the app could not
# reach npm does it pass a timestamp instead, because an unpinned `@latest` install is the one
# case the layer cache cannot see. An npm cache mount backs both, so even an unpinned install
# fetches only what changed.
# ---------------------------------------------------------------------------
ARG DEEPCODE_REFRESH=0
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    set -eux; \
    echo "deepsand: installing DeepCode (refresh $DEEPCODE_REFRESH)"; \
    # A refresh that cannot reach the registry must not fail a build that already has a
    # working copy -- from the tools cache or from this image's own layer. It is still a
    # failure with no copy at all: an image without the CLI starts and does nothing.
    # npm's own fetch limits bound the attempt.
    if ! npm install -g --no-fund --no-audit --fetch-retries=2 --fetch-timeout=60000 --fetch-retry-maxtimeout=30000 "@vegamo/deepcode-cli@${DEEPCODE_CLI_VERSION}"; then \
      if [ -d /usr/local/lib/node_modules/@vegamo ]; then \
        echo "deepsand: could not refresh DeepCode; keeping the copy already here"; \
      else \
        echo "deepsand: could not install DeepCode and there is no copy to fall back on"; \
        exit 1; \
      fi; \
    fi; \
    deepcode --version

LABEL deepsand.tools="$INSTALL_TOOLS"
LABEL deepsand.deepcode.refresh="$DEEPCODE_REFRESH"
# What was actually asked for, so the host can tell whether this image's CLI is still current
# without starting a container to ask it. The host passes the version it resolved from npm and
# compares it with this label on every start; when they differ it rebuilds this layer first.
# See crates/deepsand-core/src/cli.rs.
LABEL deepsand.deepcode.version="$DEEPCODE_CLI_VERSION"

RUN set -eux; \
    chown -R 1000:1000 /home/deepcode/.cargo /home/deepcode/.rustup /home/deepcode/.linuxbrew /home/deepcode/.nix-profile 2>/dev/null || true

RUN mkdir -p /deepsand/ipc/requests /deepsand/ipc/responses /deepsand/state /workspace

WORKDIR /workspace

# The entrypoint starts as root only long enough to apply the egress policy and
# repair volume ownership, then irreversibly drops to uid 1000 before exec'ing
# DeepCode. See bin/entrypoint.sh.
ENTRYPOINT ["/usr/local/lib/deepsand/entrypoint.sh"]
CMD ["deepcode"]
