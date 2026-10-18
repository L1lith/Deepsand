//! Claims about `runtime/Dockerfile` that can be checked without Docker.
//!
//! The image build is the one part of Deepsand that needs a container, a network and
//! several minutes, which is exactly why a bug in it is expensive: it is found by an
//! operator pressing Run, not by a test run.

use std::path::PathBuf;

fn dockerfile() -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("Dockerfile");
    std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()))
}

/// The app passes the tool plan to the image as comma-separated lists, because a build
/// argument is a single argv entry and commas need no quoting. Whatever consumes one has
/// to split it first.
///
/// The apt branch did not, so apt was handed the whole list as one package name:
///
///     E: Unable to locate package curl,git,jq,ripgrep,unzip,zip
///
/// and every project whose tools needed an apt package failed to build its image -- in
/// four seconds, with an error that said only "the build failed; see the build log
/// above". This test is cheap and would have caught it.
#[test]
fn every_comma_separated_build_argument_is_split_before_it_is_used() {
    let text = dockerfile();

    let apt_use = text
        .find("apt-get install -y --no-install-recommends $APT_PACKAGES")
        .expect("the apt branch takes $APT_PACKAGES");
    let npm_use = text
        .find("for pkg in $NPM_GLOBALS")
        .expect("the npm branch iterates $NPM_GLOBALS");
    let cargo_use = text
        .find("for crate in $CARGO_INSTALLS")
        .expect("the cargo branch iterates $CARGO_INSTALLS");

    for (name, use_at) in [
        ("APT_PACKAGES", apt_use),
        ("NPM_GLOBALS", npm_use),
        ("CARGO_INSTALLS", cargo_use),
    ] {
        // Split once, near the top of the step, rather than at each use: the bug was a
        // branch that forgot, and a shared split cannot be forgotten.
        let split = format!("{name}=$(echo \"${name}\" | tr ',' ' ')");
        let split_at = text.find(&split).unwrap_or_else(|| {
            panic!(
                "{name} is used at byte {use_at} but never split on commas. The app sends it \
                 comma-separated, so whatever reads it sees one item."
            )
        });
        assert!(
            split_at < use_at,
            "{name} is split at byte {split_at} but used at {use_at}: the split has to come first"
        );
    }
}

/// The split has to be a reassignment of the same name, so a later branch cannot
/// accidentally use the unsplit value it was given.
#[test]
fn no_branch_re_splits_a_list_that_was_already_split() {
    let text = dockerfile();
    for name in ["APT_PACKAGES", "NPM_GLOBALS", "CARGO_INSTALLS"] {
        let inline = format!("$(echo \"${name}\" | tr ',' ' ')");
        // Exactly once, at the normalisation, and not again inside a loop.
        assert_eq!(
            text.matches(&inline).count(),
            1,
            "{name} should be split exactly once, where it is normalised"
        );
    }
}

/// The build and the app have to agree on what "there is a cache" means, and they have to agree
/// on it in the direction that fails safe.
///
/// They did not. `toolcache::prepare_entry` creates `bin/` and `node_modules/` before every build
/// -- a build context has to exist -- and the build tested for exactly those directories. So the
/// test was always true, every build took the "cached" path, and no npm global or cargo tool was
/// ever installed. The images were then labelled with the tools that were *asked for*:
/// `htmlq,puppeteer,wrangler`, none of which were in them, verified against a real image built
/// here. The label is what `deepsand_sandbox_info` reports to the agent as the truth, so an agent
/// went hunting for a browser its own sandbox had told it it had.
///
/// The marker is the signal the app itself uses (`toolcache::cache_is_usable`), so this asserts
/// both halves read it and that the marker name has not drifted apart.
#[test]
fn a_tools_cache_is_only_used_when_the_app_says_it_is_filled() {
    let text = dockerfile();
    let marker = deepsand_core::toolcache::FILLED_MARKER;

    assert!(
        text.contains(&format!("[ -f /toolcache/{marker} ]")),
        "the tools step has to ask for the marker the app writes ({marker}), not for the \
         directories the app always creates. Testing those is a test that is always true, and \
         the image then claims tools that were never installed."
    );
    assert!(
        !text.contains("[ -d /toolcache/bin ]"),
        "the tools step must not decide from the cache directories: the app creates them before \
         every build, so that test is always true"
    );
}

