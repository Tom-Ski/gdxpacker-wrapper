const path = require('path');
const fs = require("fs");
const https = require("https");
const { spawn } = require("child_process");
const commandExistsSync = require("command-exists").sync;

async function download() {

    const options = {
        host: "libgdx-nightlies.s3.eu-central-1.amazonaws.com",
        path: "/libgdx-runnables/runnable-texturepacker.jar"
    }
    return new Promise((res, rej) => {
        fs.mkdirSync(path.join(__dirname, "vendor"));
        const file = fs.createWriteStream(path.join(__dirname, "vendor/packer.jar"));
        https.get(options, function (response) {
            if (response.statusCode !== 200) {
                console.log(response.statusMessage  + " " + response.statusCode);
                return rej(response.statusMessage);
            }
            response.pipe(file);

            file.on("finish", () => {
                file.close();
                console.log("Downloaded runnable jar");
                fs.writeFileSync(path.join(__dirname, "vendor/marker"), "marked");
                return res();
            });
        });
    });
}

function convertConfigToCommandLineParams(packingConfig) {
    const rawDirectory = packingConfig.rawDirectory;
    const outputDirectory = packingConfig.outputDirectory;
    const packName = packingConfig.packName;

    return [rawDirectory, outputDirectory, packName];
}

async function pack (packingConfig) {


    const name = packingConfig.name;
    console.log("Starting the pack of " + name);

    const args = ["-jar", path.join(__dirname, "vendor/packer.jar")];
    args.push(...convertConfigToCommandLineParams(packingConfig));

    return new Promise((res, rej) => {
        console.log(`Starting process with args ${args}`)
        const packerProcess = spawn("java", args);

        packerProcess.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
        });

        packerProcess.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });

        packerProcess.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });

        packerProcess.on("close", code => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                return res();
            } else {
                return rej(`Packing process exited with ${code}`);
            }
        });

    });

}

async function exec() {

    const configPath = "packerConfig.json";

    console.log(`Searching for ${configPath}`);

    const defaultConfig = JSON.stringify({
        packingConfigs: [
            {
                name: "Pack 1",
                rawDirectory: "input",
                outputDirectory: "output",
                packName: "packed"
            }
        ]
    }, null, 2);

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, defaultConfig);
        console.log("Created default packerConfig.json");
    }

    if (!commandExistsSync("java")) {
        throw new Error("Java not installed, need a jvm/jdk to run the packer");
    }

    const shouldDownload = !fs.existsSync(path.join(__dirname, "vendor/marker"));

    if (shouldDownload) {
        try {
            await download();
        } catch (error) {
            throw error;
        }
    }

    //Lets grab the config and start packing
    const promises = [];

    try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        for (let packingConfig of config.packingConfigs) {
            promises.push(pack(packingConfig));
        }
    } catch (e) {
        console.error("Error ", e);
        throw e;
    }

    try {
        await Promise.all(promises);
    } catch (error) {
        console.error("Error packing", error);
    }

}

module.exports = {
    exec
}