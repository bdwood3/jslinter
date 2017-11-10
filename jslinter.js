"use strict";

const usage = "Usage: node jslinter.js <filename> [-node] [-browser] [-this] [-for]";
const jslint = require("./jslint");
const fs = require("fs");

var parameters = process.argv.slice(2); // skip "node" and script name

if (parameters.length === 0) {
    console.log("Missing parameters.");
    console.log(usage);
    process.exit();
}

function getOption(value) {
    var index = parameters.indexOf(value);
    if (index >= 0) {
        parameters.splice(index, 1);
        return true;
    }
    return false;
}

var nodeFlag = getOption("-node");
var browserFlag = getOption("-browser");
var thisFlag = getOption("-this");
var forFlag = getOption("-for");

if (parameters.length > 1) {
    console.log("Too many parameters.");
    console.log(parameters);
    console.log(usage);
    process.exit();
}

if (parameters.length === 0) {
    console.log("Missing filename.");
    console.log(usage);
    process.exit();
}

var filename = parameters.shift();

var styles = (function () {
    const ESC = "\u001b";
    const RESET = ESC + "[0m";
    return {
        code: function code(s) {
            return ESC + "[30;47m" + s + RESET;
        },
        strong: function strong(s) {
            return ESC + "[1m" + s + RESET;
        },
        success: function (s) {
            return ESC + "[32m" + s + RESET;
        },
        warning: function warning(s) {
            return ESC + "[31m" + s + RESET;
        }
    };
}());

function errorReport(data) {
    var output = [];
    var fudge = +!!data.option.fudge;
    if (data.stop) {
        output.push(styles.warning("JSLint was unable to finish."));
        output.push("");
    }
    data.warnings.forEach(function (warning) {
        output.push((warning.line + fudge) + "." + (warning.column + fudge) + " " + styles.warning(warning.message));
        output.push(styles.code(data.lines[warning.line]));
        var i = 0;
        var marker = "";
        while (i < warning.column) {
            marker += " ";
            i += 1;
        }
        marker += "^";
        output.push(styles.warning(marker));
        output.push("");
    });
    return output;
}

function functionReport(data) {
    var output = [];
    if (data.json) {
        if (data.warnings.length === 0) {
            output.push(styles.strong(styles.success("JSON: good")));
        } else {
            output.push(styles.strong(styles.warning("JSON: bad")));
        }
    } else {
        output.push("JSLint edition " + data.edition);
    }
    return output;
}

function report(data) {
    var errors = errorReport(data);
    if (errors.length) {
        console.log(styles.strong(styles.warning("Warnings")));
        console.log("");
        errors.forEach(function (line) {
            console.log(line);
        });
    }
    var functions = functionReport(data);
    if (functions.length) {
        functions.forEach(function (line) {
            console.log(line);
        });
    }
}

var options = {
    "es6": true,
    "node": nodeFlag,
    "browser": browserFlag,
    "this": thisFlag,
    "for": forFlag,
    "fudge": true
};

var globals = [];
if (options.browser) {
    globals.push("console");
}

fs.readFile(filename, "utf8", function (err, source) {
    if (err) {
        console.error("Unable to read file: '" + filename + "'.");
        return;
    }
    var result = jslint(source, options, globals);
    report(result);
});