/// A cache entry is an accelerator, not an authority.
///
/// Even with the marker agreed on, an entry can be missing one package. The npm branch therefore
/// asks npm about each package rather than trusting the entry, which is the same rule
/// `tool_updates.rs` follows when it compares "the listing the tools produced" rather than what
/// the cache was asked for -- and it means a partial entry heals itself instead of producing an
/// image that claims a tool it does not have.
#[test]
fn every_npm_global_is_verified_against_npm_before_the_cache_stands_in_for_it() {
    let text = dockerfile();
    let verify = text.find("npm ls -g --depth=0 \"$pkg\"").expect(
        "the npm branch has to ask npm whether the package is there, not assume it from a cache",
    );
    let after = &text[verify..];
    let install = after
        .find("npm install -g --no-fund")
        .expect("and install it when npm says it is missing");
    let otherwise = after
        .find("else")
        .expect("the install belongs in the branch that is missing the package");

    // The check comes first, and the install is what happens when it fails -- not a step beside
    // it, which would run either way.
    assert!(
        otherwise < install,
        "the install has to be the `else` of npm's own answer, not a second unconditional step"
    );
    assert!(
        !text.contains("if [ \"$TOOLS_CACHED\" = \"0\" ] && [ -n \"$NPM_GLOBALS\" ]"),
        "the npm installs must not be gated on the cache as a whole: that is what skipped them"
    );
}

/// The cache key has to move when the install steps move, and this file is the one where that can
/// be checked against the real Dockerfile rather than a fixture.
///
/// `toolcache`'s own test of this used a fixture with no base layer, so its first apt-mounting
/// `RUN` was the tools layer -- while the real file's base apt layer carries that same mount and
/// comes first. The fingerprint therefore covered the base layer, and a change to the install
/// steps left the key alone: a build would take the "cached" path into an entry the previous,
/// broken step had filled. That is why this is asserted here, against the shipping file.
#[test]
fn the_tools_fingerprint_comes_from_the_real_tools_layer() {
    use deepsand_core::toolcache::tools_layer_fingerprint;

    let text = dockerfile();
    let before = tools_layer_fingerprint(&text);
    assert!(!before.is_empty(), "the real Dockerfile has a tools layer to fingerprint");

    // Something well outside the tools layer must not disturb it.
    let elsewhere = text.replace(
        "LABEL org.opencontainers.image.licenses=\"MIT\"",
        "LABEL org.opencontainers.image.licenses=\"MIT-0\"",
    );
    assert_ne!(
        text, elsewhere,
        "the test anchor moved, so this proves nothing: pick another line outside the tools layer"
    );
    assert_eq!(
        before,
        tools_layer_fingerprint(&elsewhere),
        "a change outside the tools layer must not change the cache key, or every runtime edit \
         recompiles the tools"
    );

    // The gate that decides whether a cache entry is used at all is *in* the tools layer, so a
    // fix to it has to produce a key that does not name an entry the broken version filled.
    let gated = text.replace("[ -f /toolcache/filled-at ]", "[ -d /toolcache/bin ]");
    assert_ne!(
        before,
        tools_layer_fingerprint(&gated),
        "the cache gate is part of the tools layer: changing it has to change the key, or the fix \
         is applied by a build that reuses the entry the broken step filled"
    );
}

