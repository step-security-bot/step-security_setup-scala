[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Setup Scala GitHub Action

A GitHub Action to install Java via [Jabba](https://github.com/shyiko/jabba) and
sbt.

- Configurable Java version: supports OpenJDK, GraalVM, Zulu and any other Java
  version that's installable via Jabba.
- Cross-platform: works on Linux, macOS, Windows.
- The `sbt` command is provided, with the official sbt launch script.
- The following alternate sbt launch scripts are also provided:
  - `sbtx` runs the [sbt-extras](https://github.com/dwijnand/sbt-extras/) launcher.
  - `csbt` runs the [Coursier-based sbt-extras](https://github.com/coursier/sbt-extras/) launcher.

## Usage:

In your GitHub Actions workflow, add a `uses:` declaration before calling the
`sbt` command.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on:
    push:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v7
+     - uses: step-security/setup-scala@v14
      - name: Compile
        run: sbt compile
```

The default Java version is the latest OpenJDK 8 HotSpot version via
[AdoptOpenJDK](https://adoptopenjdk.net/). To customize the Java version add a
`with:` declaration. For example, to use the latest AdoptOpenJDK 11 version

```diff
+++ .github/workflows/ci.yml
  name: CI
  on:
    push:
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v7
      - uses: step-security/setup-scala@v14
+       with:
+         java-version: adopt@1.11
      - name: Compile
        run: sbt compile
```

More Java version examples:

- `graalvm@`: the latest GraalVM
- `openjdk@1.14`: the latest OpenJDK 14 version
- `zulu@1.11`: the latest Zulu OpenJDK 11
- `graalvm@20.2.0=tgz+https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-20.2.0/graalvm-ce-java11-linux-amd64-20.2.0.tar.gz`:
  custom Java version from a URL

## Tips and tricks

Some suggestions that may be helpful when using GitHub Actions.

### Disable `fail-fast` strategy

By default, GitHub Actions stops running jobs on the first failure. Add the
following configuration to ensure that all jobs run on every PR even if one job
fails.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
+     strategy:
+       fail-fast: false
      steps:
      - uses: actions/checkout@v7
      - uses: step-security/setup-scala@v14
      - name: Compile
        run: sbt compile
```

### Configuring Windows jobs

When running jobs on Windows, you may want to default to the `bash` shell and
configure git to disable Windows line feeds.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on: [push]
  jobs:
    build:
-     runs-on: ubuntu-latest
+     runs-on: windows-latest
      steps:
+     - name: Configure git
+       run: "git config --global core.autocrlf false"
+       shell: bash
      - uses: actions/checkout@v7
      - uses: step-security/setup-scala@v14
      - name: Compile
+       shell: bash
        run: sbt compile
```

### Faster checkout of big repos

Your repository can have a lot of commits, or branches with bulk resources.
`actions/checkout@v7` doesn't fetch a whole repo by default that can
speed up builds greatly. But an additional configuration can be required to
fetch tags up to some level of depth for some builds which check binary
compatibility with previous tagged release from the branch.

```diff
+++ .github/workflows/ci.yml
  name: CI
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
-     - uses: actions/checkout@v1
+     - uses: actions/checkout@v7
+       with:
+         fetch-depth: 100
+         fetch-tags: true
      - uses: step-security/setup-scala@v11
      - name: Compile
        run: sbt compile
```
