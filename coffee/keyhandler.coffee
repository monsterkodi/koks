###
000   000  00000000  000   000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000  000   000        000 000   000   000  000   000  0000  000  000   000  000      000       000   000
0000000    0000000     00000    000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000  000   000          000     000   000  000   000  000  0000  000   000  000      000       000   000
000   000  00000000     000     000   000  000   000  000   000  0000000    0000000  00000000  000   000
###

{ post, stopEvent, empty, klog, $ } = require 'kxk'

class KeyHandler

    @: (@term) -> 
        
        post.on 'combo' @onCombo
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   

    onCombo: (combo, info) =>

        log 'keyhandler.onCombo', info.mod, info.key, info.combo, info.char
        # if info.char
            # @term.editor
                                
module.exports = KeyHandler