/// The `puppeteer` tool promises "a browser controlled from Node, with its own copy of Chromium",
/// and for a while it delivered neither half: the npm package installs in seconds and fetches no
/// browser, and a browser links against libraries this base image does not carry. An agent asked
/// for a screenshot spent its turn finding that out and then reported the sandbox as having no
/// browser. Each of these assertions is one of the things that has to be true for the description
/// to be honest, and each was false at some point today.
#[test]
fn the_browser_the_puppeteer_tool_promises_is_actually_built_in() {
    let text = dockerfile();

    // Gated on the tool, not on the plan's apt list: the libraries are needed by the browser
    // rather than chosen by the operator.
    assert!(
        text.contains("case \",$INSTALL_TOOLS,\" in") && text.contains("*,puppeteer*)"),
        "the browser step has to be gated on the puppeteer tool being selected"
    );

    // The libraries a browser links against, without which it downloads and cannot start.
    for lib in ["libnss3", "libgbm1", "libatk1.0-0", "libcups2", "libpango-1.0-0"] {
        assert!(
            text.contains(lib),
            "the browser step no longer installs {lib}: a browser that cannot link is a browser \
             that does not start, whichever half of the tool is installed"
        );
    }

    // Without an archiver the browser downloads and cannot be unpacked, and because that happens
    // inside a package's postinstall the failure is swallowed -- which is exactly how an image
    // came to hold the driver and no browser. It must not depend on the `zip` tool being on.
    assert!(
        text.contains("fonts-liberation xdg-utils unzip;"),
        "the browser step has to install unzip itself: extraction is not optional and the failure \
         is silent"
    );

    // The package's own postinstall download is what leaves a browser folder with no executable
    // in it, which then makes every later fetch refuse to repair it.
    assert!(
        text.contains("PUPPETEER_SKIP_DOWNLOAD=1 npm install"),
        "the npm install has to skip the postinstall download, or it leaves a half-fetched \
         browser folder that blocks the real fetch"
    );
    assert!(
        text.contains("rm -rf \"$PUPPETEER_CACHE_DIR\""),
        "the fetch has to start from an empty cache: puppeteer refuses to fill a browser folder \
         that exists without an executable in it"
    );

    // Fetched for the sandbox user, and checked as that user rather than assumed: an image that
    // says puppeteer and has no browser is the whole failure being fixed here.
    assert!(
        text.contains("setpriv --reuid=1000 --regid=1000 --clear-groups"),
        "the browser has to be verified as the sandbox user, because that is who will look for it"
    );
    assert!(
        text.contains("the browser could not be fetched or is not where the sandbox user looks"),
        "a build that cannot produce a browser has to fail, not ship an image that claims one"
    );
}

fn entrypoint() -> String {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("bin")
        .join("entrypoint.sh");
    std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()))
}

/// The generated operator-instructions skill crosses three files: the host writes it into the
/// config directory, the entrypoint copies it into the container, and DeepCode discovers it by
/// directory name. Only one of those names exists twice, and a mismatch fails in the quietest
/// possible way -- the model simply never sees the operator's instructions in exactly the projects
/// whose own `AGENTS.md` shadows the generated file.
#[test]
fn the_entrypoint_installs_the_operator_skill_under_the_name_the_host_writes() {
    let text = entrypoint();
    let name = deepsand_core::settings::OPERATOR_SKILL_NAME;

    assert!(
        text.contains(&format!("\nOPERATOR_SKILL_NAME={name}\n")),
        "the shell's copy of the name has to match settings::OPERATOR_SKILL_NAME ({name})"
    );

    // One of DeepCode's four skill roots, reached from the writable side: this is the user-level
    // `~/.deepcode/skills`, and the read-only rootfs is why it is not `~/.agents/skills`.
    assert!(
        text.contains("SKILL_DIR=\"$DEEPCODE_DIR/skills/$OPERATOR_SKILL_NAME\""),
        "the skill has to land in a directory DeepCode scans"
    );
    assert!(
        text.contains(&format!(
            "/etc/deepsand/skills/$OPERATOR_SKILL_NAME/SKILL.md"
        )),
        "and it has to be read from the config mount, which is where the host writes it \
         ({} in the container)",
        deepsand_core::settings::CONTAINER_CONFIG_DIR
    );

    // Removal comes first, and that order is the point: the home volume survives the container, so
    // a skill that outlives its reason would go on instructing later sessions from a file nobody
    // looks at.
    let remove = text
        .find("rm -rf \"$SKILL_DIR\"")
        .expect("the generated skill directory has to be reclaimed before it is installed");
    let install = text
        .find("place_file \"/etc/deepsand/skills/$OPERATOR_SKILL_NAME/SKILL.md\"")
        .expect("the skill has to be installed from the config mount");
    assert!(
        remove < install,
        "the skill directory must be emptied before it is filled, or a prompt turned off stays \
         in force"
    );

    // A skill without these two lines is skipped by the CLI, so writing one is not enough.
    assert!(
        text.contains("mkdir -p \"$SKILL_DIR\""),
        "the skill's own directory has to exist before the file is placed in it"
    );
}

