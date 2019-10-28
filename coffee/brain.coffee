###
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
###

{ post, prefs, kerror, klog } = require 'kxk'

class Brain

    @: ->
        
        specials = "_-@#"
        @especial = ("\\"+c for c in specials.split '').join ''
        @splitRegExp = new RegExp "[^\\w\\d#{@especial}]+" 'g'   
        @headerRegExp = new RegExp "^[0#{@especial}]+$"
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        
        @words = prefs.get 'brain▸words' clear:count:666 alias:count:666
        
        post.on 'cmd' @onCmd
        
    onCmd: (cmd, cwd) =>
        
        # klog 'brain.onCmd' cmd, cwd
                    
        if not cmd?.split? then return kerror "Brain.onCmd -- no split? #{cmd}"
            
        @addWord cmd
        
        words = cmd.split @splitRegExp
        
        # klog 'words1' words
        
        words = words.filter (w) => 
            # return false if not Indexer.testWord w
            # return false if w == cursorWord
            # return false if @word == w.slice 0, w.length-1
            return false if @headerRegExp.test w
            true
            
        for w in words # append words without leading special character
            i = w.search @notSpecialRegExp
            if i > 0 and w[0] != "#"
                w = w.slice i
                words.push w if not /^[\-]?[\d]+$/.test w
    
        for w in words
            @addWord w
        
        prefs.set 'brain▸words' @words
        # @dump()
    
    addWord: (w) ->
        
        info  = @words[w] ? {}
        count = info.count ? 0
        count += opt?.count ? 1
        info.count = count
        @words[w] = info
        
    dump: ->
        
        klog Object.keys(@words).sort().map (w) => "#{w} #{@words[w].count}"

module.exports = Brain