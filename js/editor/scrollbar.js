// koffee 1.4.0

/*
 0000000   0000000  00000000    0000000   000      000      0000000     0000000   00000000
000       000       000   000  000   000  000      000      000   000  000   000  000   000
0000000   000       0000000    000   000  000      000      0000000    000000000  0000000
     000  000       000   000  000   000  000      000      000   000  000   000  000   000
0000000    0000000  000   000   0000000   0000000  0000000  0000000    000   000  000   000
 */
var Scrollbar, Scroller, clamp, drag, elem, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), stopEvent = ref.stopEvent, elem = ref.elem, clamp = ref.clamp, drag = ref.drag;

Scroller = require('../tools/scroller');

Scrollbar = (function() {
    function Scrollbar(editor) {
        this.editor = editor;
        this.update = bind(this.update, this);
        this.wheelScroll = bind(this.wheelScroll, this);
        this.onWheel = bind(this.onWheel, this);
        this.onDrag = bind(this.onDrag, this);
        this.onStart = bind(this.onStart, this);
        this.editor.scroll.on('scroll', this.update);
        this.editor.on('linesShown', this.update);
        this.editor.on('viewHeight', this.update);
        this.elem = elem({
            "class": 'scrollbar left'
        });
        this.editor.view.appendChild(this.elem);
        this.handle = elem({
            "class": 'scrollhandle left'
        });
        this.elem.appendChild(this.handle);
        this.scrollX = 0;
        this.scrollY = 0;
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'ns-resize'
        });
        this.elem.addEventListener('wheel', this.onWheel);
        this.editor.view.addEventListener('wheel', this.onWheel);
    }

    Scrollbar.prototype.del = function() {
        this.elem.removeEventListener('wheel', this.onWheel);
        return this.editor.view.removeEventListener('wheel', this.onWheel);
    };

    Scrollbar.prototype.onStart = function(drag, event) {
        var br, ln, ly, sy;
        br = this.elem.getBoundingClientRect();
        sy = clamp(0, this.editor.scroll.viewHeight, event.clientY - br.top);
        ln = parseInt(this.editor.scroll.numLines * sy / this.editor.scroll.viewHeight);
        ly = (ln - this.editor.scroll.viewLines / 2) * this.editor.scroll.lineHeight;
        return this.editor.scroll.to(ly);
    };

    Scrollbar.prototype.onDrag = function(drag) {
        var delta;
        delta = (drag.delta.y / (this.editor.scroll.viewLines * this.editor.scroll.lineHeight)) * this.editor.scroll.fullHeight;
        return this.editor.scroll.by(delta);
    };

    Scrollbar.prototype.onWheel = function(event) {
        var scrollFactor;
        scrollFactor = function() {
            var f;
            f = 1;
            f *= 1 + 1 * event.shiftKey;
            f *= 1 + 3 * event.metaKey;
            return f *= 1 + 7 * event.altKey;
        };
        if (Math.abs(event.deltaX) >= 2 * Math.abs(event.deltaY) || Math.abs(event.deltaY) === 0) {
            this.scrollX += event.deltaX;
        } else {
            this.scrollY += event.deltaY * scrollFactor();
        }
        if (this.scrollX || this.scrollY) {
            window.requestAnimationFrame(this.wheelScroll);
        }
        return stopEvent(event);
    };

    Scrollbar.prototype.wheelScroll = function() {
        this.editor.scroll.by(this.scrollY, this.scrollX);
        return this.scrollX = this.scrollY = 0;
    };

    Scrollbar.prototype.update = function() {
        var bh, cf, cs, longColor, scrollHeight, scrollTop, shortColor, vh;
        if (this.editor.numLines() * this.editor.size.lineHeight < this.editor.viewHeight()) {
            this.handle.style.top = "0";
            this.handle.style.height = "0";
            return this.handle.style.width = "0";
        } else {
            bh = this.editor.numLines() * this.editor.size.lineHeight;
            vh = Math.min(this.editor.scroll.viewLines * this.editor.scroll.lineHeight, this.editor.viewHeight());
            scrollTop = parseInt((this.editor.scroll.scroll / bh) * vh);
            scrollHeight = parseInt(((this.editor.scroll.viewLines * this.editor.scroll.lineHeight) / bh) * vh);
            scrollHeight = Math.max(scrollHeight, parseInt(this.editor.size.lineHeight / 4));
            scrollTop = Math.min(scrollTop, this.editor.viewHeight() - scrollHeight);
            scrollTop = Math.max(0, scrollTop);
            this.handle.style.top = scrollTop + "px";
            this.handle.style.height = scrollHeight + "px";
            this.handle.style.width = "2px";
            cf = 1 - clamp(0, 1, (scrollHeight - 10) / 200);
            longColor = Scroller.colorForClass('scroller long');
            shortColor = Scroller.colorForClass('scroller short');
            cs = Scroller.fadeColor(longColor, shortColor, cf);
            return this.handle.style.backgroundColor = cs;
        }
    };

    return Scrollbar;

})();

