###
000000000  00000000   0000000  000000000
   000     000       000          000   
   000     0000000   0000000      000   
   000     000            000     000   
   000     00000000  0000000      000   
###

{ log } = require '../../kxk'

parse  = require './parse'
Buffer = require './buffer'
assert = require 'assert'
chai   = require 'chai'
expect = chai.expect
chai.should()

ccc = (buf, line, col, char) -> expect(buf.lines[line][col][1]).to.eql char
chr = (buf, index, value, char) -> expect(buf.lines[0][index]).to.eql [value, char]
esc = (data) -> data.replace /\^\[/g, '\x1b'
prs = (data) -> parse esc(data), new Buffer 100

describe 'parse', ->
    
    it 'newline', ->
        
        buf = prs "lineA\rlineB"
        ccc buf, 0, 4, 'B'
        
        buf = prs "lineA\r\nlineB"
        ccc buf, 0, 4, 'A'
        ccc buf, 1, 4, 'B'
        
    it 'prompt', ->

        buf = prs "hello"
        chr buf, 0, 131840, 'h'
        chr buf, 1, 131840, 'e'
        chr buf, 2, 131840, 'l'
        chr buf, 3, 131840, 'l'
        chr buf, 4, 131840, 'o'
        
        buf = prs "^[[0;34;94m[^[[0;33;93m~^[[0;34;94m]^[[0m^[[0K"
        chr buf, 0, 6400, '['
        chr buf, 1, 5888, '~'
        chr buf, 2, 6400, ']'
        chr buf, 3, 131840, ' '
        
        buf = prs "^[[?25l\r^[[0;34;94m[^[[0;33;93m~^[[0;34;94m]^[[0m^[[0K^[[?25h"
        chr buf, 0, 6400, '['
        chr buf, 1, 5888, '~'
        chr buf, 2, 6400, ']'
        chr buf, 3, 131840, ' '
        