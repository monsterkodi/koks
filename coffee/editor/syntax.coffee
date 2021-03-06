###
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
###

{ matchr, empty, kstr, klor, elem, last, kerror, _ } = require 'kxk'

chroma = require 'chroma-js'

class Syntax
    
    @: (@name, @getLine, @getAnsi) ->

        @diss   = []
        @colors = {}
        @ansi   = new kstr.ansi

    # 0000000    000   0000000   0000000
    # 000   000  000  000       000
    # 000   000  000  0000000   0000000
    # 000   000  000       000       000
    # 0000000    000  0000000   0000000

    newDiss: (li) ->

        text = @getLine li

        if not text?
            return kerror "dissForLine -- no line at index #{li}?"
            
        return [start:0 length:0 match:''] if empty text

        if ansi = @getAnsi li
            diss = @ansi.dissect(ansi)[1]
            # klog 'newDiss' li, diss
        else
            diss = klor.dissect([text], 'sh')[0]
            
        diss

    getDiss: (li) ->

        if not @diss[li]?
            @diss[li] = @newDiss li

        # klog "#{li}" @diss[li]
            
        @diss[li]

    setDiss: (li, dss) ->

        @diss[li] = dss
        dss

    fillDiss: (bot) ->

        for li in [0..bot]
            @getDiss li

    #  0000000  00000000  000000000  000      000  000   000  00000000   0000000  
    # 000       000          000     000      000  0000  000  000       000       
    # 0000000   0000000      000     000      000  000 0 000  0000000   0000000   
    #      000  000          000     000      000  000  0000  000            000  
    # 0000000   00000000     000     0000000  000  000   000  00000000  0000000   
    
    setLines: (lines) ->
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        for change in changeInfo.changes

            [di,li,ch] = [change.doIndex, change.newIndex, change.change]

            switch ch

                when 'changed'

                    @diss[di] = @newDiss di

                when 'deleted'

                    @diss.splice di, 1

                when 'inserted'

                    @diss.splice di, 0, @newDiss di

    # 00000000  000  000      00000000  000000000  000   000  00000000   00000000
    # 000       000  000      000          000      000 000   000   000  000
    # 000000    000  000      0000000      000       00000    00000000   0000000
    # 000       000  000      000          000        000     000        000
    # 000       000  0000000  00000000     000        000     000        00000000

    setFileType: (@name) ->

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: ->

        @diss = []

    #  0000000   0000000   000       0000000   00000000
    # 000       000   000  000      000   000  000   000
    # 000       000   000  000      000   000  0000000
    # 000       000   000  000      000   000  000   000
    #  0000000   0000000   0000000   0000000   000   000

    colorForClassnames: (clss) ->

        if not @colors[clss]?

            div = elem class: clss
            document.body.appendChild div
            computedStyle = window.getComputedStyle div
            color = computedStyle.color
            opacity = computedStyle.opacity
            if opacity != '1'
                color = 'rgba(' + color.slice(4, color.length-2) + ', ' + opacity + ')'
            @colors[clss] = color
            div.remove()

        return @colors[clss]

    colorForStyle: (styl) ->

        if not @colors[styl]?
            div = elem 'div'
            div.style = styl
            document.body.appendChild div
            bgcol = kstr window.getComputedStyle(div).backgroundColor
            if styl.startsWith 'back' 
                @colors[styl] = bgcol
            else
                @colors[styl] = kstr window.getComputedStyle(div).color
                if bgcol != 'rgba(0, 0, 0, 0)'
                    @colors[styl] = chroma.mix(bgcol, @colors[styl], 0.5, 'hsl').css()
                    # klog 'color' @colors[styl]
            div.remove()

        return @colors[styl]

    schemeChanged: -> @colors = {}

    ###
     0000000  000000000   0000000   000000000  000   0000000
    000          000     000   000     000     000  000
    0000000      000     000000000     000     000  000
         000     000     000   000     000     000  000
    0000000      000     000   000     000     000   0000000
    ###

    @matchrConfigs = {}
    @syntaxNames = []

    @spanForTextAndSyntax: (text, n) ->

        l = ""
        diss = @dissForTextAndSyntax text, n
        if diss?.length
            last = 0
            for di in [0...diss.length]
                d = diss[di]
                style = d.styl? and d.styl.length and " style=\"#{d.styl}\"" or ''
                spc = ''
                for sp in [last...d.start]
                    spc += '&nbsp;'
                last  = d.start + d.match.length
                clss = d.clss? and d.clss.length and " class=\"#{d.clss}\"" or ''
                clrzd = "<span#{style}#{clss}>#{spc}#{kstr.encode d.match}</span>"
                l += clrzd
        l

    @rangesForTextAndSyntax: (line, n) ->

        matchr.ranges Syntax.matchrConfigs[n], line

    @dissForTextAndSyntax: (text, n) ->

        klor.ranges text, n

    @lineForDiss: (dss) ->

        l = ""
        for d in dss
            l = _.padEnd l, d.start
            l += d.match
        l

    # 000  000   000  000  000000000
    # 000  0000  000  000     000
    # 000  000 0 000  000     000
    # 000  000  0000  000     000
    # 000  000   000  000     000

    @init: ->

        # syntaxDir = "#{__dirname}/../../syntax/"

        # for syntaxFile in fs.readdirSync syntaxDir

            # syntaxName = slash.basename syntaxFile, '.noon'
            # patterns = noon.load slash.join syntaxDir, syntaxFile

            # patterns['\\w+']       = 'text'   # this ensures that all ...
            # patterns['[^\\w\\s]+'] = 'syntax' # non-space characters match

            # if patterns.ko?.extnames?
                # extnames = patterns.ko.extnames
                # delete patterns.ko

                # config = matchr.config patterns
                # for syntaxName in extnames
                    # @syntaxNames.push syntaxName
                    # @matchrConfigs[syntaxName] = config
            # else
                # @syntaxNames.push syntaxName
                # @matchrConfigs[syntaxName] = matchr.config patterns

        # klor.init()
        @syntaxNames = @syntaxNames.concat klor.exts

Syntax.init()
module.exports = Syntax
