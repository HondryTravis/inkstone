/*
# specify the format to output
yarn dev inkstone --f cjs
*/

const execa = require('execa')
const { fuzzyMatchTarget } = require('./utils')
const minimist = require('minimist')
const args = minimist(process.argv.slice(2))
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'inkstone'
const formats = args.formats || args.f
const sourceMap = args.sourcemap || args.s

execa(
    'rollup',
    [
        '-wc',
        '--environment',
        [
            `TARGET:${target}`,
            `FORMATS:${formats || 'es'}`,
            sourceMap ? `SOURCE_MAP:true` : ``
        ]
            .filter(Boolean)
            .join(',')
    ],
    {
        stdio: 'inherit'
    }
)
