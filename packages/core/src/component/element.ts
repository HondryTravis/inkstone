

interface INativeElementArgs {
    tag: string;
    props: object;
    children: any[] | INativeElementArgs[]
}
type IElementType = 'element' | 'text'

function createElement() {

}

export function createNativeElement(tag: string, props: object, children: any[] | INativeElementArgs[]) {
    return new NavtiveElement(tag, props, children)
}


export class NavtiveElement {
    tag: string
    props: object
    children: any[] | INativeElementArgs[]

    constructor(tag: string, props: object, children: [] | INativeElementArgs[]) {
        this.tag = tag
        this.props = props
        this.children = children
    }

    public render(): HTMLElement {
        const element = document.createElement(this.tag)
        const props = this.props
        const children = this.children || []

        for (let propName in props) {
            const propsValue = props[propName];
            element.setAttribute(propName, propsValue);
        }

        children.forEach((child: any) => {
            const childEl = child instanceof NavtiveElement ? child.render() : document.createTextNode(child)
            element.appendChild(childEl);
        })

        return element
    }
}
