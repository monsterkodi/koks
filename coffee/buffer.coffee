###
0000000    000   000  00000000  00000000  00000000  00000000 
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000  
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
###

{ log, _ } = require 'kxk'

class Buffer

    constructor: (@cols) -> @reset()

    reset: ->
        
        @lines = [[]]
        @attr  = 0
        @state = 0
        @x     = 0
        @y     = 0
        @lch   = null

module.exports = Buffer