/// Every path that builds the image has to hand BuildKit the tools layer's named context.
///
/// The layer mounts `from=toolcache`, which is a *named build context* and not an image only
/// because something supplies it. The app supplies its keyed cache. The documented
/// `npm run runtime:build` supplied nothing, so BuildKit resolved it as
/// `docker.io/library/toolcache:latest` and the build died with
/// "pull access denied ... insufficient_scope: authorization failed" -- a registry message for a
/// problem that has nothing to do with the registry, on the one command a contributor outside the
/// app has for building the sandbox.
#[test]
fn every_build_path_supplies_the_toolcache_context() {
    let repo = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("..");
    let read = |relative: &str| {
        let path = repo.join(relative);
        std::fs::read_to_string(&path)
            .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()))
    };

    // The claim is only load-bearing while the Dockerfile really does mount a named context.
    assert!(
        read("runtime/Dockerfile").contains("--mount=type=bind,from=toolcache"),
        "if the tools layer stops using the named context, this test can go"
    );
    assert!(
        read("crates/deepsand-core/src/docker.rs").contains("--build-context"),
        "the app's build has to pass the context"
    );

    let script = read("runtime/scripts/build-image.mjs");
    assert!(
        script.contains("\"--build-context\""),
        "so does the command-line build, or the documented way to build the image fails"
    );
    assert!(
        script.contains("toolcache=${toolCache}"),
        "and the context has to be named `toolcache`, which is what the Dockerfile asks for"
    );
}

/// A tool's skill is instructions the model may act on, so one shipped into an image that
/// does not contain the tool is worse than no skill at all: the model reads a playbook for a
/// capability it cannot use. The Dockerfile stages every skill, installs the always-on ones,
/// and copies a tool's skill only inside that tool's `case`.
#[test]
fn a_tools_skill_is_installed_only_into_an_image_built_with_that_tool() {
    let text = dockerfile();

    // Staged, not installed at the discovery root. Installing the whole tree here is exactly
    // the bug: every skill would be in every image.
    assert!(
        text.contains("COPY skills/ /usr/local/share/deepsand/skills/"),
        "the skill tree has to be staged where the tool selection can still gate it"
    );
    assert!(
        !text.contains("COPY skills/ /home/deepcode/.agents/skills/"),
        "copying every skill straight into the discovery root bypasses the tool gate"
    );

    // The skills that describe the sandbox itself are installed unconditionally.
    assert!(
        text.contains("for skill in deepsand-permissions deepsand-toolbox"),
        "the always-on skills have to be installed whatever the tool selection is"
    );

    // Every tool's skill copy is inside a case that matches that tool's id, and nowhere else.
    for (tool, skill) in [
        ("rea", "deepsand-rea"),
        ("dejared", "deepsand-dejared"),
        ("ffdec", "deepsand-ffdec"),
    ] {
        let copy_step = format!("cp -a /usr/local/share/deepsand/skills/{skill}");
        let copy = text
            .find(&copy_step)
            .unwrap_or_else(|| panic!("{skill} has to be installed when {tool} is selected"));
        let gate = format!("*,{tool},*)");
        let gate_at = text[..copy]
            .rfind(&gate)
            .unwrap_or_else(|| panic!("{skill} has to be inside the {tool} case"));
        let case_open = text[..copy]
            .rfind("case \",$INSTALL_TOOLS,\" in")
            .expect("and that case has to be gated on the tool selection");
        assert!(
            case_open < gate_at && copy - gate_at < 300,
            "the copy must be the body of the {tool} case, not a step beside it:\n{}",
            &text[gate_at..copy]
        );
        assert_eq!(
            text.matches(&copy_step).count(),
            1,
            "one gated copy of {skill}, or it can leak into an image without the tool"
        );
    }

    // The staging tree is not a discovery root, and it must not stay in the image.
    assert!(
        text.contains("rm -rf /usr/local/share/deepsand/skills"),
        "the staged tree has to be reclaimed after the selected skills are installed"
    );
}

