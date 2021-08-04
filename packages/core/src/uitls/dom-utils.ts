const htmlNamespace = 'http://www.w3.org/1999/xhtml'

const prohibitedParagraphChildNames = [
    'address',
    'article',
    'aside',
    'blockquote',
    'caption',
    'center',
    'col',
    'colgroup',
    'dd',
    'details',
    'dir',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'li',
    'listing',
    'menu',
    'nav',
    'ol',
    'p',
    'plaintext',
    'pre',
    'section',
    'summary',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
    'xmp'
]

export function isProhibitedParagraphChild(node) {
    return isHtmlElement(node, prohibitedParagraphChildNames)
}

export function isBlockNode(node: HTMLElement) {
    const inlineProps = ['inline', 'inline-block', 'inline-table', 'none']
    return node
        && ((node.nodeType == Node.ELEMENT_NODE && inlineProps.indexOf(getComputedStyle(node).display) == -1)
        || node.nodeType == Node.DOCUMENT_NODE
        || node.nodeType == Node.DOCUMENT_FRAGMENT_NODE)
}

export function isInlineNode(node) {
    return node
        && !isBlockNode(node)
}

export function isEditingHost(node) {
    return node
        && isHtmlElement(node)
        && (node.contentEditable == 'true'
        || (node.parentNode
        && node.parentNode.nodeType == Node.DOCUMENT_NODE
        && node.parentNode.designMode == 'on'))
}

function isEditable(node) {
    return node
        && !isEditingHost(node)
        && (node.nodeType != Node.ELEMENT_NODE || node.contentEditable != 'false')
        && (isEditingHost(node.parentNode) || isEditable(node.parentNode))
        && (isHtmlElement(node)
        || (node.nodeType == Node.ELEMENT_NODE && node.namespaceURI == 'http://www.w3.org/2000/svg' && node.localName == 'svg')
        || (node.nodeType == Node.ELEMENT_NODE && node.namespaceURI == 'http://www.w3.org/1998/Math/MathML' && node.localName == 'math')
        || (node.nodeType != Node.ELEMENT_NODE && isHtmlElement(node.parentNode)));
}

export function hasEditableDescendants(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        if (isEditable(node.childNodes[i])
        || hasEditableDescendants(node.childNodes[i])) {
            return true;
        }
    }
    return false;
}

export function getEditingHostOf(node) {
    if (isEditingHost(node)) {
        return node
    } else if (isEditable(node)) {
        let ancestor = node.parentNode
        while (!isEditingHost(ancestor)) {
            ancestor = ancestor.parentNode
        }
        return ancestor
    } else {
        return null
    }
}

export function inSameEditingHost(node1, node2) {
    return getEditingHostOf(node1)
        && getEditingHostOf(node1) == getEditingHostOf(node2)
}

export function isCollapsedLineBreak(br) {
    if (!isHtmlElement(br, 'br')) {
        return false
    }

    let ref = br.parentNode
    while (getComputedStyle(ref).display == 'inline') {
        ref = ref.parentNode
    }

    let refStyle = ref.hasAttribute('style') ? ref.getAttribute('style') : null
    ref.style.height = 'auto'
    ref.style.maxHeight = 'none'
    ref.style.minHeight = '0'

    let space = document.createTextNode('\u200b')
    let origHeight = ref.offsetHeight
    if (origHeight == 0) {
        throw 'isCollapsedLineBreak: original height is zero, bug?'
    }

    br.parentNode.insertBefore(space, br.nextSibling)
    let finalHeight = ref.offsetHeight
    space.parentNode.removeChild(space)
    if (refStyle === null) {
        ref.setAttribute('style', '')
        ref.removeAttribute('style')
    } else {
        ref.setAttribute('style', refStyle)
    }

    return origHeight < finalHeight - 5
}

export function isExtraneousLineBreak(br) {
    if (!isHtmlElement(br, 'br')) {
        return false
    }

    if (
        isHtmlElement(br.parentNode, 'li') &&
        br.parentNode.childNodes.length == 1
    ) {
        return false
    }

    let ref = br.parentNode
    while (getComputedStyle(ref).display == 'inline') {
        ref = ref.parentNode
    }

    let refStyle = ref.hasAttribute('style') ? ref.getAttribute('style') : null
    ref.style.height = 'auto'
    ref.style.maxHeight = 'none'
    ref.style.minHeight = '0'

    let brStyle = br.hasAttribute('style') ? br.getAttribute('style') : null
    let origHeight = ref.offsetHeight
    if (origHeight == 0) {
        throw 'isExtraneousLineBreak: original height is zero, bug?'
    }
    br.setAttribute('style', 'display:none')

    let finalHeight = ref.offsetHeight
    if (refStyle === null) {
        ref.setAttribute('style', '')
        ref.removeAttribute('style')
    } else {
        ref.setAttribute('style', refStyle)
    }
    if (brStyle === null) {
        br.removeAttribute('style')
    } else {
        br.setAttribute('style', brStyle)
    }

    return origHeight == finalHeight
}

export function isWhitespaceNode(node) {
    return node
        && node.nodeType == Node.TEXT_NODE
        && (node.data == ''
            || (/^[\t\n\r ]+$/.test(node.data)
                && node.parentNode
                && node.parentNode.nodeType == Node.ELEMENT_NODE
                && ['normal', 'nowrap'].indexOf(getComputedStyle(node.parentNode).whiteSpace) != -1
            ) || (/^[\t\r ]+$/.test(node.data)
                && node.parentNode
                && node.parentNode.nodeType == Node.ELEMENT_NODE
                && getComputedStyle(node.parentNode).whiteSpace == 'pre-line'
            ))
}

