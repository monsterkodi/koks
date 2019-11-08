// koffee 1.4.0

/*
00000000  0000000    000  000000000   0000000   00000000          0000000   0000000  00000000    0000000   000      000      
000       000   000  000     000     000   000  000   000        000       000       000   000  000   000  000      000      
0000000   000   000  000     000     000   000  0000000          0000000   000       0000000    000   000  000      000      
000       000   000  000     000     000   000  000   000             000  000       000   000  000   000  000      000      
00000000  0000000    000     000      0000000   000   000        0000000    0000000  000   000   0000000   0000000  0000000
 */
var EditorScroll, clamp, events, kerror, kxk, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), clamp = ref.clamp, kerror = ref.kerror;

events = require('events');

kxk = require('kxk');

EditorScroll = (function(superClass) {
    extend(EditorScroll, superClass);

    function EditorScroll(editor) {
        var ref1;
        this.editor = editor;
        this.setLineHeight = bind(this.setLineHeight, this);
        this.setNumLines = bind(this.setNumLines, this);
        this.setViewHeight = bind(this.setViewHeight, this);
        this.reset = bind(this.reset, this);
        this.setTop = bind(this.setTop, this);
        this.by = bind(this.by, this);
        this.to = bind(this.to, this);
        this.horizontal = bind(this.horizontal, this);
        this.start = bind(this.start, this);
        EditorScroll.__super__.constructor.call(this);
        this.lineHeight = (ref1 = this.editor.size.lineHeight) != null ? ref1 : 0;
        this.viewHeight = -1;
        this.init();
    }

    EditorScroll.prototype.init = function() {
        this.scroll = 0;
        this.offsetTop = 0;
        this.offsetSmooth = 0;
        this.viewHeight = -1;
        this.fullHeight = -1;
        this.fullLines = -1;
        this.viewLines = -1;
        this.scrollMax = -1;
        this.numLines = -1;
        this.top = -1;
        return this.bot = -1;
    };

    EditorScroll.prototype.start = function(viewHeight, numLines) {
        this.viewHeight = viewHeight;
        this.numLines = numLines;
        this.fullHeight = this.numLines * this.lineHeight;
        this.top = 0;
        this.bot = this.top - 1;
        this.calc();
        return this.by(0);
    };

    EditorScroll.prototype.calc = function() {
        if (this.viewHeight <= 0) {
            return;
        }
        this.scrollMax = Math.max(0, this.fullHeight - this.viewHeight);
        this.fullLines = Math.floor(this.viewHeight / this.lineHeight);
        return this.viewLines = Math.ceil(this.viewHeight / this.lineHeight) + 1;
    };

    EditorScroll.prototype.horizontal = function(x) {
        if (x == null) {
            x = 0;
        }
        return this.editor.layerScroll.scrollLeft += x;
    };

    EditorScroll.prototype.to = function(p) {
        return this.by(p - this.scroll);
    };

    EditorScroll.prototype.by = function(delta) {
        var offset, scroll, top;
        if (this.viewLines < 0) {
            return;
        }
        if (!delta && this.top < this.bot) {
            return;
        }
        scroll = this.scroll;
        if (Number.isNaN(delta)) {
            delta = 0;
        }
        this.scroll = parseInt(clamp(0, this.scrollMax, this.scroll + delta));
        top = parseInt(this.scroll / this.lineHeight);
        this.offsetSmooth = this.scroll - top * this.lineHeight;
        this.setTop(top);
        offset = 0;
        offset += this.offsetSmooth;
        offset += (top - this.top) * this.lineHeight;
        if (offset !== this.offsetTop || scroll !== this.scroll) {
            this.offsetTop = parseInt(offset);
            this.updateOffset();
            return this.emit('scroll', this.scroll, this.offsetTop);
        }
    };

    EditorScroll.prototype.setTop = function(top) {
        var num, oldBot, oldTop;
        oldTop = this.top;
        oldBot = this.bot;
        this.bot = Math.min(top + this.viewLines, this.numLines - 1);
        this.top = Math.max(0, this.bot - this.viewLines);
        if (oldTop === this.top && oldBot === this.bot) {
            return;
        }
        if ((this.top > oldBot) || (this.bot < oldTop) || (oldBot < oldTop)) {
            num = this.bot - this.top + 1;
            if (num > 0) {
                return this.emit('showLines', this.top, this.bot, num);
            }
        } else {
            num = this.top - oldTop;
            if (0 < Math.abs(num)) {
                return this.emit('shiftLines', this.top, this.bot, num);
            }
        }
    };

    EditorScroll.prototype.lineIndexIsInView = function(li) {
        return (this.top <= li && li <= this.bot);
    };

    EditorScroll.prototype.reset = function() {
        this.emit('clearLines');
        this.init();
        return this.updateOffset();
    };

    EditorScroll.prototype.setViewHeight = function(h) {
        if (this.viewHeight !== h) {
            this.bot = this.top - 1;
            this.viewHeight = h;
            this.calc();
            return this.by(0);
        }
    };

    EditorScroll.prototype.setNumLines = function(n, opt) {
        if (this.numLines !== n) {
            this.fullHeight = n * this.lineHeight;
            if (n) {
                if ((opt != null ? opt.showLines : void 0) !== false) {
                    this.bot = this.top - 1;
                }
                this.numLines = n;
                this.calc();
                return this.by(0);
            } else {
                this.init();
                return this.emit('clearLines');
            }
        }
    };

    EditorScroll.prototype.setLineHeight = function(h) {
        if (Number.isNaN(h)) {
            return kerror('editorscroll.setLineHeight -- NaN');
        }
        if (this.lineHeight !== h) {
            this.lineHeight = h;
            this.fullHeight = this.numLines * this.lineHeight;
            this.calc();
            return this.by(0);
        }
    };

    EditorScroll.prototype.updateOffset = function() {
        return this.editor.layers.style.transform = "translate3d(0,-" + this.offsetTop + "px, 0)";
    };

    EditorScroll.prototype.cursorToTop = function(topDist) {
        var cp, hl, rg, sl;
        if (topDist == null) {
            topDist = 7;
        }
        cp = this.editor.cursorPos();
        if (cp[1] - this.top > topDist) {
            rg = [this.top, Math.max(0, cp[1] - 1)];
            sl = this.editor.selectionsInLineIndexRange(rg);
            hl = this.editor.highlightsInLineIndexRange(rg);
            if ((sl.length === 0 && 0 === hl.length)) {
                return this.by(this.lineHeight * (cp[1] - this.top - topDist));
            }
        }
    };

    EditorScroll.prototype.cursorIntoView = function() {
        var delta;
        if (delta = this.deltaToEnsureMainCursorIsVisible()) {
            this.by(delta * this.lineHeight - this.offsetSmooth);
        }
        return this.updateCursorOffset();
    };

    EditorScroll.prototype.deltaToEnsureMainCursorIsVisible = function() {
        var cl, maindelta, offset, ref1, ref2;
        maindelta = 0;
        cl = this.editor.mainCursor()[1];
        offset = (ref1 = (ref2 = this.editor.config) != null ? ref2.scrollOffset : void 0) != null ? ref1 : 2;
        if (cl < this.top + offset + this.offsetTop / this.lineHeight) {
            maindelta = cl - (this.top + offset + this.offsetTop / this.lineHeight);
        } else if (cl > this.top + this.fullLines - offset - 1) {
            maindelta = cl - (this.top + this.fullLines - offset - 1);
        }
        return maindelta;
    };

    EditorScroll.prototype.updateCursorOffset = function() {
        var charWidth, cx, layersWidth, offsetX, scrollLeft;
        offsetX = this.editor.size.offsetX;
        charWidth = this.editor.size.charWidth;
        layersWidth = this.editor.layersWidth;
        scrollLeft = this.editor.layerScroll.scrollLeft;
        cx = this.editor.mainCursor()[0] * charWidth + offsetX;
        if (cx - scrollLeft > layersWidth) {
            return this.editor.layerScroll.scrollLeft = Math.max(0, cx - layersWidth + charWidth);
        } else if (cx - offsetX - scrollLeft < 0) {
            return this.editor.layerScroll.scrollLeft = Math.max(0, cx - offsetX);
        }
    };

    EditorScroll.prototype.info = function() {
        return {
            topbot: this.top + " .. " + this.bot + " = " + (this.bot - this.top) + " / " + this.numLines + " lines",
            scroll: this.scroll + " offsetTop " + this.offsetTop + " viewHeight " + this.viewHeight + " scrollMax " + this.scrollMax + " fullLines " + this.fullLines + " viewLines " + this.viewLines
        };
    };

    return EditorScroll;

})(events);

