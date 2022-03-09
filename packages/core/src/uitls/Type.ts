export function typeOf(obj: any) {
    const { toString } = Object.prototype
    const t = typeof obj

    if (obj === null) return 'null'

    if (t === 'object') return toString.call(obj).match(/\[object (.*?)\]/)[1]
    else return t
}

export function isSameType(obj1: any, obj2: any): boolean {
    return typeOf(obj1) === typeOf(obj2)
}

export function isArray(obj: any) {

    if (Array.isArray) return Array.isArray(obj)

    const t = typeOf(obj)
    if (t === 'Array') return true

    return false
}
