###
0000000    000   000  00000000  00000000  00000000  00000000 
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000  
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
###

{ log, _ } = require 'kxk'

class Buffer

    constructor: (size) -> 
        
        rows = Math.max 1, size?.rows ? 1
        cols = Math.max 1, size?.cols ? 1

        @reset()
        @resize cols, rows

    reset: ->
        
        @lines = [[]]
        @cache = [[]]
        @attr  = (257 << 9) | 256
        @state = 0
        @x     = 0
        @y     = 0
        @lch   = null
        
    resize: (cols, rows) ->
        
        @cols  = Math.max 1, cols
        @rows  = Math.max 1, rows

module.exports = Buffer
