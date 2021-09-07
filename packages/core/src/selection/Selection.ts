import { debounce, getNodeLength, getEffectivelyContainedNodes, getKeysOf } from '../uitls/index'
import Settings from './settings'


interface ISelectionArgsOptions {
    setup: (...args) => void;
    selector: string;
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

    const proxyNode = ownDoc.querySelector(selector)

    console.log(proxyNode);

    let markState = false


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
    const correctRange = (range?: Range) => {
        // range = range.cloneRange()
        cache.oldRange = range.cloneRange()
        // 修正开始节点是 Text 节点时候，要对文字进行断开处理
        console.log(['isEqualNode', range]);
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

    const removeMark = () => {
        while (cache.selected.length) {
            const node = cache.selected.shift();
            const parentNode = node.parentNode;
            const child = node.childNodes[0]
            parentNode.insertBefore(child, node)
            node.remove()
            parentNode.normalize()
        }
    }

    // 标记选区
    const mark = (range: Range) => {
        correctRange(range)

        const texts = getEffectivelyContainedNodes(getActiveRange(), function(node) {
            return node.nodeType == Node.TEXT_NODE
        })

        console.log(texts)

        const { defaultSelectionWrapperOptions: { tag, props } } = Settings

        for (const text of texts) {
            const textParent = text.parentNode as Element
            const node = ownDoc.createElement(tag)
            node.appendChild(text.cloneNode(true))

            if (getKeysOf(props).length) {
                for (const key in props) node.setAttribute(key, props[key])
            }
            textParent.replaceChild(node, text)

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
        // editor.fire('SeletionInit')

        const markSelection = function(evt: Event) {
            mark(getActiveRange())
        }
        const removeMarkInSelection = function(evt: Event) {
            removeMark()
        }
        proxyNode.addEventListener('mouseup', markSelection)
        proxyNode.addEventListener('mousedown', removeMarkInSelection)
    }

    setup()

    return {
        get cache() { return cache },
        getSelection,
        getActiveRange,
        mark
    }
}




export default NativeSelection
