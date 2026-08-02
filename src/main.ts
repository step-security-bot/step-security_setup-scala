import * as core from "@actions/core";
import {install} from "./install";
import {validateSubscription} from "./subscription";


async function run() {
    try {
        await validateSubscription();
        const javaVersion = core.getInput("java-version", {required: true});
        const jabbaVersion = core.getInput("jabba-version", {required: true});
        console.log(`Installing Java version '${javaVersion}'`);
        await install(javaVersion, jabbaVersion);
    } catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
    }
}

run();
