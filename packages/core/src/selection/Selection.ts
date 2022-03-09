import {
    debounce,
    getNodeLength,
    getEffectivelyContainedNodes,
    getAllEffectivelyContainedNodes,
    getKeysOf,
    isContainedNode
} from '../uitls/index'

import Settings from './settings'

interface ISelectionArgsOptions {
    setup: (...args) => void;
    selector: string;
    settings: object
}

interface ISelectionArgs {
    ownDoc: Document
    ownWin: Window
    editor: any // maybe an instance, one object
    options: Partial<ISelectionArgsOptions>
}

interface ISelectionCache {
    activeRange: Range
    oldRange: Range
    selected: any[]
}

type IBoundaryPoints = [Node, number | null]

export function NativeSelection(args: Partial<ISelectionArgs>) {
    const { ownDoc, ownWin, editor, options: { selector } } = {
        ownDoc: document,
        ownWin: document.defaultView,
        options: { selector: 'body' },
        ...args
    }

    const settings = {
        ...Settings,
        ...args.options?.settings
    }

    const { tag, props } = settings.defaultSelectionWrapperOptions

    const proxyNode = ownDoc.querySelector(selector)

    const cache: Partial<ISelectionCache> = { selected: [] }

    const getSelection = (): Selection => {
        return ownWin.getSelection() || ownDoc.getSelection()
    }

    const getActiveRange = (): Range => {
        if (cache.activeRange) cache.oldRange = cache.activeRange

        const activeSelection = getSelection()

        return activeSelection.rangeCount > 0
            && (cache.activeRange = activeSelection.getRangeAt(0))
            || cache.activeRange

    }


    const select = (node) => {}


    // 修复选区
    const correctRange = (range: Range) => {

        cache.oldRange = range.cloneRange()
        // range = range.cloneRange()

        console.log(['range', range]);
        // 修正开始节点是 Text 节点时候，要对文字进行断开处理
        if (range.startContainer.nodeType === Node.TEXT_NODE
        && range.startOffset !== 0
        && range.startOffset !== getNodeLength(range.startContainer)) {
            const newActiveRange = ownDoc.createRange()
            let newNode;
            if (range.startContainer.isEqualNode(range.endContainer)) {
                let newEndOffset = range.endOffset - range.startOffset;

                newNode = (range.startContainer as Text).splitText(range.startOffset);
                newActiveRange.setEnd(newNode, newEndOffset);

                range.setEnd(newNode, newEndOffset);
            } else {
                newNode = (range.startContainer as Text).splitText(range.startOffset);
            }

            newActiveRange.setStart(newNode, 0);
            getSelection().removeAllRanges();
            getSelection().addRange(newActiveRange);

            getActiveRange().setStart(newNode, 0);
        }

        // 修正结尾节点是 Text 节点时候，要对文字进行断开处理
        if (range.endContainer.nodeType === Node.TEXT_NODE
        && range.endOffset !== 0
        && range.endOffset !== getNodeLength(range.endContainer)) {
            // 上边已经修正过了
            const activeRange = range;
            const newStart: IBoundaryPoints = [activeRange.startContainer, activeRange.startOffset];
            const newEnd: IBoundaryPoints = [activeRange.endContainer, activeRange.endOffset];

            (activeRange.endContainer as Text).splitText(activeRange.endOffset);
            activeRange.setStart(newStart[0], newStart[1]);
            activeRange.setEnd(newEnd[0], newEnd[1]);

            getSelection().removeAllRanges();
            getSelection().addRange(activeRange);
        }
    }

    // 移除标记
    const removeMark = () => {

        while (cache.selected.length) {
            console.log('removeMark')
            const node = cache.selected.shift();
            const parentNode = node.parentNode;
            const child = node.childNodes[0]
            parentNode.insertBefore(child, node)
            node.remove()
            parentNode.normalize()
        }
    }

    // 标记选区
    const mark = () => {
        correctRange(getActiveRange())

        const texts = getAllEffectivelyContainedNodes(getActiveRange() ,function(node) {
            return node.nodeType == Node.TEXT_NODE
        })

        if (!texts.every( node => isContainedNode(proxyNode, node))) return false

        for (const text of texts) {
            const textParent = text.parentNode as Element
            const node = ownDoc.createElement(tag)

            if (getKeysOf(props).length) {
                for (const key in props) node.setAttribute(key, props[key])
            }
            textParent.insertBefore(node, text)
            node.appendChild(text)
            cache.selected.push(node)
        }
        if (!cache.selected.length) return false

        const activeRange = getActiveRange();
        const cacheLen = cache.selected.length
        const [ start, end ] = [ cache.selected[0], cache.selected[cacheLen - 1] ]


        activeRange.setStart(start, 0)
        activeRange.setEnd(end, end.childNodes.length)

        getSelection().removeAllRanges();
        getSelection().addRange(activeRange);
    }

    const setup = () => {
        const markSelection = function(evt: Event) {
            mark()
        }

        const removeMarkInSelection = function(evt: Event) {
            const oldSelection = getSelection()
            if (oldSelection.isCollapsed == false) oldSelection.collapseToEnd()
            removeMark()
        }

        proxyNode.addEventListener('mouseup', markSelection)
        proxyNode.addEventListener('mousedown', removeMarkInSelection)
    }

    const getSelectedNodes = function(callback: Function) {
        if (!callback) {
            callback = (node: Element & Node) => {
                return node.nodeType === Node.ELEMENT_NODE
                    && node.classList.contains(props.class)
            }
        }
        return getAllEffectivelyContainedNodes(getActiveRange(), callback)
    }

    setup()

    return {
        get cache() { return cache },
        getSelection,
        getActiveRange,
        getSelectedNodes,
        mark,
        removeMark
    }
}




export default NativeSelection
