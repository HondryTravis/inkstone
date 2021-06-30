/*
# name supports fuzzy match. will build all packages with name containing "inkstone":
yarn build inkstone
# specify the format to output
yarn build inkstone --formats cjs
*/
const fs = require('fs');
const path = require('path')
const execa = require('execa')
const chalk = require('chalk')
const minimist = require('minimist')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')

const { targets: allTargets, fuzzyMatchTarget } = require('./utils')

const args = minimist(process.argv.slice(2))
// specify targets
const targets = args._
// specify the format to output, ues ',' spilt
const formats = args.formats || args.f
// if need build dev module or only build prod
const devOnly = args.devOnly || args.d
const prodOnly = !devOnly && (args.prodOnly || args.p)
// if need sourcemap in production build
const sourceMap = args.sourcemap || args.s
// if need release
const isRelease = args.release
// if need build all module in production build
const buildAllMatching = args.all || args.a

start()

async function start() {
    console.log('target', targets)
    if (!targets.length) {
        await buildAll(allTargets)
        checkAllSizes(allTargets)
    } else {
        await buildAll(fuzzyMatchTarget(targets, buildAllMatching))
        checkAllSizes(fuzzyMatchTarget(targets, buildAllMatching))
    }
}

async function buildAll(targets) {
    for (const target of targets) {
        await build(target)
    }
}

async function build(target) {
    const packageDir = path.resolve(`packages/${target}`)
    const pkg = require(`${packageDir}/package.json`)

    // only build published packages for release
    if (isRelease && pkg.private) {
        return
    }

    // if building a specific format, do not remove dist.
    if (!formats) {
        await fs.rmdirSync(`${packageDir}/dist`, { recursive: true })
    }

    const env =
        (pkg.buildOptions && pkg.buildOptions.env) ||
        (devOnly ? 'development' : 'production')


    await execa(
        'rollup',
        [
            '-c',
            '--environment',
            [
                `NODE_ENV:${env}`,
                `TARGET:${target}`,
                prodOnly ? `PROD_ONLY:true` : ``,
                formats ? `FORMATS:${formats}` : ``,
                sourceMap ? `SOURCE_MAP:true` : ``
            ]
                .filter(Boolean)
                .join(',')
        ],
        { stdio: 'inherit' }
    )
}

function checkAllSizes(targets) {
    if (devOnly) {
        return
    }
    for (const target of targets) {
        checkSize(target)
    }
}

function checkSize(target) {
    const packagesDir = path.resolve(`packages/${target}`)
    checkFileSize(`${packagesDir}/dist/${target}.global.js`)
    checkFileSize(`${packagesDir}/dist/${target}.cjs.js`)
}

function checkFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
        return
    }
    const file = fs.readFileSync(filePath)
    const minSize = (file.length / 1024).toFixed(2) + 'kb'
    const gzipped = gzipSync(file)
    const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
    const compressed = compress(file)
    const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
    console.log(
        `${chalk.gray(
            chalk.bold(path.basename(filePath))
        )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
    )
}
