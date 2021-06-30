const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const targets = (exports.targets = fs.readdirSync('packages').filter(d => {
    if (!fs.statSync(`packages/${d}`).isDirectory()) {
        return false;
    }
    const pkg = require(`../packages/${d}/package.json`)

    if (pkg.buildOptions && pkg.buildOptions.isSkin) {
        return false;
    }

    if (pkg.private && !pkg.buildOptions) {
        return false;
    }
    return true;
}))


exports.fuzzyMatchTarget = (partialTargets, includeAllMatching) => {
    const matched = []

    partialTargets.forEach(partialTarget => {
        for (const target of targets) {
            if (target.match(partialTarget)) {
                matched.push(target)
                if (!includeAllMatching) {
                    break
                }
            }
        }
    })

    if (matched.length) {
        return matched
    } else {
        console.error(
            `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(
                `Target ${chalk.underline(partialTargets)} not found!`
            )}`
        )
        process.exit(1)
    }
}