/// The skill itself has to be discoverable and honest about what the image can do. DeepCode
/// skips a skill without a name and description, and the model trusts what the body says --
/// so the body must name the registered server and must not pretend a native provider exists.
#[test]
fn the_rea_skill_is_named_described_and_honest_about_the_image() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("skills")
        .join("deepsand-rea")
        .join("SKILL.md");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()));

    assert!(text.starts_with("---\n"), "frontmatter has to open on line 1");
    assert!(
        text.contains("\nname: deepsand-rea\n"),
        "the name has to match the directory DeepCode discovers"
    );
    assert!(text.contains("\ndescription: "), "a skill without one is skipped");
    assert!(
        text.contains("mcp__rea__"),
        "the model has to know how the server's tools are named"
    );
    assert!(
        text.contains("host is not reachable"),
        "the skill has to say that REA runs here and not on the operator's machine"
    );
    assert!(
        text.contains("Ghidra") && text.contains("provider_unavailable"),
        "native decompilation is not in this image, and the skill must say so rather than \
         letting the model promise it"
    );
    assert!(
        text.contains("rea setup") && text.contains("Do not run"),
        "the model must not try to reconfigure the sandbox's generated settings"
    );
}

/// `dejared-mcp` is a Node wrapper around a Java server, and on first run it downloads a
/// ~25 MB JAR from GitHub. A sandbox may be in `none` or allowlisted mode, so that download
/// must not happen at run time. The image has to write the JAR to the exact versioned path
/// the wrapper derives from `XDG_CACHE_HOME`, and the settings have to point at the same
/// cache root. This is the claim that those two halves agree.
#[test]
fn the_dejared_jar_is_pre_cached_where_the_server_looks_for_it() {
    let text = dockerfile();
    let cache = deepsand_core::tools::DEJARED_CACHE_HOME;

    assert!(
        text.contains("*,dejared,*)"),
        "the Java/JAR step has to be gated on the dejared tool"
    );
    assert!(
        text.contains("openjdk-17-jre-headless unzip zip"),
        "the server needs a Java 17 runtime, and the skill's nested-layout workaround needs \
         unzip and zip"
    );
    assert!(
        text.contains("releases/download/v${DEJARED_VERSION}/dejared-mcp-${DEJARED_VERSION}.jar"),
        "the JAR release has to be derived from the installed package's version"
    );
    let expected = format!("{cache}/dejared-mcp/dejared-mcp-${{DEJARED_VERSION}}.jar");
    assert!(
        text.contains(&expected),
        "the wrapper computes <XDG_CACHE_HOME>/dejared-mcp/dejared-mcp-<version>.jar, so the \
         image has to put it at {expected}"
    );
    assert!(
        text.contains("unzip -t \"$DEJARED_JAR\""),
        "a truncated or non-JAR download has to fail the build, not the first MCP call"
    );
    assert!(
        text.contains("command -v dejared-mcp"),
        "the npm global has to produce the launcher the settings name"
    );
}

/// The skill has to be discoverable and must steer the model to the cheap tools before the
/// expensive one. It also must not tell the model to install or download anything: the image
/// already has the runtime and the one JAR version the server expects.
#[test]
fn the_dejared_skill_is_named_described_and_keeps_the_servers_rules() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("skills")
        .join("deepsand-dejared")
        .join("SKILL.md");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()));

    assert!(text.starts_with("---\n"), "frontmatter has to open on line 1");
    assert!(
        text.contains("\nname: deepsand-dejared\n"),
        "the name has to match the directory DeepCode discovers"
    );
    assert!(text.contains("\ndescription: "), "a skill without one is skipped");
    assert!(
        text.contains("mcp__dejared__"),
        "the model has to know how the server's tools are named"
    );
    assert!(
        text.contains("absolute path"),
        "every dejared call takes an absolute path to the archive"
    );
    for engine in ["CFR", "Vineflower", "Procyon"] {
        assert!(text.contains(engine), "the skill has to describe {engine}");
    }
    assert!(
        text.contains("do not run `npx"),
        "the model must use the installed server, not download another one"
    );
    assert!(
        text.contains("host path is not a path"),
        "the skill has to say that the sandbox does not see host paths"
    );
}

