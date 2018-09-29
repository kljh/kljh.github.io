/*
Author: CC, TR
Creation date: 21-Sept-2018
Ref: https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
*/

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const fetch = require('node-fetch');
//const cdp = require('chrome-remote-interface');
const puppeteer = require('puppeteer'); // puppeteer-core

var args = minimist(process.argv.slice(2), {
    string: [ "symphony_url", "remote_debug_url" ],
    default: { symphony_url: "https://my.symphony.com/client/index.html" }
});

async function attach_to_paragon() {
    // !! Puppeteer and Chromium Version must match !!
    console.log("remote_debug_url: " + args.remote_debug_url+"\n");

    var browser = await puppeteer.connect({
        browserWSEndpoint: args.remote_debug_url,
        ignoreHTTPSErrors: true });

    return { browser };
}

async function open_symphony_in_new_browser() {
    // make sure node and chrome binaries architectures are consistent (x86 vs x64)
    const browser = await puppeteer.launch({
        args: [ '--start-maximized', ],
        headless: false,
        ignoreHTTPSErrors: true
        });

    const pages = await browser.pages()
    const page = pages.length ? pages[0] : await browser.newPage();
    await page._client.send('Emulation.clearDeviceMetricsOverride');
    //await page.setViewport({ width: 1800, height: 960 });
    await page.goto(args.symphony_url);

    return { browser, page };
}

async function add_script_change_listener(puppet) {
    var { browser, page } = puppet;

    // add fs watch to change

    var incl_extension = ".js";
    var excl_filename = path.basename(__filename);

    console.log("add_script_change_listener", __dirname);
    console.log("  including changes on extension", incl_extension);
    console.log("  excluding changes on filename", excl_filename);

    var opts = { recursive : false };
    fs.watch(__dirname, opts, async function (eventType, filename) {
        var file_extension = filename.substr(filename.length-incl_extension.length);
        console.log("fs.watch", eventType, filename, "reloading...");
        if (filename==excl_filename || file_extension!==incl_extension) {
            console.warn("fs.watch", eventType, filename, "ignored.");
            return
        }
        await page.addScriptTag({ path: filename });
        console.log("fs.watch", eventType, filename, "reloaded.");
    });

    return puppet;
}

Promise.resolve(true)

// attach to existing or create new browser
//.then(attach_to_paragon)
.then(open_symphony_in_new_browser)

.then(async function (puppet) {
    console.log("puppet: "+Object.keys(puppet));
    var { browser, page } = puppet;

    await page.evaluate("var abc = 123;");
    console.log(await page.evaluate("abc*10+4;"));

    return puppet;
})

/*
.then(function(puppet) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() { resolve(puppet); }, 8000);
    });
})
*/

.then(async function(puppet) {
    var { browser, page } = puppet;

    console.log("page.waitForSelector('#navProfileUsername') ..");
    var hElnt = await page.waitForSelector('#navProfileUsername');
    var hAttr = await hElnt.getProperty("innerText")
    var attr_value = await hAttr.jsonValue();
    console.log("#navProfileUsername: "+attr_value);

    await page._client.send('Emulation.clearDeviceMetricsOverride');

    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/arrive@2.4.1/src/arrive.js" });
    //await page.addScriptTag({ path: "node_modules/arrive/src/arrive.js" });
    await page.addScriptTag({ path: "symphony-tamper.js" });
    console.log(await page.evaluate("arrive;"));

    console.log("script added");

    return puppet;
})

//.then(add_script_change_listener)

.catch(async function(err) {
    console.log("paragon-puppet error in asynchronous code.", err);
    process.exit();
})
.then(async function(browser) {
    //if (browser) { await browser.close(); }
    console.log("paragon-puppet done.\n");
});
