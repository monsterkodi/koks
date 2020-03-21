// koffee 1.12.0

/*
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
 */
var Syntax, _, chroma, elem, empty, kerror, klor, kstr, last, matchr, ref;

ref = require('kxk'), matchr = ref.matchr, empty = ref.empty, kstr = ref.kstr, klor = ref.klor, elem = ref.elem, last = ref.last, kerror = ref.kerror, _ = ref._;

chroma = require('chroma-js');

Syntax = (function() {
    function Syntax(name, getLine, getAnsi) {
        this.name = name;
        this.getLine = getLine;
        this.getAnsi = getAnsi;
        this.diss = [];
        this.colors = {};
        this.ansi = new kstr.ansi;
    }

    Syntax.prototype.newDiss = function(li) {
        var ansi, diss, text;
        text = this.getLine(li);
        if (text == null) {
            return kerror("dissForLine -- no line at index " + li + "?");
        }
        if (empty(text)) {
            return [
                {
                    start: 0,
                    length: 0,
                    match: ''
                }
            ];
        }
        if (ansi = this.getAnsi(li)) {
            diss = this.ansi.dissect(ansi)[1];
        } else {
            diss = klor.dissect([text], 'sh')[0];
        }
        return diss;
    };

    Syntax.prototype.getDiss = function(li) {
        if (this.diss[li] == null) {
            this.diss[li] = this.newDiss(li);
        }
        return this.diss[li];
    };

    Syntax.prototype.setDiss = function(li, dss) {
        this.diss[li] = dss;
        return dss;
    };

    Syntax.prototype.fillDiss = function(bot) {
        var i, li, ref1, results;
        results = [];
        for (li = i = 0, ref1 = bot; 0 <= ref1 ? i <= ref1 : i >= ref1; li = 0 <= ref1 ? ++i : --i) {
            results.push(this.getDiss(li));
        }
        return results;
    };

    Syntax.prototype.setLines = function(lines) {};

    Syntax.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2, results;
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
                    results.push(this.diss[di] = this.newDiss(di));
                    break;
                case 'deleted':
                    results.push(this.diss.splice(di, 1));
                    break;
                case 'inserted':
                    results.push(this.diss.splice(di, 0, this.newDiss(di)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    Syntax.prototype.setFileType = function(name) {
        this.name = name;
    };

    Syntax.prototype.clear = function() {
        return this.diss = [];
    };

    Syntax.prototype.colorForClassnames = function(clss) {
        var color, computedStyle, div, opacity;
        if (this.colors[clss] == null) {
            div = elem({
                "class": clss
            });
            document.body.appendChild(div);
            computedStyle = window.getComputedStyle(div);
            color = computedStyle.color;
            opacity = computedStyle.opacity;
            if (opacity !== '1') {
                color = 'rgba(' + color.slice(4, color.length - 2) + ', ' + opacity + ')';
            }
            this.colors[clss] = color;
            div.remove();
        }
        return this.colors[clss];
    };

    Syntax.prototype.colorForStyle = function(styl) {
        var bgcol, div;
        if (this.colors[styl] == null) {
            div = elem('div');
            div.style = styl;
            document.body.appendChild(div);
            bgcol = kstr(window.getComputedStyle(div).backgroundColor);
            if (styl.startsWith('back')) {
                this.colors[styl] = bgcol;
            } else {
                this.colors[styl] = kstr(window.getComputedStyle(div).color);
                if (bgcol !== 'rgba(0, 0, 0, 0)') {
                    this.colors[styl] = chroma.mix(bgcol, this.colors[styl], 0.5, 'hsl').css();
                }
            }
            div.remove();
        }
        return this.colors[styl];
    };

    Syntax.prototype.schemeChanged = function() {
        return this.colors = {};
    };


    /*
     0000000  000000000   0000000   000000000  000   0000000
    000          000     000   000     000     000  000
    0000000      000     000000000     000     000  000
         000     000     000   000     000     000  000
    0000000      000     000   000     000     000   0000000
     */

    Syntax.matchrConfigs = {};

    Syntax.syntaxNames = [];

    Syntax.spanForTextAndSyntax = function(text, n) {
        var clrzd, clss, d, di, diss, i, j, l, ref1, ref2, ref3, sp, spc, style;
        l = "";
        diss = this.dissForTextAndSyntax(text, n);
        if (diss != null ? diss.length : void 0) {
            last = 0;
            for (di = i = 0, ref1 = diss.length; 0 <= ref1 ? i < ref1 : i > ref1; di = 0 <= ref1 ? ++i : --i) {
                d = diss[di];
                style = (d.styl != null) && d.styl.length && (" style=\"" + d.styl + "\"") || '';
                spc = '';
                for (sp = j = ref2 = last, ref3 = d.start; ref2 <= ref3 ? j < ref3 : j > ref3; sp = ref2 <= ref3 ? ++j : --j) {
                    spc += '&nbsp;';
                }
                last = d.start + d.match.length;
                clss = (d.clss != null) && d.clss.length && (" class=\"" + d.clss + "\"") || '';
                clrzd = "<span" + style + clss + ">" + spc + (kstr.encode(d.match)) + "</span>";
                l += clrzd;
            }
        }
        return l;
    };

    Syntax.rangesForTextAndSyntax = function(line, n) {
        return matchr.ranges(Syntax.matchrConfigs[n], line);
    };

    Syntax.dissForTextAndSyntax = function(text, n) {
        return klor.ranges(text, n);
    };

    Syntax.lineForDiss = function(dss) {
        var d, i, l, len;
        l = "";
        for (i = 0, len = dss.length; i < len; i++) {
            d = dss[i];
            l = _.padEnd(l, d.start);
            l += d.match;
        }
        return l;
    };

    Syntax.init = function() {
        return this.syntaxNames = this.syntaxNames.concat(klor.exts);
    };

    return Syntax;

})();

Syntax.init();

module.exports = Syntax;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbInN5bnRheC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBdUQsT0FBQSxDQUFRLEtBQVIsQ0FBdkQsRUFBRSxtQkFBRixFQUFVLGlCQUFWLEVBQWlCLGVBQWpCLEVBQXVCLGVBQXZCLEVBQTZCLGVBQTdCLEVBQW1DLGVBQW5DLEVBQXlDLG1CQUF6QyxFQUFpRDs7QUFFakQsTUFBQSxHQUFTLE9BQUEsQ0FBUSxXQUFSOztBQUVIO0lBRUMsZ0JBQUMsSUFBRCxFQUFRLE9BQVIsRUFBa0IsT0FBbEI7UUFBQyxJQUFDLENBQUEsT0FBRDtRQUFPLElBQUMsQ0FBQSxVQUFEO1FBQVUsSUFBQyxDQUFBLFVBQUQ7UUFFakIsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsSUFBRCxHQUFVLElBQUksSUFBSSxDQUFDO0lBSnBCOztxQkFZSCxPQUFBLEdBQVMsU0FBQyxFQUFEO0FBRUwsWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQ7UUFFUCxJQUFPLFlBQVA7QUFDSSxtQkFBTyxNQUFBLENBQU8sa0NBQUEsR0FBbUMsRUFBbkMsR0FBc0MsR0FBN0MsRUFEWDs7UUFHQSxJQUFzQyxLQUFBLENBQU0sSUFBTixDQUF0QztBQUFBLG1CQUFPO2dCQUFDO29CQUFBLEtBQUEsRUFBTSxDQUFOO29CQUFRLE1BQUEsRUFBTyxDQUFmO29CQUFpQixLQUFBLEVBQU0sRUFBdkI7aUJBQUQ7Y0FBUDs7UUFFQSxJQUFHLElBQUEsR0FBTyxJQUFDLENBQUEsT0FBRCxDQUFTLEVBQVQsQ0FBVjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQW9CLENBQUEsQ0FBQSxFQUQvQjtTQUFBLE1B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Ozs7OztBQTJCWCxNQUFNLENBQUMsSUFBUCxDQUFBOztBQUNBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAgICAgICAgMDAwIDAwMCAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAgMDAwXG4wMDAwMDAwICAgICAwMDAwMCAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgIDAwMDAwXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwIDAwMFxuMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBtYXRjaHIsIGVtcHR5LCBrc3RyLCBrbG9yLCBlbGVtLCBsYXN0LCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2hyb21hID0gcmVxdWlyZSAnY2hyb21hLWpzJ1xuXG5jbGFzcyBTeW50YXhcbiAgICBcbiAgICBAOiAoQG5hbWUsIEBnZXRMaW5lLCBAZ2V0QW5zaSkgLT5cblxuICAgICAgICBAZGlzcyAgID0gW11cbiAgICAgICAgQGNvbG9ycyA9IHt9XG4gICAgICAgIEBhbnNpICAgPSBuZXcga3N0ci5hbnNpXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgbmV3RGlzczogKGxpKSAtPlxuXG4gICAgICAgIHRleHQgPSBAZ2V0TGluZSBsaVxuXG4gICAgICAgIGlmIG5vdCB0ZXh0P1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImRpc3NGb3JMaW5lIC0tIG5vIGxpbmUgYXQgaW5kZXggI3tsaX0/XCJcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gW3N0YXJ0OjAgbGVuZ3RoOjAgbWF0Y2g6JyddIGlmIGVtcHR5IHRleHRcblxuICAgICAgICBpZiBhbnNpID0gQGdldEFuc2kgbGlcbiAgICAgICAgICAgIGRpc3MgPSBAYW5zaS5kaXNzZWN0KGFuc2kpWzFdXG4gICAgICAgICAgICAjIGtsb2cgJ25ld0Rpc3MnIGxpLCBkaXNzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRpc3MgPSBrbG9yLmRpc3NlY3QoW3RleHRdLCAnc2gnKVswXVxuICAgICAgICAgICAgXG4gICAgICAgIGRpc3NcblxuICAgIGdldERpc3M6IChsaSkgLT5cblxuICAgICAgICBpZiBub3QgQGRpc3NbbGldP1xuICAgICAgICAgICAgQGRpc3NbbGldID0gQG5ld0Rpc3MgbGlcblxuICAgICAgICAjIGtsb2cgXCIje2xpfVwiIEBkaXNzW2xpXVxuICAgICAgICAgICAgXG4gICAgICAgIEBkaXNzW2xpXVxuXG4gICAgc2V0RGlzczogKGxpLCBkc3MpIC0+XG5cbiAgICAgICAgQGRpc3NbbGldID0gZHNzXG4gICAgICAgIGRzc1xuXG4gICAgZmlsbERpc3M6IChib3QpIC0+XG5cbiAgICAgICAgZm9yIGxpIGluIFswLi5ib3RdXG4gICAgICAgICAgICBAZ2V0RGlzcyBsaVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG5cbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cblxuICAgICAgICAgICAgc3dpdGNoIGNoXG5cbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuXG4gICAgICAgICAgICAgICAgICAgIEBkaXNzW2RpXSA9IEBuZXdEaXNzIGRpXG5cbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJ1xuXG4gICAgICAgICAgICAgICAgICAgIEBkaXNzLnNwbGljZSBkaSwgMVxuXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG5cbiAgICAgICAgICAgICAgICAgICAgQGRpc3Muc3BsaWNlIGRpLCAwLCBAbmV3RGlzcyBkaVxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldEZpbGVUeXBlOiAoQG5hbWUpIC0+XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXNzID0gW11cblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBjb2xvckZvckNsYXNzbmFtZXM6IChjbHNzKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAY29sb3JzW2Nsc3NdP1xuXG4gICAgICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNzXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIGRpdlxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRpdlxuICAgICAgICAgICAgY29sb3IgPSBjb21wdXRlZFN0eWxlLmNvbG9yXG4gICAgICAgICAgICBvcGFjaXR5ID0gY29tcHV0ZWRTdHlsZS5vcGFjaXR5XG4gICAgICAgICAgICBpZiBvcGFjaXR5ICE9ICcxJ1xuICAgICAgICAgICAgICAgIGNvbG9yID0gJ3JnYmEoJyArIGNvbG9yLnNsaWNlKDQsIGNvbG9yLmxlbmd0aC0yKSArICcsICcgKyBvcGFjaXR5ICsgJyknXG4gICAgICAgICAgICBAY29sb3JzW2Nsc3NdID0gY29sb3JcbiAgICAgICAgICAgIGRpdi5yZW1vdmUoKVxuXG4gICAgICAgIHJldHVybiBAY29sb3JzW2Nsc3NdXG5cbiAgICBjb2xvckZvclN0eWxlOiAoc3R5bCkgLT5cblxuICAgICAgICBpZiBub3QgQGNvbG9yc1tzdHlsXT9cbiAgICAgICAgICAgIGRpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIGRpdi5zdHlsZSA9IHN0eWxcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgICAgICBiZ2NvbCA9IGtzdHIgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZGl2KS5iYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgICAgIGlmIHN0eWwuc3RhcnRzV2l0aCAnYmFjaycgXG4gICAgICAgICAgICAgICAgQGNvbG9yc1tzdHlsXSA9IGJnY29sXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbG9yc1tzdHlsXSA9IGtzdHIgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZGl2KS5jb2xvclxuICAgICAgICAgICAgICAgIGlmIGJnY29sICE9ICdyZ2JhKDAsIDAsIDAsIDApJ1xuICAgICAgICAgICAgICAgICAgICBAY29sb3JzW3N0eWxdID0gY2hyb21hLm1peChiZ2NvbCwgQGNvbG9yc1tzdHlsXSwgMC41LCAnaHNsJykuY3NzKClcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nICdjb2xvcicgQGNvbG9yc1tzdHlsXVxuICAgICAgICAgICAgZGl2LnJlbW92ZSgpXG5cbiAgICAgICAgcmV0dXJuIEBjb2xvcnNbc3R5bF1cblxuICAgIHNjaGVtZUNoYW5nZWQ6IC0+IEBjb2xvcnMgPSB7fVxuXG4gICAgIyMjXG4gICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDBcbiAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMFxuICAgICMjI1xuXG4gICAgQG1hdGNockNvbmZpZ3MgPSB7fVxuICAgIEBzeW50YXhOYW1lcyA9IFtdXG5cbiAgICBAc3BhbkZvclRleHRBbmRTeW50YXg6ICh0ZXh0LCBuKSAtPlxuXG4gICAgICAgIGwgPSBcIlwiXG4gICAgICAgIGRpc3MgPSBAZGlzc0ZvclRleHRBbmRTeW50YXggdGV4dCwgblxuICAgICAgICBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgICAgIGxhc3QgPSAwXG4gICAgICAgICAgICBmb3IgZGkgaW4gWzAuLi5kaXNzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBkID0gZGlzc1tkaV1cbiAgICAgICAgICAgICAgICBzdHlsZSA9IGQuc3R5bD8gYW5kIGQuc3R5bC5sZW5ndGggYW5kIFwiIHN0eWxlPVxcXCIje2Quc3R5bH1cXFwiXCIgb3IgJydcbiAgICAgICAgICAgICAgICBzcGMgPSAnJ1xuICAgICAgICAgICAgICAgIGZvciBzcCBpbiBbbGFzdC4uLmQuc3RhcnRdXG4gICAgICAgICAgICAgICAgICAgIHNwYyArPSAnJm5ic3A7J1xuICAgICAgICAgICAgICAgIGxhc3QgID0gZC5zdGFydCArIGQubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgY2xzcyA9IGQuY2xzcz8gYW5kIGQuY2xzcy5sZW5ndGggYW5kIFwiIGNsYXNzPVxcXCIje2QuY2xzc31cXFwiXCIgb3IgJydcbiAgICAgICAgICAgICAgICBjbHJ6ZCA9IFwiPHNwYW4je3N0eWxlfSN7Y2xzc30+I3tzcGN9I3trc3RyLmVuY29kZSBkLm1hdGNofTwvc3Bhbj5cIlxuICAgICAgICAgICAgICAgIGwgKz0gY2xyemRcbiAgICAgICAgbFxuXG4gICAgQHJhbmdlc0ZvclRleHRBbmRTeW50YXg6IChsaW5lLCBuKSAtPlxuXG4gICAgICAgIG1hdGNoci5yYW5nZXMgU3ludGF4Lm1hdGNockNvbmZpZ3Nbbl0sIGxpbmVcblxuICAgIEBkaXNzRm9yVGV4dEFuZFN5bnRheDogKHRleHQsIG4pIC0+XG5cbiAgICAgICAga2xvci5yYW5nZXMgdGV4dCwgblxuXG4gICAgQGxpbmVGb3JEaXNzOiAoZHNzKSAtPlxuXG4gICAgICAgIGwgPSBcIlwiXG4gICAgICAgIGZvciBkIGluIGRzc1xuICAgICAgICAgICAgbCA9IF8ucGFkRW5kIGwsIGQuc3RhcnRcbiAgICAgICAgICAgIGwgKz0gZC5tYXRjaFxuICAgICAgICBsXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG5cbiAgICBAaW5pdDogLT5cblxuICAgICAgICAjIHN5bnRheERpciA9IFwiI3tfX2Rpcm5hbWV9Ly4uLy4uL3N5bnRheC9cIlxuXG4gICAgICAgICMgZm9yIHN5bnRheEZpbGUgaW4gZnMucmVhZGRpclN5bmMgc3ludGF4RGlyXG5cbiAgICAgICAgICAgICMgc3ludGF4TmFtZSA9IHNsYXNoLmJhc2VuYW1lIHN5bnRheEZpbGUsICcubm9vbidcbiAgICAgICAgICAgICMgcGF0dGVybnMgPSBub29uLmxvYWQgc2xhc2guam9pbiBzeW50YXhEaXIsIHN5bnRheEZpbGVcblxuICAgICAgICAgICAgIyBwYXR0ZXJuc1snXFxcXHcrJ10gICAgICAgPSAndGV4dCcgICAjIHRoaXMgZW5zdXJlcyB0aGF0IGFsbCAuLi5cbiAgICAgICAgICAgICMgcGF0dGVybnNbJ1teXFxcXHdcXFxcc10rJ10gPSAnc3ludGF4JyAjIG5vbi1zcGFjZSBjaGFyYWN0ZXJzIG1hdGNoXG5cbiAgICAgICAgICAgICMgaWYgcGF0dGVybnMua28/LmV4dG5hbWVzP1xuICAgICAgICAgICAgICAgICMgZXh0bmFtZXMgPSBwYXR0ZXJucy5rby5leHRuYW1lc1xuICAgICAgICAgICAgICAgICMgZGVsZXRlIHBhdHRlcm5zLmtvXG5cbiAgICAgICAgICAgICAgICAjIGNvbmZpZyA9IG1hdGNoci5jb25maWcgcGF0dGVybnNcbiAgICAgICAgICAgICAgICAjIGZvciBzeW50YXhOYW1lIGluIGV4dG5hbWVzXG4gICAgICAgICAgICAgICAgICAgICMgQHN5bnRheE5hbWVzLnB1c2ggc3ludGF4TmFtZVxuICAgICAgICAgICAgICAgICAgICAjIEBtYXRjaHJDb25maWdzW3N5bnRheE5hbWVdID0gY29uZmlnXG4gICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAjIEBzeW50YXhOYW1lcy5wdXNoIHN5bnRheE5hbWVcbiAgICAgICAgICAgICAgICAjIEBtYXRjaHJDb25maWdzW3N5bnRheE5hbWVdID0gbWF0Y2hyLmNvbmZpZyBwYXR0ZXJuc1xuXG4gICAgICAgICMga2xvci5pbml0KClcbiAgICAgICAgQHN5bnRheE5hbWVzID0gQHN5bnRheE5hbWVzLmNvbmNhdCBrbG9yLmV4dHNcblxuU3ludGF4LmluaXQoKVxubW9kdWxlLmV4cG9ydHMgPSBTeW50YXhcbiJdfQ==
//# sourceURL=../../coffee/editor/syntax.coffee