/// ffdec-mcp has neither a package nor a release asset: the image builds it from the pinned
/// tag. The build is gated on the tool, verifies both halves (the MCP server and the upstream
/// CLI), and removes the JDK, Maven and source so the image keeps only the JRE and the tools.
#[test]
fn the_ffdec_build_is_pinned_verified_and_gated() {
    let text = dockerfile();

    assert!(
        text.contains("*,ffdec,*)"),
        "the ffdec build has to be gated on the ffdec tool"
    );
    assert!(
        text.contains("ffdec-mcp/archive/refs/tags/v1.0.0.tar.gz"),
        "the server is built from a pinned tag, not from main"
    );
    assert!(
        text.contains("ffdec_lib_25.1.3.zip"),
        "the pom is written against ffdec_lib 25.1.3"
    );
    assert!(
        text.contains("-Dversion=1.0.0"),
        "the pom asks for ffdec_lib 1.0.0; installing it as 25.1.3 is the upstream \
         Dockerfile's bug and the dependency would not resolve"
    );
    assert!(
        text.contains("ffdec-mcp-server-1.0.0.jar"),
        "the shaded server JAR is the build's output"
    );

    // The server is compiled for release 25, so the image needs a JDK 25 to build it and a
    // JRE 25 to run it. Neither is the Debian Java the rest of the image may carry.
    assert!(
        text.contains("OpenJDK25U-jdk_x64_linux_hotspot_25.0.4.1_1.tar.gz"),
        "the build needs a pinned JDK 25"
    );
    assert!(
        text.contains("OpenJDK25U-jre_x64_linux_hotspot_25.0.4.1_1.tar.gz"),
        "the runtime needs a pinned JRE 25"
    );
    assert!(
        text.contains("/opt/java25/bin/java -version"),
        "the build has to prove the runtime starts before the image is declared built"
    );

    // The upstream CLI is included because the MCP surface does not wrap every exporter.
    assert!(
        text.contains("ffdec_26.3.0.zip"),
        "the original JPEXS FFDec CLI is installed beside the server"
    );
    assert!(
        text.contains("ffdec-cli.jar"),
        "the CLI JAR is what the ffdec wrapper runs"
    );
    assert!(
        text.contains("ffdec -help >/dev/null"),
        "a CLI that cannot start has to fail the build, not the first session"
    );
    assert!(
        text.contains("META-INF/MANIFEST.MF") && text.contains("Main-Class:"),
        "the server JAR has to carry the Main-Class the launcher relies on"
    );

    assert!(
        text.contains("rm -rf \"$FFDEC_TMP\""),
        "the JDK, Maven and source are build inputs, not part of the shipped image"
    );
    assert!(
        text.contains("rm -rf /tmp/ffdec-home /home/deepcode/.deepcode/ffdec-tmp"),
        "the CLI's build-time home and Jansi library are run-time state, not image content"
    );
    assert!(
        text.contains("--mount=type=cache,target=/root/.m2"),
        "Maven's downloads are cached across builds"
    );
}