module.exports = EditorScroll;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yc2Nyb2xsLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2Q0FBQTtJQUFBOzs7O0FBUUEsTUFBb0IsT0FBQSxDQUFRLEtBQVIsQ0FBcEIsRUFBRSxpQkFBRixFQUFTOztBQUVULE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxHQUFBLEdBQVMsT0FBQSxDQUFRLEtBQVI7O0FBRUg7OztJQUVDLHNCQUFDLE1BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7Ozs7UUFFQSw0Q0FBQTtRQUNBLElBQUMsQ0FBQSxVQUFELHlEQUF3QztRQUN4QyxJQUFDLENBQUEsVUFBRCxHQUFjLENBQUM7UUFDZixJQUFDLENBQUEsSUFBRCxDQUFBO0lBTEQ7OzJCQWFILElBQUEsR0FBTSxTQUFBO1FBRUYsSUFBQyxDQUFBLE1BQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFFakIsSUFBQyxDQUFBLFVBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsVUFBRCxHQUFnQixDQUFDO1FBQ2pCLElBQUMsQ0FBQSxTQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsU0FBRCxHQUFnQixDQUFDO1FBQ2pCLElBQUMsQ0FBQSxRQUFELEdBQWdCLENBQUM7UUFDakIsSUFBQyxDQUFBLEdBQUQsR0FBZ0IsQ0FBQztlQUNqQixJQUFDLENBQUEsR0FBRCxHQUFnQixDQUFDO0lBYmY7OzJCQWVOLEtBQUEsR0FBTyxTQUFDLFVBQUQsRUFBYyxRQUFkO1FBQUMsSUFBQyxDQUFBLGFBQUQ7UUFBYSxJQUFDLENBQUEsV0FBRDtRQUVqQixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO1FB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QWpCLEVBRmhDOztJQWJXOzsyQkF1QnBCLElBQUEsR0FBTSxTQUFBO2VBRUY7WUFBQSxNQUFBLEVBQVcsSUFBQyxDQUFBLEdBQUYsR0FBTSxNQUFOLEdBQVksSUFBQyxDQUFBLEdBQWIsR0FBaUIsS0FBakIsR0FBcUIsQ0FBQyxJQUFDLENBQUEsR0FBRCxHQUFLLElBQUMsQ0FBQSxHQUFQLENBQXJCLEdBQWdDLEtBQWhDLEdBQXFDLElBQUMsQ0FBQSxRQUF0QyxHQUErQyxRQUF6RDtZQUNBLE1BQUEsRUFBVyxJQUFDLENBQUEsTUFBRixHQUFTLGFBQVQsR0FBc0IsSUFBQyxDQUFBLFNBQXZCLEdBQWlDLGNBQWpDLEdBQStDLElBQUMsQ0FBQSxVQUFoRCxHQUEyRCxhQUEzRCxHQUF3RSxJQUFDLENBQUEsU0FBekUsR0FBbUYsYUFBbkYsR0FBZ0csSUFBQyxDQUFBLFNBQWpHLEdBQTJHLGFBQTNHLEdBQXdILElBQUMsQ0FBQSxTQURuSTs7SUFGRTs7OztHQXhRaUI7O0FBNlEzQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4wMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgXG4jIyNcblxueyBjbGFtcCwga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmV2ZW50cyA9IHJlcXVpcmUgJ2V2ZW50cydcbmt4ayAgICA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgRWRpdG9yU2Nyb2xsIGV4dGVuZHMgZXZlbnRzXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBsaW5lSGVpZ2h0ID0gQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgPyAwXG4gICAgICAgIEB2aWV3SGVpZ2h0ID0gLTFcbiAgICAgICAgQGluaXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBpbml0OiAtPlxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbCAgICAgICA9ICAwICMgY3VycmVudCBzY3JvbGwgdmFsdWUgZnJvbSBkb2N1bWVudCBzdGFydCAocGl4ZWxzKVxuICAgICAgICBAb2Zmc2V0VG9wICAgID0gIDAgIyBoZWlnaHQgb2YgdmlldyBhYm92ZSBmaXJzdCB2aXNpYmxlIGxpbmUgKHBpeGVscylcbiAgICAgICAgQG9mZnNldFNtb290aCA9ICAwICMgc21vb3RoIHNjcm9sbGluZyBvZmZzZXQgLyBwYXJ0IG9mIHRvcCBsaW5lIHRoYXQgaXMgaGlkZGVuIChwaXhlbHMpXG4gICAgICAgIFxuICAgICAgICBAdmlld0hlaWdodCAgID0gLTFcbiAgICAgICAgQGZ1bGxIZWlnaHQgICA9IC0xICMgdG90YWwgaGVpZ2h0IG9mIGJ1ZmZlciAocGl4ZWxzKVxuICAgICAgICBAZnVsbExpbmVzICAgID0gLTEgIyBudW1iZXIgb2YgZnVsbCBsaW5lcyBmaXR0aW5nIGluIHZpZXcgKGV4Y2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQHZpZXdMaW5lcyAgICA9IC0xICMgbnVtYmVyIG9mIGxpbmVzIGZpdHRpbmcgaW4gdmlldyAoaW5jbHVkaW5nIHBhcnRpYWxzKVxuICAgICAgICBAc2Nyb2xsTWF4ICAgID0gLTEgIyBtYXhpbXVtIHNjcm9sbCBvZmZzZXQgKHBpeGVscylcbiAgICAgICAgQG51bUxpbmVzICAgICA9IC0xICMgdG90YWwgbnVtYmVyIG9mIGxpbmVzIGluIGJ1ZmZlclxuICAgICAgICBAdG9wICAgICAgICAgID0gLTEgIyBpbmRleCBvZiBmaXJzdCB2aXNpYmxlIGxpbmUgaW4gdmlld1xuICAgICAgICBAYm90ICAgICAgICAgID0gLTEgIyBpbmRleCBvZiBsYXN0ICB2aXNpYmxlIGxpbmUgaW4gdmlld1xuXG4gICAgc3RhcnQ6IChAdmlld0hlaWdodCwgQG51bUxpbmVzKSA9PlxuICAgICAgICBcbiAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodFxuICAgICAgICBAdG9wID0gMFxuICAgICAgICBAYm90ID0gQHRvcC0xXG4gICAgICAgIEBjYWxjKClcbiAgICAgICAgQGJ5IDBcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGNhbGM6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAdmlld0hlaWdodCA8PSAwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAc2Nyb2xsTWF4ICAgPSBNYXRoLm1heCgwLEBmdWxsSGVpZ2h0IC0gQHZpZXdIZWlnaHQpICAgIyBtYXhpbXVtIHNjcm9sbCBvZmZzZXQgKHBpeGVscylcbiAgICAgICAgQGZ1bGxMaW5lcyAgID0gTWF0aC5mbG9vcihAdmlld0hlaWdodCAvIEBsaW5lSGVpZ2h0KSAgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGV4Y2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQHZpZXdMaW5lcyAgID0gTWF0aC5jZWlsKEB2aWV3SGVpZ2h0IC8gQGxpbmVIZWlnaHQpKzEgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGluY2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnY2FsYycgQHZpZXdMaW5lcywgQGxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgaG9yaXpvbnRhbDogKHg9MCkgPT4gQGVkaXRvci5sYXllclNjcm9sbC5zY3JvbGxMZWZ0ICs9IHhcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAgICAgICAgICAgICBcbiAgICB0bzogKHApID0+IEBieSBwLUBzY3JvbGxcbiAgICBcbiAgICBieTogKGRlbHRhKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIEB2aWV3TGluZXMgPCAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgZGVsdGEgYW5kIEB0b3AgPCBAYm90XG4gICAgICAgIFxuICAgICAgICBzY3JvbGwgPSBAc2Nyb2xsXG4gICAgICAgIGRlbHRhID0gMCBpZiBOdW1iZXIuaXNOYU4gZGVsdGFcbiAgICAgICAgQHNjcm9sbCA9IHBhcnNlSW50IGNsYW1wIDAsIEBzY3JvbGxNYXgsIEBzY3JvbGwrZGVsdGFcbiAgICAgICAgdG9wID0gcGFyc2VJbnQgQHNjcm9sbCAvIEBsaW5lSGVpZ2h0XG4gICAgICAgIEBvZmZzZXRTbW9vdGggPSBAc2Nyb2xsIC0gdG9wICogQGxpbmVIZWlnaHQgXG4gICAgICAgIFxuICAgICAgICBAc2V0VG9wIHRvcFxuXG4gICAgICAgIG9mZnNldCA9IDBcbiAgICAgICAgb2Zmc2V0ICs9IEBvZmZzZXRTbW9vdGhcbiAgICAgICAgb2Zmc2V0ICs9ICh0b3AgLSBAdG9wKSAqIEBsaW5lSGVpZ2h0XG4gICAgICAgIFxuICAgICAgICBpZiBvZmZzZXQgIT0gQG9mZnNldFRvcCBvciBzY3JvbGwgIT0gQHNjcm9sbFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAb2Zmc2V0VG9wID0gcGFyc2VJbnQgb2Zmc2V0XG4gICAgICAgICAgICBAdXBkYXRlT2Zmc2V0KClcbiAgICAgICAgICAgIEBlbWl0ICdzY3JvbGwnIEBzY3JvbGwsIEBvZmZzZXRUb3BcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAwIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgXG4gICAgICAgICAgICBcbiAgICBzZXRUb3A6ICh0b3ApID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSBAdG9wXG4gICAgICAgIG9sZEJvdCA9IEBib3RcbiAgICAgICAgXG4gICAgICAgIEBib3QgPSBNYXRoLm1pbiB0b3ArQHZpZXdMaW5lcywgQG51bUxpbmVzLTFcbiAgICAgICAgQHRvcCA9IE1hdGgubWF4IDAsIEBib3QgLSBAdmlld0xpbmVzXG5cbiAgICAgICAgIyBrbG9nICdvbGQnIG9sZFRvcCwgb2xkQm90LCBAdG9wLCBAYm90LCBAdmlld0xpbmVzLCBAbnVtTGluZXNcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBvbGRUb3AgPT0gQHRvcCBhbmQgb2xkQm90ID09IEBib3RcbiAgICAgICAgICAgIFxuICAgICAgICBpZiAoQHRvcCA+IG9sZEJvdCkgb3IgKEBib3QgPCBvbGRUb3ApIG9yIChvbGRCb3QgPCBvbGRUb3ApIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGtsb2cgJ3N0YXJ0IGZyb20gc2NyYXRjaCdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIyBuZXcgcmFuZ2Ugb3V0c2lkZSwgc3RhcnQgZnJvbSBzY3JhdGNoXG4gICAgICAgICAgICBudW0gPSBAYm90IC0gQHRvcCArIDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgICAgIEBlbWl0ICdzaG93TGluZXMnIEB0b3AsIEBib3QsIG51bVxuXG4gICAgICAgIGVsc2UgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIyBrbG9nICdzaGlmdExpbmVzJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBudW0gPSBAdG9wIC0gb2xkVG9wXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIDAgPCBNYXRoLmFicyBudW1cbiAgICAgICAgICAgICAgICBAZW1pdCAnc2hpZnRMaW5lcycgQHRvcCwgQGJvdCwgbnVtXG4gICAgICAgICAgICAgICAgXG4gICAgbGluZUluZGV4SXNJblZpZXc6IChsaSkgLT4gQHRvcCA8PSBsaSA8PSBAYm90XG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICByZXNldDogPT5cbiAgICAgICAgXG4gICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJ1xuICAgICAgICBAaW5pdCgpXG4gICAgICAgIEB1cGRhdGVPZmZzZXQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjICAgICAwICAgICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcblxuICAgIHNldFZpZXdIZWlnaHQ6IChoKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQHZpZXdIZWlnaHQgIT0gaFxuICAgICAgICAgICAgQGJvdCA9IEB0b3AtMSAjIGFsd2F5cyBlbWl0IHNob3dMaW5lcyBpZiBoZWlnaHQgY2hhbmdlc1xuICAgICAgICAgICAgQHZpZXdIZWlnaHQgPSBoXG4gICAgICAgICAgICBAY2FsYygpXG4gICAgICAgICAgICBAYnkgMFxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG4gICAgICAgIFxuICAgIHNldE51bUxpbmVzOiAobiwgb3B0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bUxpbmVzICE9IG5cbiAgICAgICAgICAgIEBmdWxsSGVpZ2h0ID0gbiAqIEBsaW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiBuXG4gICAgICAgICAgICAgICAgaWYgb3B0Py5zaG93TGluZXMgIT0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgQGJvdCA9IEB0b3AtMSAjIGFsd2F5cyBlbWl0IHNob3dMaW5lcyBpZiBsaW5lIG51bWJlciBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgQG51bUxpbmVzID0gblxuICAgICAgICAgICAgICAgIEBjYWxjKClcbiAgICAgICAgICAgICAgICBAYnkgMFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBpbml0KClcbiAgICAgICAgICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcycgICAgICAgICAgICAgXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgc2V0TGluZUhlaWdodDogKGgpID0+XG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciAnZWRpdG9yc2Nyb2xsLnNldExpbmVIZWlnaHQgLS0gTmFOJyBpZiBOdW1iZXIuaXNOYU4gaFxuICAgICAgICAjIGtsb2cgJ3NldExpbmVIZWlnaHQnIEBsaW5lSGVpZ2h0LCBoXG4gICAgICAgIGlmIEBsaW5lSGVpZ2h0ICE9IGhcbiAgICAgICAgICAgIEBsaW5lSGVpZ2h0ID0gaFxuICAgICAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodFxuICAgICAgICAgICAgQGNhbGMoKVxuICAgICAgICAgICAgQGJ5IDBcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdXBkYXRlT2Zmc2V0OiAtPiBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvci5sYXllcnMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgwLC0je0BvZmZzZXRUb3B9cHgsIDApXCJcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICAgICAgICAgXG4gICAgY3Vyc29yVG9Ub3A6ICh0b3BEaXN0PTcpIC0+XG4gICAgICAgIFxuICAgICAgICBjcCA9IEBlZGl0b3IuY3Vyc29yUG9zKClcbiAgICAgICAgXG4gICAgICAgIGlmIGNwWzFdIC0gQHRvcCA+IHRvcERpc3RcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmcgPSBbQHRvcCwgTWF0aC5tYXggMCwgY3BbMV0tMV1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2wgPSBAZWRpdG9yLnNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlIHJnXG4gICAgICAgICAgICBobCA9IEBlZGl0b3IuaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2UgcmdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc2wubGVuZ3RoID09IDAgPT0gaGwubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGJ5IEBsaW5lSGVpZ2h0ICogKGNwWzFdIC0gQHRvcCAtIHRvcERpc3QpXG5cbiAgICBjdXJzb3JJbnRvVmlldzogLT5cblxuICAgICAgICBpZiBkZWx0YSA9IEBkZWx0YVRvRW5zdXJlTWFpbkN1cnNvcklzVmlzaWJsZSgpXG4gICAgICAgICAgICBAYnkgZGVsdGEgKiBAbGluZUhlaWdodCAtIEBvZmZzZXRTbW9vdGhcbiAgICAgICAgICAgIFxuICAgICAgICBAdXBkYXRlQ3Vyc29yT2Zmc2V0KClcblxuICAgIGRlbHRhVG9FbnN1cmVNYWluQ3Vyc29ySXNWaXNpYmxlOiAtPlxuICAgICAgICBcbiAgICAgICAgbWFpbmRlbHRhID0gMFxuICAgICAgICBjbCA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzFdXG4gICAgICAgIFxuICAgICAgICBvZmZzZXQgPSBAZWRpdG9yLmNvbmZpZz8uc2Nyb2xsT2Zmc2V0ID8gMlxuICAgICAgICBcbiAgICAgICAgaWYgY2wgPCBAdG9wICsgb2Zmc2V0ICsgQG9mZnNldFRvcCAvIEBsaW5lSGVpZ2h0XG4gICAgICAgICAgICBtYWluZGVsdGEgPSBjbCAtIChAdG9wICsgb2Zmc2V0ICsgQG9mZnNldFRvcCAvIEBsaW5lSGVpZ2h0KVxuICAgICAgICBlbHNlIGlmIGNsID4gQHRvcCArIEBmdWxsTGluZXMgLSBvZmZzZXQgLSAxXG4gICAgICAgICAgICBtYWluZGVsdGEgPSBjbCAtIChAdG9wICsgQGZ1bGxMaW5lcyAtIG9mZnNldCAtIDEpXG5cbiAgICAgICAgbWFpbmRlbHRhXG4gICAgICAgICAgICBcbiAgICB1cGRhdGVDdXJzb3JPZmZzZXQ6IC0+XG4gICAgICAgIFxuICAgICAgICBvZmZzZXRYICAgICA9IEBlZGl0b3Iuc2l6ZS5vZmZzZXRYXG4gICAgICAgIGNoYXJXaWR0aCAgID0gQGVkaXRvci5zaXplLmNoYXJXaWR0aFxuICAgICAgICBsYXllcnNXaWR0aCA9IEBlZGl0b3IubGF5ZXJzV2lkdGhcbiAgICAgICAgc2Nyb2xsTGVmdCAgPSBAZWRpdG9yLmxheWVyU2Nyb2xsLnNjcm9sbExlZnRcblxuICAgICAgICBjeCA9IEBlZGl0b3IubWFpbkN1cnNvcigpWzBdKmNoYXJXaWR0aCtvZmZzZXRYXG4gICAgICAgIFxuICAgICAgICBpZiBjeC1zY3JvbGxMZWZ0ID4gbGF5ZXJzV2lkdGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVkaXRvci5sYXllclNjcm9sbC5zY3JvbGxMZWZ0ID0gTWF0aC5tYXggMCwgY3ggLSBsYXllcnNXaWR0aCArIGNoYXJXaWR0aFxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgY3gtb2Zmc2V0WC1zY3JvbGxMZWZ0IDwgMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZWRpdG9yLmxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSBNYXRoLm1heCAwLCBjeCAtIG9mZnNldFhcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgXG4gICAgXG4gICAgaW5mbzogLT5cbiAgICAgICAgXG4gICAgICAgIHRvcGJvdDogXCIje0B0b3B9IC4uICN7QGJvdH0gPSAje0Bib3QtQHRvcH0gLyAje0BudW1MaW5lc30gbGluZXNcIlxuICAgICAgICBzY3JvbGw6IFwiI3tAc2Nyb2xsfSBvZmZzZXRUb3AgI3tAb2Zmc2V0VG9wfSB2aWV3SGVpZ2h0ICN7QHZpZXdIZWlnaHR9IHNjcm9sbE1heCAje0BzY3JvbGxNYXh9IGZ1bGxMaW5lcyAje0BmdWxsTGluZXN9IHZpZXdMaW5lcyAje0B2aWV3TGluZXN9XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclNjcm9sbFxuIl19
//# sourceURL=../../coffee/editor/editorscroll.coffee