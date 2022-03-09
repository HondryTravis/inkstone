
import { createNativeElement } from './element'


interface IComponentArgs {
    setup(...args): void
}

interface IInternalDep {
    editor: any
    init(): void
    [PropertyKey: string]: any
}

/*

<div data-type="wrapper" data-ne="paragraph">
    <p data-type="content">
        <span data-text="normal">|</span>
    </p>
</div>
*/
export function Paragraph() {
    const wrapper = createNativeElement('div', {'data-type': 'wrapper', 'data-ne': 'paragraph'}, [])
    const paragraph = createNativeElement('div', {'data-type': 'content'}, [])
    const spanText = createNativeElement('span', {'data-text': 'normal'}, [])

    const eop = createNativeElement('span', {'data-eop': ''}, ['&nbsp;'])

    const inject: Partial<IInternalDep> = {}

    paragraph.children.push(...[spanText, eop])
    wrapper.children.push(paragraph)

    const init = (args: IComponentArgs) => {
        const { setup } = args
        inject.setup = setup

        setup(wrapper)
    }

    return {
        get current() {
            return wrapper
        },
        init
    }
}
