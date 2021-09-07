export function debounce(fn: Function, wait: number = 400) {
    let timer: NodeJS.Timeout, context: Function;
    return function (...args: any[]) {
        timer && clearTimeout(timer);
        context = this
        timer = setTimeout(() => {
            fn.apply(context, args);
            context = null;
        }, wait);
    };
}

export function throttle(fn: Function, wait: number = 400) {
    let timer: NodeJS.Timeout, context: Function;
    return function (...args: any[]) {
        context = this
        if (timer) return;
        timer = setTimeout(() => {
            fn.apply(context, args);
            clearTimeout(timer);
            context = timer = null;
        }, wait)
    }
}


export function hasKey(obj: object, key: PropertyKey) {
    const { hasOwnProperty } = Object
    return Reflect.has(obj, key) || hasOwnProperty.call(obj, key)
}

export function getKeysOf(obj: object) {
    return Reflect.ownKeys(obj) || Object.keys(obj)
}
