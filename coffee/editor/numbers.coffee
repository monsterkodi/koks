###
000   000  000   000  00     00  0000000    00000000  00000000    0000000
0000  000  000   000  000   000  000   000  000       000   000  000
000 0 000  000   000  000000000  0000000    0000000   0000000    0000000
000  0000  000   000  000 0 000  000   000  000       000   000       000
000   000   0000000   000   000  0000000    00000000  000   000  0000000
###

{ elem, $ } = require 'kxk'

event = require 'events'

class Numbers extends event

    @: (@editor) ->

        super()
        @lineDivs = {}

        @elem =$ ".numbers" @editor.view

        @editor.on 'clearLines'       @onClearLines

        @editor.on 'linesShown'       @onLinesShown
        @editor.on 'linesShifted'     @onLinesShifted

        @editor.on 'fontSizeChanged'  @onFontSizeChange
        @editor.on 'changed'          @onChanged
        @editor.on 'highlight'        @updateColors
        # @editor.on 'linesSet'         => klog 'linesSet' #; @updateColors()

        @onFontSizeChange()

    onChanged: (changeInfo) =>
        
        if changeInfo.cursors or changeInfo.selects
            @updateColors()
            return
        
        for change in changeInfo.changes
            li = change.doIndex
            if change.change == 'changed'
                @updateColor li
        
    #  0000000  000   000   0000000   000   000  000   000
    # 000       000   000  000   000  000 0 000  0000  000
    # 0000000   000000000  000   000  000000000  000 0 000
    #      000  000   000  000   000  000   000  000  0000
    # 0000000   000   000   0000000   00     00  000   000

    onLinesShown: (top, bot, num) =>

        @elem.innerHTML = ''
        @lineDivs = {}

        for li in [top..bot]

            div = @addLine li

            @emit 'numberAdded',
                numberDiv:  div
                numberSpan: div.firstChild
                lineIndex:  li

            @updateColor li

        @updateLinePositions()

    #  0000000  000   000  000  00000000  000000000  00000000  0000000
    # 000       000   000  000  000          000     000       000   000
    # 0000000   000000000  000  000000       000     0000000   000   000
    #      000  000   000  000  000          000     000       000   000
    # 0000000   000   000  000  000          000     00000000  0000000

    onLinesShifted: (top, bot, num) =>

        oldTop = top - num
        oldBot = bot - num

        divInto = (li,lo) =>

            if not @lineDivs[lo]
                log "#{@editor.name}.onLinesShifted.divInto -- no number div? top #{top} bot #{bot} num #{num} lo #{lo} li #{li}"
                return

            numberDiv = @lineDivs[li] = @lineDivs[lo]
            delete @lineDivs[lo]

            @updateColor li

        if num > 0
            while oldBot < bot
                oldBot += 1
                divInto oldBot, oldTop
                oldTop += 1
        else
            while oldTop > top
                oldTop -= 1
                divInto oldTop, oldBot
                oldBot -= 1

        @updateLinePositions()

    # 000      000  000   000  00000000     00000000    0000000    0000000
    # 000      000  0000  000  000          000   000  000   000  000
    # 000      000  000 0 000  0000000      00000000   000   000  0000000
    # 000      000  000  0000  000          000        000   000       000
    # 0000000  000  000   000  00000000     000         0000000   0000000

    updateLinePositions: ->

        for li, div of @lineDivs
            continue if not div?.style
            y = @editor.size.lineHeight * (li - @editor.scroll.top)
            div.style.transform = "translate3d(0, #{y}px, 0)"

    addLine: (li) ->

        text = '▶'
        div = elem class:'linenumber' child: elem 'span' text:text
        div.style.height = "#{@editor.size.lineHeight}px"
        @lineDivs[li] = div
        @elem.appendChild div
        div

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    onClearLines: =>

        @lineDivs = {}
        @elem.innerHTML = ""

    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000
    # 000       000   000  0000  000     000         000       000     000   000
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000
    # 000       000   000  000  0000     000              000  000   000     000
    # 000        0000000   000   000     000         0000000   000  0000000  00000000

    onFontSizeChange: =>

        fsz = Math.min 22, @editor.size.fontSize-4
        @elem.style.fontSize = "#{fsz}px"

    #  0000000   0000000   000       0000000   00000000    0000000
    # 000       000   000  000      000   000  000   000  000
    # 000       000   000  000      000   000  0000000    0000000
    # 000       000   000  000      000   000  000   000       000
    #  0000000   0000000   0000000   0000000   000   000  0000000

    updateColors: =>

        if @editor.scroll.bot > @editor.scroll.top
            # klog "colors #{@editor.scroll.top} #{@editor.scroll.bot}"
            for li in [@editor.scroll.top..@editor.scroll.bot]
                @updateColor li

    updateColor: (li) =>

        # klog "color #{li}"
        return if not @lineDivs[li]? # ok: e.g. commandlist

        si = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.selections())
        hi = (s[0] for s in rangesFromTopToBotInRanges li, li, @editor.highlights())
        ci = (s[0] for s in rangesFromTopToBotInRanges li, li, rangesFromPositions @editor.cursors())

        cls = ''
        if li in ci
            cls += ' cursored'
        if li == @editor.mainCursor()[1]
            cls += ' main'
        if li in si
            cls += ' selected'
        if li in hi
            cls += ' highligd'

        @lineDivs[li].className = 'linenumber' + cls
        @updateMeta li
        
    updateMeta: (li) ->

        m = @editor.meta.lineMetas[li]?[0]
        if m and m[2].number?.clss
            for clss in m[2].number?.clss.split ' '
                @lineDivs[li].classList.add clss
        @lineDivs[li].firstChild.innerHTML = m and (m[2].number?.text or '▪') or '●'

module.exports = Numbers
