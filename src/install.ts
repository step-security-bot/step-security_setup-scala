import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as shell from "shelljs";
import * as path from "path";

const homedir = require("os").homedir();
const bin = path.join(homedir, "bin");

export async function install(javaVersion: string, jabbaVersion: string) {
  setEnvironmentVariableCI();
  await installJava(javaVersion, jabbaVersion);
  await installSbt();
}

function setEnvironmentVariableCI() {
  core.exportVariable("CI", "true");
}

async function jabbaUrlSuffix(): Promise<string> {
  const runnerOs = shell.env["RUNNER_OS"] || "undefined";
  switch (runnerOs.toLowerCase()) {
    case "linux": {
      const { stdout } = await exec.getExecOutput("uname", ["-m"], {
        silent: true,
      });
      const arch = stdout.trim();
      switch (arch) {
        case "arm64":
        case "aarch64":
          return "linux-arm64";

        default:
          return "linux-amd64";
      }
    }
    case "macos":
      return "darwin-amd64";
    case "windows":
      return "windows-amd64.exe";
    default:
      throw new Error(
        `unknown runner OS: ${runnerOs}, expected one of Linux, macOS or Windows.`
      );
  }
}

function isWindows(): boolean {
  return shell.env["RUNNER_OS"] === "Windows";
}

function jabbaName(): string {
  if (isWindows()) return "jabba.exe";
  else return "jabba";
}

async function installJava(javaVersion: string, jabbaVersion: string) {
  core.startGroup("Install Java");
  core.addPath(bin);
  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${await jabbaUrlSuffix()}`;
  shell.mkdir(bin);
  const jabba = path.join(bin, jabbaName());
  await exec.exec("curl", ["-sL", "-o", jabba, jabbaUrl], { silent: true });
  shell.chmod(755, jabba);
  const jabbaInstall = javaVersion.includes("=")
    ? installJavaByExactVersion(javaVersion)
    : await installJavaByFuzzyVersion(jabba, javaVersion);
  if (!jabbaInstall) return;
  console.log(`Installing ${jabbaInstall.name}`);
  const result = await exec.exec(jabba, ["install", jabbaInstall.install], {
    ignoreReturnCode: true,
  });
  if (result > 0) {
    core.setFailed(`Failed to install Java ${javaVersion} via jabba.`);
    return;
  }
  const { stdout: javaHomeOutput } = await exec.getExecOutput(jabba, [
    "which",
    "--home",
    jabbaInstall.name,
  ]);
  const javaHome = javaHomeOutput.trim();
  core.exportVariable("JAVA_HOME", javaHome);
  core.addPath(path.join(javaHome, "bin"));
  core.endGroup();
}

interface JabbaInstall {
  name: string;
  install: string;
}

async function installJavaByFuzzyVersion(
  jabba: string,
  javaVersion: string
): Promise<JabbaInstall | undefined> {
  const { stdout } = await exec.getExecOutput(jabba, ["ls-remote"]);
  const pattern = new RegExp(javaVersion);
  const toInstall = stdout
    .split("\n")
    .find((line) => pattern.test(line))
    ?.trim();
  if (!toInstall) {
    core.setFailed(
      `Couldn't find Java ${javaVersion}. To fix this problem, run 'jabba ls-remote' to see the list of valid Java versions.`
    );
    return;
  }
  return {
    name: toInstall,
    install: toInstall,
  };
}

function installJavaByExactVersion(javaVersion: string): JabbaInstall {
  return {
    name: javaVersion.split("=")[0],
    install: javaVersion,
  };
}

async function installSbt() {
  core.startGroup("Install sbt");
  core.addPath(bin);
  await curl(
    "https://raw.githubusercontent.com/sbt/sbt/develop/sbt",
    path.join(bin, "sbt")
  );
  await curl(
    "https://raw.githubusercontent.com/dwijnand/sbt-extras/master/sbt",
    path.join(bin, "sbtx")
  );
  await curl(
    "https://raw.githubusercontent.com/coursier/sbt-extras/master/sbt",
    path.join(bin, "csbt")
  );
  core.endGroup();
}

async function curl(url: string, outputFile: string) {
  await exec.exec("curl", ["-sL", "-o", outputFile, url], { silent: true });
  shell.chmod(755, outputFile);
  shell.cat(outputFile);
  console.log(`Downloaded '${path.basename(outputFile)}' to ${outputFile}`);
}
