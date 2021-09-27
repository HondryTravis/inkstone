export function debounce(callback: Function, wait: number = 400) {
    let timer: NodeJS.Timeout, context: Function;

    const internalTimeoutCallback = function (...args: any[]) {
        clearTimeout(timer);
        context = this
        timer = setTimeout(() => {
            callback.apply(context, args);
            context = null;
        }, wait);
    }

    internalTimeoutCallback.cancel = function () {
        clearTimeout(timer)
        context = timer = null;
    }

    return internalTimeoutCallback
}

export function throttle(callback: Function, wait: number = 400) {
    let timer: NodeJS.Timeout, context: Function;

    const internalTimeoutCallback = function (...args: any[]) {
        context = this
        if (timer) return false;
        timer = setTimeout(() => {
            callback.apply(context, args);
            clearTimeout(timer);
            context = timer = null;
        }, wait)
    }

    internalTimeoutCallback.cancel = function () {
        clearTimeout(timer)
        context = timer = null;
    }

    return internalTimeoutCallback
}


export function hasKey(obj: object, key: PropertyKey) {
    const { hasOwnProperty } = Object
    return Reflect.has(obj, key) || hasOwnProperty.call(obj, key)
}

export function getKeysOf(obj: object) {
    return Reflect.ownKeys(obj) || Object.keys(obj)
}
