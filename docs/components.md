# 组件文档结构



## NativeElement.Text

最基本的文本节点 Text 类型,只能够被 Element[!img] 类型的元素包裹

```html
<!-- 基础文本始终都是固定的，每次在调整选区，光标定位的时候，始终都会定位到这里，不会定位到其他地方 -->
<span data-text="normal">|</span>
```

如何实现加粗斜体呢

```html
<!-- inline -->
<!-- bold, italic, line-through, underline, font-color, background-color, font-size, superscript, subscript-->
<span data-charstyle="inline" style="" > 
    <span data-text="normal">[我是基础文本]</span> 
</span>
```

## NativeElement.Heading

```html
<!-- 基础文本始终都是固定的，每次在调整选区，光标定位的时候，始终都会定位到这里，不会定位到其他地方 -->
<span data-text="normal" data-format="heading 1">我是标题 1|</span>
```

如何标题功能呢

```html
<!-- inline -->
<!-- heading-->
<span data-charstyle="inline" style="" > 
    <span data-text="normal" data-format="heading 1">我是标题 1|</span>
</span>
```



## NativeElement.Paragraph

这个应该是文档中最基础的元素, 也是默认元素，在段落中每次回车都会产生新的 paragraph，但是一个段落应该是如下结构
为了更好的兼容性，不使用自定义元素和 WebComponents

```html
<!-- 这是一个段落的结构,他是一个 element,这个是不可以被编辑的 -->
<div class="NativeElement ltr">
    <div data-type="wrapper" data-ne="paragraph">
        <p data-type="content">
            <span data-text="normal">|</span>
        </p>
    </div>
</div>
```

如何让元素可以编辑呢

可以当我们在点击 NativeElement 的时候，我们 clone 一份当前元素，是 editing 元素可以编辑，然后隐藏掉当前元素，就变成了

```html
<div class="NativeElement ltr">
    <div id="Editing_Element_Wrapper_[id]">
        <div id="Editing_Element_[id]" data-type="wrapper" data-ne="paragraph" contenteditable="true">
            <p data-type="content">
                <span data-text="normal">一些文字|</span>
            </p>
        </div>
    </div>

    <div data-type="wrapper" data-ne="paragraph" class="hide">
        <p data-type="content">
            <span data-text="normal">一些文字</span>
        </p>
    </div>
</div>
```
