// koffee 1.3.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var $, MapScroll, Minimap, clamp, colors, drag, elem, empty, getStyle, klog, kstr, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, getStyle = ref.getStyle, empty = ref.empty, clamp = ref.clamp, elem = ref.elem, drag = ref.drag, kstr = ref.kstr, klog = ref.klog, $ = ref.$;

MapScroll = require('./mapscroll');

colors = require('./colors');

Minimap = (function() {
    function Minimap(term) {
        var main, minimapWidth;
        this.term = term;
        this.clearAll = bind(this.clearAll, this);
        this.onScroll = bind(this.onScroll, this);
        this.onEditorScroll = bind(this.onEditorScroll, this);
        this.onStart = bind(this.onStart, this);
        this.onDrag = bind(this.onDrag, this);
        this.onChanged = bind(this.onChanged, this);
        this.onVanishLines = bind(this.onVanishLines, this);
        this.onExposeLines = bind(this.onExposeLines, this);
        this.exposeLine = bind(this.exposeLine, this);
        this.drawTopBot = bind(this.drawTopBot, this);
        minimapWidth = parseInt(getStyle('.minimap', 'width'));
        this.colors = {};
        this.width = 2 * minimapWidth;
        this.height = 8192;
        this.offsetLeft = 6;
        this.elem = elem({
            "class": 'minimap',
            id: 'minimap'
        });
        this.topbot = elem({
            "class": 'topbot'
        });
        this.lines = elem('canvas', {
            "class": 'minimapLines',
            width: this.width,
            height: this.height
        });
        this.elem.appendChild(this.topbot);
        this.elem.appendChild(this.lines);
        main = $('#main');
        main.appendChild(this.elem);
        post.on('clearLines', this.onEditorScroll);
        post.on('scroll', this.onEditorScroll);
        this.scroll = new MapScroll({
            exposeMax: this.height / 4,
            lineHeight: 4,
            viewHeight: 2 * main.clientHeight
        });
        this.scroll.name = "minimap";
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'pointer'
        });
        this.scroll.on('clearLines', this.clearAll);
        this.scroll.on('scroll', this.onScroll);
        this.scroll.on('exposeLines', this.onExposeLines);
        this.scroll.on('vanishLines', this.onVanishLines);
        this.scroll.on('exposeLine', this.exposeLine);
        this.onScroll();
        this.drawLines();
        this.drawTopBot();
    }

    Minimap.prototype.drawLine = function(index) {
        return this.drawLines(index, index);
    };

    Minimap.prototype.drawLines = function(top, bot) {
        var attr, charData, ctx, fg, fgColor, i, j, li, line, ref1, ref2, results, y;
        if (top == null) {
            top = this.scroll.exposeTop;
        }
        if (bot == null) {
            bot = this.scroll.exposeBot;
        }
        ctx = this.lines.getContext('2d');
        y = parseInt((top - this.scroll.exposeTop) * this.scroll.lineHeight);
        ctx.clearRect(0, y, this.width, ((bot - this.scroll.exposeTop) - (top - this.scroll.exposeTop) + 1) * this.scroll.lineHeight);
        if (this.scroll.exposeBot < 0) {
            return;
        }
        if (bot < top) {
            return;
        }
        results = [];
        for (li = j = ref1 = top, ref2 = bot; ref1 <= ref2 ? j <= ref2 : j >= ref2; li = ref1 <= ref2 ? ++j : --j) {
            y = parseInt((li - this.scroll.exposeTop) * this.scroll.lineHeight);
            line = this.term.bufferLines().get(li);
            results.push((function() {
                var k, ref3, results1;
                results1 = [];
                for (i = k = 0, ref3 = line.length; 0 <= ref3 ? k < ref3 : k > ref3; i = 0 <= ref3 ? ++k : --k) {
                    if (2 * i >= this.width) {
                        break;
                    }
                    charData = line.get(i);
                    fgColor = line.getFg(i);
                    if (charData[3] !== 0 && charData[3] !== 32) {
                        attr = charData[0];
                        fg = fgColor & 0x1ff;
                        ctx.fillStyle = colors[fg];
                        results1.push(ctx.fillRect(this.offsetLeft + 2 * i, y, 2, this.scroll.lineHeight));
                    } else {
                        results1.push(void 0);
                    }
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Minimap.prototype.drawTopBot = function() {
        var lh, th, ty;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        lh = this.scroll.lineHeight / 2;
        th = (this.term.scroll.bot - this.term.scroll.top + 1) * lh;
        ty = 0;
        if (this.term.scroll.scrollMax) {
            ty = (Math.min(0.5 * this.scroll.viewHeight, this.scroll.numLines * 2) - th) * this.term.scroll.scroll / this.term.scroll.scrollMax;
        }
        this.topbot.style.height = th + "px";
        return this.topbot.style.top = ty + "px";
    };

    Minimap.prototype.exposeLine = function(li) {
        return this.drawLines(li, li);
    };

    Minimap.prototype.onExposeLines = function(e) {
        return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
    };

    Minimap.prototype.onVanishLines = function(e) {
        if (e.top != null) {
            return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
        } else {
            return this.clearRange(this.scroll.exposeBot, this.scroll.exposeBot + this.scroll.numLines);
        }
    };

    Minimap.prototype.onChanged = function(changeInfo) {
        var change, j, len, li, ref1, ref2;
        if (changeInfo.selects) {
            this.drawSelections();
        }
        if (changeInfo.cursors) {
            this.drawCursors();
        }
        if (!changeInfo.changes.length) {
            return;
        }
        this.scroll.setNumLines(this.term.numLines());
        ref1 = changeInfo.changes;
        for (j = 0, len = ref1.length; j < len; j++) {
            change = ref1[j];
            li = change.oldIndex;
            if ((ref2 = !change.change) === 'deleted' || ref2 === 'inserted') {
                break;
            }
            this.drawLines(li, li);
        }
        if (li <= this.scroll.exposeBot) {
            return this.drawLines(li, this.scroll.exposeBot);
        }
    };

    Minimap.prototype.onDrag = function(drag, event) {
        var br, li, pc, ry;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            br = this.elem.getBoundingClientRect();
            ry = event.clientY - br.top;
            pc = 2 * ry / this.scroll.viewHeight;
            li = parseInt(pc * this.term.scroll.numLines);
            return this.jumpToLine(li, event);
        } else {
            return this.jumpToLine(this.lineIndexForEvent(event), event);
        }
    };

    Minimap.prototype.onStart = function(drag, event) {
        return this.jumpToLine(this.lineIndexForEvent(event), event);
    };

    Minimap.prototype.jumpToLine = function(li, event) {
        this.term.scroll.to((li - 5) * this.term.scroll.lineHeight);
        return this.onEditorScroll();
    };

    Minimap.prototype.lineIndexForEvent = function(event) {
        var br, li, ly, py, st;
        st = this.elem.scrollTop;
        br = this.elem.getBoundingClientRect();
        ly = clamp(0, this.elem.offsetHeight, event.clientY - br.top);
        py = parseInt(Math.floor(2 * ly / this.scroll.lineHeight)) + this.scroll.top;
        li = parseInt(Math.min(this.scroll.numLines - 1, py));
        return li;
    };

    Minimap.prototype.onEditorScroll = function(scrollValue, editorScroll) {
        var pc, tp;
        if (editorScroll != null) {
            editorScroll;
        } else {
            editorScroll = this.term.scroll;
        }
        if (this.scroll.viewHeight !== 2 * editorScroll.viewHeight) {
            this.scroll.setViewHeight(2 * editorScroll.viewHeight);
            this.onScroll();
        }
        if (this.scroll.numLines !== editorScroll.numLines) {
            this.scroll.setNumLines(editorScroll.numLines);
        }
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            pc = editorScroll.scroll / editorScroll.scrollMax;
            tp = parseInt(pc * this.scroll.scrollMax);
            this.scroll.to(tp);
        }
        return this.drawTopBot();
    };

    Minimap.prototype.onScroll = function() {
        var t, x, y;
        y = parseInt(-this.height / 4 - this.scroll.offsetTop / 2);
        x = parseInt(this.width / 4);
        t = "translate3d(" + x + "px, " + y + "px, 0px) scale3d(0.5, 0.5, 1)";
        return this.lines.style.transform = t;
    };

    Minimap.prototype.clearRange = function(top, bot) {
        var ctx;
        ctx = this.lines.getContext('2d');
        return ctx.clearRect(0, (top - this.scroll.exposeTop) * this.scroll.lineHeight, 2 * this.width, (bot - top) * this.scroll.lineHeight);
    };

    Minimap.prototype.clearAll = function() {
        var ctx;
        ctx = this.lines.getContext('2d');
        ctx.clearRect(0, 0, this.lines.width, this.lines.height);
        this.topbot.width = this.topbot.width;
        this.lines.width = this.lines.width;
        return this.topbot.style.height = '0';
    };

    return Minimap;

})();

module.exports = Minimap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsd0ZBQUE7SUFBQTs7QUFRQSxNQUE4RCxPQUFBLENBQVEsS0FBUixDQUE5RCxFQUFFLGVBQUYsRUFBUSx1QkFBUixFQUFrQixpQkFBbEIsRUFBeUIsaUJBQXpCLEVBQWdDLGVBQWhDLEVBQXNDLGVBQXRDLEVBQTRDLGVBQTVDLEVBQWtELGVBQWxELEVBQXdEOztBQUV4RCxTQUFBLEdBQVksT0FBQSxDQUFRLGFBQVI7O0FBQ1osTUFBQSxHQUFZLE9BQUEsQ0FBUSxVQUFSOztBQUVOO0lBRVcsaUJBQUMsSUFBRDtBQUVULFlBQUE7UUFGVSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7UUFFVixZQUFBLEdBQWUsUUFBQSxDQUFTLFFBQUEsQ0FBUyxVQUFULEVBQXFCLE9BQXJCLENBQVQ7UUFFZixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLEtBQUQsR0FBVSxDQUFBLEdBQUU7UUFDWixJQUFDLENBQUEsTUFBRCxHQUFVO1FBQ1YsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUVkLElBQUMsQ0FBQSxJQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO1lBQWtCLEVBQUEsRUFBSSxTQUF0QjtTQUFMO1FBQ1gsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxLQUFELEdBQVcsSUFBQSxDQUFLLFFBQUwsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sY0FBUDtZQUF1QixLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQS9CO1lBQXNDLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBL0M7U0FBZjtRQUVYLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEs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TSxDQUFDLFNBQWIsQ0FBQSxHQUF3QixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQWpELEVBQTZELENBQUEsR0FBRSxJQUFDLENBQUEsS0FBaEUsRUFBdUUsQ0FBQyxHQUFBLEdBQUksR0FBTCxDQUFBLEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUF6RjtJQUhROztzQkFLWixRQUFBLEdBQVUsU0FBQTtBQUVOLFlBQUE7UUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFQLENBQWtCLElBQWxCO1FBQ04sR0FBRyxDQUFDLFNBQUosQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBM0IsRUFBa0MsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUF6QztRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixHQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDO1FBQ3pCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDO2VBQ3hCLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBdUI7SUFOakI7Ozs7OztBQVFkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiMjI1xuXG57IHBvc3QsIGdldFN0eWxlLCBlbXB0eSwgY2xhbXAsIGVsZW0sIGRyYWcsIGtzdHIsIGtsb2csICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuTWFwU2Nyb2xsID0gcmVxdWlyZSAnLi9tYXBzY3JvbGwnXG5jb2xvcnMgICAgPSByZXF1aXJlICcuL2NvbG9ycydcblxuY2xhc3MgTWluaW1hcFxuXG4gICAgY29uc3RydWN0b3I6IChAdGVybSkgLT5cblxuICAgICAgICBtaW5pbWFwV2lkdGggPSBwYXJzZUludCBnZXRTdHlsZSAnLm1pbmltYXAnLCAnd2lkdGgnXG5cbiAgICAgICAgQGNvbG9ycyA9IHt9XG4gICAgICAgIEB3aWR0aCAgPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJywgaWQ6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBsaW5lcyAgID0gZWxlbSAnY2FudmFzJywgY2xhc3M6ICdtaW5pbWFwTGluZXMnLCB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAdG9wYm90XG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lc1xuXG4gICAgICAgIG1haW4gPSQgJyNtYWluJ1xuICAgICAgICBtYWluLmFwcGVuZENoaWxkICBAZWxlbVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnY2xlYXJMaW5lcycsIEBvbkVkaXRvclNjcm9sbFxuICAgICAgICBwb3N0Lm9uICdzY3JvbGwnLCAgICAgQG9uRWRpdG9yU2Nyb2xsXG5cbiAgICAgICAgQHNjcm9sbCA9IG5ldyBNYXBTY3JvbGxcbiAgICAgICAgICAgIGV4cG9zZU1heDogIEBoZWlnaHQvNFxuICAgICAgICAgICAgbGluZUhlaWdodDogNFxuICAgICAgICAgICAgdmlld0hlaWdodDogMiptYWluLmNsaWVudEhlaWdodFxuXG4gICAgICAgIEBzY3JvbGwubmFtZSA9IFwibWluaW1hcFwiXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGVsZW1cbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvblN0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnXG4gICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJ1xuXG4gICAgICAgIEBzY3JvbGwub24gJ2NsZWFyTGluZXMnLCAgQGNsZWFyQWxsXG4gICAgICAgIEBzY3JvbGwub24gJ3Njcm9sbCcsICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJywgQG9uRXhwb3NlTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAndmFuaXNoTGluZXMnLCBAb25WYW5pc2hMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdleHBvc2VMaW5lJywgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcbiAgICBcbiAgICBkcmF3TGluZTogKGluZGV4KSAtPiBAZHJhd0xpbmVzIGluZGV4LCBpbmRleFxuICAgIGRyYXdMaW5lczogKHRvcD1Ac2Nyb2xsLmV4cG9zZVRvcCwgYm90PUBzY3JvbGwuZXhwb3NlQm90KSAtPlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgeSA9IHBhcnNlSW50ICh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBjdHguY2xlYXJSZWN0IDAsIHksIEB3aWR0aCwgKChib3QtQHNjcm9sbC5leHBvc2VUb3ApLSh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKzEpKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG5cbiAgICAgICAgcmV0dXJuIGlmIGJvdCA8IHRvcFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwibWluaW1hcC5kcmF3TGluZXMgI3t0b3B9ICN7Ym90fVwiXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHkgPSBwYXJzZUludCAobGktQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgbGluZSA9IEB0ZXJtLmJ1ZmZlckxpbmVzKCkuZ2V0IGxpXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLmxpbmUubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIDIqaSA+PSBAd2lkdGhcbiAgICAgICAgICAgICAgICBjaGFyRGF0YSA9IGxpbmUuZ2V0KGkpXG4gICAgICAgICAgICAgICAgZmdDb2xvciA9IGxpbmUuZ2V0RmcgaVxuICAgICAgICAgICAgICAgIGlmIGNoYXJEYXRhWzNdICE9IDAgYW5kIGNoYXJEYXRhWzNdICE9IDMyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIgPSBjaGFyRGF0YVswXVxuICAgICAgICAgICAgICAgICAgICAjIGZnICAgPSAoYXR0ciA+PiA5KSAmIDB4MWZmXG4gICAgICAgICAgICAgICAgICAgIGZnICAgPSBmZ0NvbG9yICYgMHgxZmZcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1tmZ11cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqaSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBcbiAgICBkcmF3VG9wQm90OiA9PlxuXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcblxuICAgICAgICBsaCA9IEBzY3JvbGwubGluZUhlaWdodC8yXG4gICAgICAgIHRoID0gKEB0ZXJtLnNjcm9sbC5ib3QtQHRlcm0uc2Nyb2xsLnRvcCsxKSpsaFxuICAgICAgICB0eSA9IDBcbiAgICAgICAgaWYgQHRlcm0uc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHkgPSAoTWF0aC5taW4oMC41KkBzY3JvbGwudmlld0hlaWdodCwgQHNjcm9sbC5udW1MaW5lcyoyKS10aCkgKiBAdGVybS5zY3JvbGwuc2Nyb2xsIC8gQHRlcm0uc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9IFwiI3t0aH1weFwiXG4gICAgICAgIEB0b3Bib3Quc3R5bGUudG9wICAgID0gXCIje3R5fXB4XCJcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGV4cG9zZUxpbmU6ICAgKGxpKSA9PiBAZHJhd0xpbmVzIGxpLCBsaVxuICAgIG9uRXhwb3NlTGluZXM6IChlKSA9PiBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgb25WYW5pc2hMaW5lczogKGUpID0+XG4gICAgICAgIGlmIGUudG9wP1xuICAgICAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNsZWFyUmFuZ2UgQHNjcm9sbC5leHBvc2VCb3QsIEBzY3JvbGwuZXhwb3NlQm90K0BzY3JvbGwubnVtTGluZXNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25DaGFuZ2VkOiAoY2hhbmdlSW5mbykgPT5cblxuICAgICAgICBAZHJhd1NlbGVjdGlvbnMoKSBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgQGRyYXdDdXJzb3JzKCkgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG5cbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAdGVybS5udW1MaW5lcygpXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIGxpID0gY2hhbmdlLm9sZEluZGV4XG4gICAgICAgICAgICBicmVhayBpZiBub3QgY2hhbmdlLmNoYW5nZSBpbiBbJ2RlbGV0ZWQnLCAnaW5zZXJ0ZWQnXVxuICAgICAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcblxuICAgICAgICBpZiBsaSA8PSBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICAgICAgQGRyYXdMaW5lcyBsaSwgQHNjcm9sbC5leHBvc2VCb3RcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHJ5ID0gZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICAgICAgcGMgPSAyKnJ5IC8gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBsaSA9IHBhcnNlSW50IHBjICogQHRlcm0uc2Nyb2xsLm51bUxpbmVzXG4gICAgICAgICAgICBAanVtcFRvTGluZSBsaSwgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIG9uU3RhcnQ6IChkcmFnLGV2ZW50KSA9PiBcbiAgICBcbiAgICAgICAgIyB3aW5kb3cudGVybS5zY3JvbGwud2hlZWwuYWNjdW0gPSAwXG4gICAgICAgIEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBqdW1wVG9MaW5lOiAobGksIGV2ZW50KSAtPlxuXG4gICAgICAgIEB0ZXJtLnNjcm9sbC50byAobGktNSkgKiBAdGVybS5zY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuXG4gICAgbGluZUluZGV4Rm9yRXZlbnQ6IChldmVudCkgLT5cblxuICAgICAgICBzdCA9IEBlbGVtLnNjcm9sbFRvcFxuICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGVsZW0ub2Zmc2V0SGVpZ2h0LCBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigyKmx5L0BzY3JvbGwubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgbGkgPSBwYXJzZUludCBNYXRoLm1pbihAc2Nyb2xsLm51bUxpbmVzLTEsIHB5KVxuICAgICAgICBsaVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uRWRpdG9yU2Nyb2xsOiAoc2Nyb2xsVmFsdWUsIGVkaXRvclNjcm9sbCkgPT5cblxuICAgICAgICBlZGl0b3JTY3JvbGwgPz0gQHRlcm0uc2Nyb2xsXG4gICAgICAgIFxuICAgICAgICBpZiBAc2Nyb2xsLnZpZXdIZWlnaHQgIT0gMiplZGl0b3JTY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IDIqZWRpdG9yU2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIEBvblNjcm9sbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbC5udW1MaW5lcyAhPSBlZGl0b3JTY3JvbGwubnVtTGluZXNcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgZWRpdG9yU2Nyb2xsLm51bUxpbmVzICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBwYyA9IGVkaXRvclNjcm9sbC5zY3JvbGwgLyBlZGl0b3JTY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0cCA9IHBhcnNlSW50IHBjICogQHNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIEBzY3JvbGwudG8gdHBcbiAgICAgICAgICAgIFxuICAgICAgICBAZHJhd1RvcEJvdCgpXG5cbiAgICBvblNjcm9sbDogPT5cblxuICAgICAgICB5ID0gcGFyc2VJbnQgLUBoZWlnaHQvNC1Ac2Nyb2xsLm9mZnNldFRvcC8yXG4gICAgICAgIHggPSBwYXJzZUludCBAd2lkdGgvNFxuICAgICAgICB0ID0gXCJ0cmFuc2xhdGUzZCgje3h9cHgsICN7eX1weCwgMHB4KSBzY2FsZTNkKDAuNSwgMC41LCAxKVwiXG5cbiAgICAgICAgQGxpbmVzLnN0eWxlLnRyYW5zZm9ybSA9IHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJSYW5nZTogKHRvcCwgYm90KSAtPlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCAodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQsIDIqQHdpZHRoLCAoYm90LXRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBjbGVhckFsbDogPT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgMCwgQGxpbmVzLndpZHRoLCBAbGluZXMuaGVpZ2h0XG4gICAgICAgIEB0b3Bib3Qud2lkdGggID0gQHRvcGJvdC53aWR0aFxuICAgICAgICBAbGluZXMud2lkdGggICA9IEBsaW5lcy53aWR0aFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9ICcwJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbmltYXBcbiJdfQ==
//# sourceURL=../coffee/minimap.coffee