module.exports = Scrollbar;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxzREFBQTtJQUFBOztBQVFBLE1BQW1DLE9BQUEsQ0FBUSxLQUFSLENBQW5DLEVBQUUseUJBQUYsRUFBYSxlQUFiLEVBQW1CLGlCQUFuQixFQUEwQjs7QUFFMUIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFFTDtJQUVDLG1CQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7O1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBZixDQUFrQixRQUFsQixFQUEyQixJQUFDLENBQUEsTUFBNUI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTJCLElBQUMsQ0FBQSxNQUE1QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBMkIsSUFBQyxDQUFBLE1BQTVCO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdCQUFQO1NBQUw7UUFDUixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFiLENBQXlCLElBQUMsQ0FBQSxJQUExQjtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQkFBUDtTQUFMO1FBQ1YsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxNQUFuQjtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZO1FBRVosSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLElBQUosQ0FDSjtZQUFBLE1BQUEsRUFBUyxJQUFDLENBQUEsSUFBVjtZQUNBLE9BQUEsRUFBUyxJQUFDLENBQUEsT0FEVjtZQUVBLE1BQUEsRUFBUyxJQUFD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RTtZQUNmLFlBQUEsR0FBZSxJQUFJLENBQUMsR0FBTCxDQUFTLFlBQVQsRUFBdUIsUUFBQSxDQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQWIsR0FBd0IsQ0FBakMsQ0FBdkI7WUFDZixTQUFBLEdBQWUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW9CLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQUEsR0FBcUIsWUFBekM7WUFDZixTQUFBLEdBQWUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksU0FBWjtZQUVmLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWQsR0FBMEIsU0FBRCxHQUFXO1lBQ3BDLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBMEIsWUFBRCxHQUFjO1lBQ3ZDLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQWQsR0FBdUI7WUFFdkIsRUFBQSxHQUFLLENBQUEsR0FBSSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQVQsRUFBWSxDQUFDLFlBQUEsR0FBYSxFQUFkLENBQUEsR0FBa0IsR0FBOUI7WUFFVCxTQUFBLEdBQWEsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsZUFBdkI7WUFDYixVQUFBLEdBQWEsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsZ0JBQXZCO1lBRWIsRUFBQSxHQUFLLFFBQVEsQ0FBQyxTQUFULENBQW1CLFNBQW5CLEVBQThCLFVBQTlCLEVBQTBDLEVBQTFDO21CQUNMLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWQsR0FBZ0MsR0ExQnBDOztJQUZJOzs7Ozs7QUE4QlosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwgZWxlbSwgY2xhbXAsIGRyYWcgfSA9IHJlcXVpcmUgJ2t4aydcblxuU2Nyb2xsZXIgPSByZXF1aXJlICcuLi90b29scy9zY3JvbGxlcidcblxuY2xhc3MgU2Nyb2xsYmFyXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAZWRpdG9yLnNjcm9sbC5vbiAnc2Nyb2xsJyBAdXBkYXRlXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nICAgIEB1cGRhdGVcbiAgICAgICAgQGVkaXRvci5vbiAndmlld0hlaWdodCcgICAgQHVwZGF0ZVxuXG4gICAgICAgIEBlbGVtID0gZWxlbSBjbGFzczogJ3Njcm9sbGJhciBsZWZ0J1xuICAgICAgICBAZWRpdG9yLnZpZXcuYXBwZW5kQ2hpbGQgQGVsZW1cblxuICAgICAgICBAaGFuZGxlID0gZWxlbSBjbGFzczogJ3Njcm9sbGhhbmRsZSBsZWZ0J1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAaGFuZGxlXG5cbiAgICAgICAgQHNjcm9sbFggID0gMFxuICAgICAgICBAc2Nyb2xsWSAgPSAwXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGVsZW1cbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvblN0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnXG4gICAgICAgICAgICBjdXJzb3I6ICAnbnMtcmVzaXplJ1xuXG4gICAgICAgIEBlbGVtICAgICAgIC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgQG9uV2hlZWxcbiAgICAgICAgQGVkaXRvci52aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAb25XaGVlbFxuXG4gICAgZGVsOiAtPlxuICAgICAgICBcbiAgICAgICAgQGVsZW0gICAgICAgLnJlbW92ZUV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAb25XaGVlbFxuICAgICAgICBAZWRpdG9yLnZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnd2hlZWwnIEBvbldoZWVsXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIHN5ID0gY2xhbXAgMCwgQGVkaXRvci5zY3JvbGwudmlld0hlaWdodCwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBsbiA9IHBhcnNlSW50IEBlZGl0b3Iuc2Nyb2xsLm51bUxpbmVzICogc3kvQGVkaXRvci5zY3JvbGwudmlld0hlaWdodFxuICAgICAgICBseSA9IChsbiAtIEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcyAvIDIpICogQGVkaXRvci5zY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAZWRpdG9yLnNjcm9sbC50byBseVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRHJhZzogKGRyYWcpID0+XG5cbiAgICAgICAgZGVsdGEgPSAoZHJhZy5kZWx0YS55IC8gKEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcyAqIEBlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHQpKSAqIEBlZGl0b3Iuc2Nyb2xsLmZ1bGxIZWlnaHRcbiAgICAgICAgQGVkaXRvci5zY3JvbGwuYnkgZGVsdGFcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG5cbiAgICAgICAgc2Nyb2xsRmFjdG9yID0gLT5cbiAgICAgICAgICAgIGYgID0gMVxuICAgICAgICAgICAgZiAqPSAxICsgMSAqIGV2ZW50LnNoaWZ0S2V5XG4gICAgICAgICAgICBmICo9IDEgKyAzICogZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgZiAqPSAxICsgNyAqIGV2ZW50LmFsdEtleVxuXG4gICAgICAgIGlmIE1hdGguYWJzKGV2ZW50LmRlbHRhWCkgPj0gMipNYXRoLmFicyhldmVudC5kZWx0YVkpIG9yIE1hdGguYWJzKGV2ZW50LmRlbHRhWSkgPT0gMFxuICAgICAgICAgICAgQHNjcm9sbFggKz0gZXZlbnQuZGVsdGFYXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzY3JvbGxZICs9IGV2ZW50LmRlbHRhWSAqIHNjcm9sbEZhY3RvcigpXG5cbiAgICAgICAgaWYgQHNjcm9sbFggb3IgQHNjcm9sbFlcbiAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQHdoZWVsU2Nyb2xsXG5cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICB3aGVlbFNjcm9sbDogPT5cblxuICAgICAgICBAZWRpdG9yLnNjcm9sbC5ieSBAc2Nyb2xsWSwgQHNjcm9sbFhcbiAgICAgICAgQHNjcm9sbFggPSBAc2Nyb2xsWSA9IDBcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGU6ID0+XG5cbiAgICAgICAgaWYgQGVkaXRvci5udW1MaW5lcygpICogQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgPCBAZWRpdG9yLnZpZXdIZWlnaHQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLnRvcCAgICAgPSBcIjBcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgID0gXCIwXCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUud2lkdGggICA9IFwiMFwiXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBiaCAgICAgICAgICAgPSBAZWRpdG9yLm51bUxpbmVzKCkgKiBAZWRpdG9yLnNpemUubGluZUhlaWdodFxuICAgICAgICAgICAgdmggICAgICAgICAgID0gTWF0aC5taW4gKEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcyAqIEBlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHQpLCBAZWRpdG9yLnZpZXdIZWlnaHQoKVxuICAgICAgICAgICAgc2Nyb2xsVG9wICAgID0gcGFyc2VJbnQgKEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIGJoKSAqIHZoXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSBwYXJzZUludCAoKEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcyAqIEBlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHQpIC8gYmgpICogdmhcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4IHNjcm9sbEhlaWdodCwgcGFyc2VJbnQgQGVkaXRvci5zaXplLmxpbmVIZWlnaHQvNFxuICAgICAgICAgICAgc2Nyb2xsVG9wICAgID0gTWF0aC5taW4gc2Nyb2xsVG9wLCBAZWRpdG9yLnZpZXdIZWlnaHQoKS1zY3JvbGxIZWlnaHRcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IE1hdGgubWF4IDAsIHNjcm9sbFRvcFxuXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLnRvcCAgICA9IFwiI3tzY3JvbGxUb3B9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgPSBcIiN7c2Nyb2xsSGVpZ2h0fXB4XCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUud2lkdGggID0gXCIycHhcIlxuXG4gICAgICAgICAgICBjZiA9IDEgLSBjbGFtcCAwLCAxLCAoc2Nyb2xsSGVpZ2h0LTEwKS8yMDBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9uZ0NvbG9yICA9IFNjcm9sbGVyLmNvbG9yRm9yQ2xhc3MgJ3Njcm9sbGVyIGxvbmcnXG4gICAgICAgICAgICBzaG9ydENvbG9yID0gU2Nyb2xsZXIuY29sb3JGb3JDbGFzcyAnc2Nyb2xsZXIgc2hvcnQnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNzID0gU2Nyb2xsZXIuZmFkZUNvbG9yIGxvbmdDb2xvciwgc2hvcnRDb2xvciwgY2ZcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gY3NcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JvbGxiYXJcbiJdfQ==
//# sourceURL=../../coffee/editor/scrollbar.coffee