/// The skill has to name the MCP tools, describe the session model, and make two things
/// explicit: modifications are saved to a copy, and the bundled CLI is the fallback for the
/// exporters the MCP surface does not wrap. It must not send the model looking for a download.
#[test]
fn the_ffdec_skill_is_named_described_and_covers_both_surfaces() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("skills")
        .join("deepsand-ffdec")
        .join("SKILL.md");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()));

    assert!(text.starts_with("---\n"), "frontmatter has to open on line 1");
    assert!(
        text.contains("\nname: deepsand-ffdec\n"),
        "the name has to match the directory DeepCode discovers"
    );
    assert!(text.contains("\ndescription: "), "a skill without one is skipped");
    assert!(
        text.contains("mcp__ffdec__"),
        "the model has to know how the server's tools are named"
    );
    assert!(
        text.contains("open_swf") && text.contains("close_swf"),
        "the session starts with open_swf and ends with close_swf"
    );
    assert!(
        text.contains("save_swf") && text.contains("output_path"),
        "the model has to be told to pass an explicit output path"
    );
    assert!(
        text.contains("overwrites the original"),
        "the skill has to warn that save_swf without output_path overwrites the input"
    );
    assert!(
        text.contains("ffdec -help") && text.contains("-export"),
        "the bundled CLI is the fallback for the exporters the MCP surface does not wrap"
    );
    assert!(
        text.contains("Do not download"),
        "the CLI is already installed; the model must not fetch another copy"
    );
    assert!(
        text.contains("P-code"),
        "bytecode is the closer-to-the-file evidence"
    );
    assert!(
        text.contains("host path is not a path"),
        "the skill has to say that the sandbox does not see host paths"
    );
}

/// The `ffdec` on PATH is a wrapper, not the upstream shell script. It has to run the
/// Java 25 runtime the image keeps, work without a display, and put FFDec's own writes
/// somewhere other than the operator's project. The shell script is shipped into the
/// image by the Dockerfile, so this checks the actual file the agent will run.
#[test]
fn the_ffdec_wrapper_is_headless_and_writes_outside_the_project() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("bin")
        .join("ffdec.sh");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()));

    assert!(text.starts_with("#!/usr/bin/env bash"), "the shebang is checked at build time");
    assert!(text.contains("/opt/java25/bin/java"), "the CLI needs the Java 25 runtime");
    assert!(
        text.contains("/usr/local/share/ffdec/ffdec-cli.jar"),
        "the CLI's launcher JAR is beside the rest of the upstream distribution"
    );
    assert!(
        text.contains("-Djava.awt.headless=true"),
        "the CLI has to run without a screen"
    );
    assert!(
        text.contains("cd \"$home\""),
        "FFDec writes ./logs relative to the working directory; it must not be /workspace"
    );
    assert!(
        text.contains("jansi.tmpdir"),
        "/tmp is noexec, and Jansi's native library needs an executable directory"
    );
    assert!(
        text.contains("enable the 'ffdec' tool"),
        "a wrapper in an image without the tool has to say what to switch on"
    );
}

/// The toolbox skill tells the model which capabilities it may ask for. It says "anything
/// not in this list does not exist as far as Deepsand is concerned", so a tool added to the
/// catalogue but omitted here is a tool the model will never request -- the operator sees no
/// prompt and the capability stays invisible. This keeps the two lists together.
#[test]
fn the_toolbox_skill_names_every_tool_in_the_catalogue() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("skills")
        .join("deepsand-toolbox")
        .join("SKILL.md");
    let text = std::fs::read_to_string(&path)
        .unwrap_or_else(|err| panic!("could not read {}: {err}", path.display()));

    for tool in deepsand_core::tools::CATALOG {
        assert!(
            text.contains(&format!("`{}`", tool.id)),
            "the catalogue offers `{}`, but the toolbox skill does not name it; the model \
             reads that skill to decide what to ask for",
            tool.id
        );
    }
}

/// A directory under `runtime/skills` that the Dockerfile never copies is dead weight: the
/// author believed they had installed a skill, and the model never sees it. Every skill has
/// to be either in the always-on list or inside a tool's case.
#[test]
fn every_skill_on_disk_is_installed_by_the_dockerfile() {
    let skills = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("runtime")
        .join("skills");
    let text = dockerfile();

    for entry in std::fs::read_dir(&skills).expect("the skills directory").flatten() {
        if !entry.path().is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        assert!(
            text.contains(&name),
            "runtime/skills/{name} is never copied by the Dockerfile, so it is a playbook \
             nobody can load"
        );
    }
}