function isCollapsedWhitespaceNode(node) {
    if (!isWhitespaceNode(node)) {
        return false
    }

    if (node.data == '') {
        return true
    }

    let ancestor = node.parentNode

    if (!ancestor) {
        return true
    }

    if (getAncestors(node).some(function (ancestor) {
        return ancestor.nodeType == Node.ELEMENT_NODE
            && getComputedStyle(ancestor).display == 'none'
    })) {
        return true
    }

    while (!isBlockNode(ancestor)
    && ancestor.parentNode) {
        ancestor = ancestor.parentNode
    }

    let reference = node

    while (reference != ancestor) {
        reference = previousNode(reference)

        if (isBlockNode(reference)
        || isHtmlElement(reference, 'br')) {
            return true
        }

        if (reference.nodeType == Node.TEXT_NODE
        && !isWhitespaceNode(reference)
        || isHtmlElement(reference, 'img')) {
            break
        }
    }

    reference = node

    let stop = nextNodeDescendants(ancestor)
    while (reference != stop) {
        reference = nextNode(reference)

        if (isBlockNode(reference)
        || isHtmlElement(reference, 'br')) {
            return true
        }

        if (reference
        && reference.nodeType == Node.TEXT_NODE
        && !isWhitespaceNode(reference)
        || isHtmlElement(reference, 'img')
        ) {
            break
        }
    }

    return false
}

export function isVisible(node) {
    if (!node) {
        return false
    }

    if (
        getAncestors(node)
            .concat(node)
            .filter(function (node) {
                return node.nodeType == Node.ELEMENT_NODE
            })
            .some(function (node) {
                return getComputedStyle(node).display == 'none'
            })
    ) {
        return false
    }

    if (isBlockNode(node)
    || (node.nodeType == Node.TEXT_NODE && !isCollapsedWhitespaceNode(node))
    || isHtmlElement(node, 'img')
    || (isHtmlElement(node, 'br') && !isExtraneousLineBreak(node))) {
        return true
    }

    for (let i = 0; i < node.childNodes.length; i++) {
        if (isVisible(node.childNodes[i])) {
            return true
        }
    }

    return false
}

export function isInvisible(node) {
    return node && !isVisible(node)
}

export function isCollapsedBlockProp(node) {
    if (isCollapsedLineBreak(node) && !isExtraneousLineBreak(node)) {
        return true
    }

    if (!isInlineNode(node) || node.nodeType != Node.ELEMENT_NODE) {
        return false
    }

    let hasCollapsedBlockPropChild = false
    for (let i = 0; i < node.childNodes.length; i++) {
        if (!isInvisible(node.childNodes[i])
        && !isCollapsedBlockProp(node.childNodes[i])
        ) {
            return false
        }
        if (isCollapsedBlockProp(node.childNodes[i])) {
            hasCollapsedBlockPropChild = true
        }
    }

    return hasCollapsedBlockPropChild
}

export function isHtmlNamespace(ns) {
    return ns === null || ns === htmlNamespace
}

export function isHtmlElement(node, tags?) {
    if (typeof tags == 'string') {
        tags = [tags]
    }
    if (typeof tags == 'object') {
        tags = tags.map(function (tag) {
            return tag.toUpperCase()
        })
    }
    return node
        && node.nodeType == Node.ELEMENT_NODE
        && isHtmlNamespace(node.namespaceURI)
        && (typeof tags == 'undefined' || tags.indexOf(node.tagName) != -1)

}

export function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild
    }
    return nextNodeDescendants(node)
}

export function nextNodeDescendants(node) {
    while (node && !node.nextSibling) {
        node = node.parentNode
    }
    if (!node) {
        return null
    }
    return node.nextSibling
}

export function previousNode(node) {
    if (node.previousSibling) {
        node = node.previousSibling
        while (node.hasChildNodes()) {
            node = node.lastChild
        }
        return node
    }
    if (node.parentNode
    && node.parentNode.nodeType == Node.ELEMENT_NODE) {
        return node.parentNode
    }
    return null
}

export function isAncestor(ancestor, descendant) {
    return ancestor
        && descendant
        && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY)
}

export function isAncestorContainer(ancestor, descendant) {
    return (ancestor || descendant)
        && (ancestor == descendant || isAncestor(ancestor, descendant))
}

export function isDescendant(descendant, ancestor) {
    return ancestor
        && descendant
        && Boolean(ancestor.compareDocumentPosition(descendant) & Node.DOCUMENT_POSITION_CONTAINED_BY)
}

export function isBefore(node1, node2) {
    return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING)
}

export function isAfter(node1, node2) {
    return Boolean(node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING)
}

export function getAncestors(node, condition?: Function | null) {
    const ancestors = []

    if (!condition) condition = function (node) { return true }

    while (node.parentNode && condition(node)) {
        ancestors.unshift(node.parentNode)
        node = node.parentNode
    }
    return ancestors
}

export function getInclusiveAncestors(node, condition?) {
    return getAncestors(node, condition).concat(node)
}

export function getDescendants(node) {
    const descendants = []
    let stop = nextNodeDescendants(node)
    while ((node = nextNode(node)) && node != stop) {
        descendants.push(node)
    }
    return descendants
}

export function getInclusiveDescendants(node) {
    return [node].concat(getDescendants(node))
}

export function getDirectionality(element) {
    if (element.dir == 'ltr') {
        return 'ltr'
    }

    if (element.dir == 'rtl') {
        return 'rtl'
    }

    if (!isHtmlElement(element.parentNode)) {
        return 'ltr'
    }

    return getDirectionality(element.parentNode)
}
