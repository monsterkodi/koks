// koffee 1.4.0
var _, kerror, post, ref,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, kerror = ref.kerror, _ = ref._;

module.exports = {
    actions: {
        menu: 'Select',
        selectAll: {
            name: 'Select All',
            combo: 'command+a',
            accel: 'alt+a'
        },
        selectNone: {
            name: 'Deselect',
            combo: 'command+shift+a',
            accel: 'ctrl+shift+a'
        },
        selectInverted: {
            name: 'Invert Selection',
            text: 'selects all lines that have no cursors and no selections',
            combo: 'command+shift+i',
            accel: 'ctrl+shift+i'
        },
        selectNextHighlight: {
            separator: true,
            name: 'Select Next Highlight',
            combo: 'command+g',
            accel: 'ctrl+g'
        },
        selectPrevHighlight: {
            name: 'Select Previous Highlight',
            combo: 'command+shift+g',
            accel: 'ctrl+shift+g'
        },
        selectTextBetweenCursorsOrSurround: {
            name: 'Select Between Cursors, Brackets or Quotes',
            text: "select text between even cursors, if at least two cursors exist. \nselect text between highlighted brackets or quotes otherwise.",
            combo: 'command+alt+b',
            accel: 'alt+ctrl+b'
        },
        toggleStickySelection: {
            separator: true,
            name: 'Toggle Sticky Selection',
            text: 'current selection is not removed when adding new selections',
            combo: 'command+`',
            accel: "ctrl+'"
        }
    },
    selectSingleRange: function(r, opt) {
        var cursorX;
        if (r == null) {
            return kerror("Editor." + name + ".selectSingleRange -- undefined range!");
        }
        cursorX = (opt != null ? opt.before : void 0) ? r[1][0] : r[1][1];
        this["do"].start();
        this["do"].setCursors([[cursorX, r[0]]]);
        this["do"].select([r]);
        this["do"].end();
        return this;
    },
    toggleStickySelection: function() {
        if (this.stickySelection) {
            return this.endStickySelection();
        } else {
            return this.startStickySelection();
        }
    },
    startStickySelection: function() {
        this.stickySelection = true;
        post.emit('sticky', true);
        return this.emit('selection');
    },
    endStickySelection: function() {
        this.stickySelection = false;
        post.emit('sticky', false);
        return this.emit('selection');
    },
    startSelection: function(opt) {
        var c, j, len, ref1, sel;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                this["do"].select([]);
            }
            return;
        }
        if (!this.startSelectionCursors || this.numCursors() !== this.startSelectionCursors.length) {
            this.startSelectionCursors = this["do"].cursors();
            if (this.numSelections()) {
                ref1 = this.startSelectionCursors;
                for (j = 0, len = ref1.length; j < len; j++) {
                    c = ref1[j];
                    if (sel = this.continuousSelectionAtPosInRanges(c, this["do"].selections())) {
                        if (isSamePos(sel[1], c)) {
                            c[0] = sel[0][0];
                            c[1] = sel[0][1];
                        }
                    }
                }
            }
            if (!this.stickySelection) {
                return this["do"].select(rangesFromPositions(this.startSelectionCursors));
            }
        }
    },
    endSelection: function(opt) {
        var ci, j, nc, newCursors, newSelection, oc, oldCursors, ranges, ref1, ref2;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                return this["do"].select([]);
            }
        } else {
            oldCursors = (ref1 = this.startSelectionCursors) != null ? ref1 : this["do"].cursors();
            newSelection = this.stickySelection && this["do"].selections() || [];
            newCursors = this["do"].cursors();
            if (oldCursors.length !== newCursors.length) {
                return kerror("Editor." + this.name + ".endSelection -- oldCursors.size != newCursors.size", oldCursors.length, newCursors.length);
            }
            for (ci = j = 0, ref2 = this["do"].numCursors(); 0 <= ref2 ? j < ref2 : j > ref2; ci = 0 <= ref2 ? ++j : --j) {
                oc = oldCursors[ci];
                nc = newCursors[ci];
                if ((oc == null) || (nc == null)) {
                    return kerror("Editor." + this.name + ".endSelection -- invalid cursors", oc, nc);
                } else {
                    ranges = this.rangesForLinesBetweenPositions(oc, nc, true);
                    newSelection = newSelection.concat(ranges);
                }
            }
            return this["do"].select(newSelection);
        }
    },
    addRangeToSelection: function(range) {
        var newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.push(range);
        this["do"].setCursors(endPositionsFromRanges(newSelections), {
            main: 'last'
        });
        this["do"].select(newSelections);
        return this["do"].end();
    },
    removeSelectionAtIndex: function(si) {
        var newCursors, newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.splice(si, 1);
        if (newSelections.length) {
            newCursors = endPositionsFromRanges(newSelections);
            this["do"].setCursors(newCursors, {
                main: (newCursors.length + si - 1) % newCursors.length
            });
        }
        this["do"].select(newSelections);
        return this["do"].end();
    },
    selectNone: function() {
        this["do"].start();
        this["do"].select([]);
        return this["do"].end();
    },
    selectAll: function() {
        this["do"].start();
        this["do"].select(this.rangesForAllLines());
        return this["do"].end();
    },
    selectInverted: function() {
        var invertedRanges, j, li, ref1, sc;
        invertedRanges = [];
        sc = this.selectedAndCursorLineIndices();
        for (li = j = 0, ref1 = this.numLines() - 1; 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            if (indexOf.call(sc, li) < 0) {
                invertedRanges.push(this.rangeForLineAtIndex(li));
            }
        }
        if (invertedRanges.length) {
            this["do"].start();
            this["do"].setCursors([rangeStartPos(_.first(invertedRanges))]);
            this["do"].select(invertedRanges);
            return this["do"].end();
        }
    },
    selectTextBetweenCursorsOrSurround: function() {
        var c0, c1, i, j, newCursors, newSelections, oldCursors, ref1;
        if (this.numCursors() && this.numCursors() % 2 === 0) {
            this["do"].start();
            newSelections = [];
            newCursors = [];
            oldCursors = this["do"].cursors();
            for (i = j = 0, ref1 = oldCursors.length; j < ref1; i = j += 2) {
                c0 = oldCursors[i];
                c1 = oldCursors[i + 1];
                newSelections = newSelections.concat(this.rangesForLinesBetweenPositions(c0, c1));
                newCursors.push(c1);
            }
            this["do"].setCursors(newCursors);
            this["do"].select(newSelections);
            return this["do"].end();
        } else {
            return this.selectBetweenSurround();
        }
    },
    selectBetweenSurround: function() {
        var end, s, start, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            start = rangeEndPos(surr[0]);
            end = rangeStartPos(surr[1]);
            s = this.rangesForLinesBetweenPositions(start, end);
            s = cleanRanges(s);
            if (s.length) {
                this["do"].select(s);
                if (this["do"].numSelections()) {
                    this["do"].setCursors([rangeEndPos(_.last(s))], {
                        Main: 'closest'
                    });
                }
            }
            return this["do"].end();
        }
    },
    selectSurround: function() {
        var r, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            this["do"].select(surr);
            if (this["do"].numSelections()) {
                this["do"].setCursors((function() {
                    var j, len, ref1, results;
                    ref1 = this["do"].selections();
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        r = ref1[j];
                        results.push(rangeEndPos(r));
                    }
                    return results;
                }).call(this), {
                    main: 'closest'
                });
            }
            return this["do"].end();
        }
    },
    selectNextHighlight: function() {
        var r, ref1;
        if (!this.numHighlights()) {
            return;
        }
        r = rangeAfterPosInRanges(this.cursorPos(), this.highlights());
        if (r != null) {
            r;
        } else {
            r = this.highlight(0);
        }
        if (r != null) {
            this.selectSingleRange(r, {
                before: ((ref1 = r[2]) != null ? ref1.clss : void 0) === 'close'
            });
            return typeof this.scrollCursorIntoView === "function" ? this.scrollCursorIntoView() : void 0;
        }
    },
    selectPrevHighlight: function() {
        var hs, r;
        if (!this.numHighlights()) {
            return;
        }
        hs = this.highlights();
        r = rangeBeforePosInRanges(this.cursorPos(), hs);
        if (r != null) {
            r;
        } else {
            r = _.last(hs);
        }
        if (r != null) {
            return this.selectSingleRange(r);
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSxvQkFBQTtJQUFBOztBQUFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsZUFBRixFQUFRLG1CQUFSLEVBQWdCOztBQUVoQixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFFQSxTQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sWUFBUDtZQUNBLEtBQUEsRUFBTyxXQURQO1lBRUEsS0FBQSxFQUFPLE9BRlA7U0FISjtRQU9BLFVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxVQUFQO1lBQ0EsS0FBQSxFQUFPLGlCQURQO1lBRUEsS0FBQSxFQUFPLGNBRlA7U0FSSjtRQVlBLGNBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxrQkFBUDtZQUNBLElBQUEsRUFBTywwREFEUDtZQUVBLEtBQUEsRUFBTyxpQkFGUDtZQUdBLEtBQUEsRUFBTyxjQUhQO1NBYko7UUFrQkEsbUJBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFPLHVCQURQO1lBRUEsS0FBQSxFQUFPLFdBRlA7WUFHQSxLQUFBLEVBQU8sUUFIUDtTQW5CSjtRQXdCQSxtQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLDJCQUFQO1lBQ0EsS0FBQSxFQUFPLGlCQURQO1lBRUEsS0FBQSxFQUFPLGNBRlA7U0F6Qko7UUE2QkEsa0NBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSw0Q0FBTjtZQUNBLElBQUEsRUFBTSxrSUFETjtZQUtBLEtBQUEsRUFBTyxlQUxQO1lBTUEsS0FBQSxFQUFPLFlBTlA7U0E5Qko7UUFzQ0EscUJBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFPLHlCQURQO1lBRUEsSUFBQSxFQUFPLDZEQUZQO1lBR0EsS0FBQSxFQUFPLFdBSFA7WUFJQSxLQUFB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QUNJLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUFzQjtnQkFBQSxNQUFBLCtCQUFZLENBQUUsY0FBTixLQUFjLE9BQXRCO2FBQXRCO3FFQUNBLElBQUMsQ0FBQSxnQ0FGTDs7SUFMaUIsQ0F0UHJCO0lBK1BBLG1CQUFBLEVBQXFCLFNBQUE7QUFFakIsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQWQ7QUFBQSxtQkFBQTs7UUFDQSxFQUFBLEdBQUssSUFBQyxDQUFBLFVBQUQsQ0FBQTtRQUNMLENBQUEsR0FBSSxzQkFBQSxDQUF1QixJQUFDLENBQUEsU0FBRCxDQUFBLENBQXZCLEVBQXFDLEVBQXJDOztZQUNKOztZQUFBLElBQUssQ0FBQyxDQUFDLElBQUYsQ0FBTyxFQUFQOztRQUNMLElBQXdCLFNBQXhCO21CQUFBLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUFBOztJQU5pQixDQS9QckIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbnsgcG9zdCwga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnU2VsZWN0J1xuICAgICAgICBcbiAgICAgICAgc2VsZWN0QWxsOlxuICAgICAgICAgICAgbmFtZTogICdTZWxlY3QgQWxsJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2EnXG4gICAgICAgICAgICBhY2NlbDogJ2FsdCthJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdE5vbmU6XG4gICAgICAgICAgICBuYW1lOiAgJ0Rlc2VsZWN0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K2EnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrc2hpZnQrYSdcbiAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RJbnZlcnRlZDpcbiAgICAgICAgICAgIG5hbWU6ICAnSW52ZXJ0IFNlbGVjdGlvbidcbiAgICAgICAgICAgIHRleHQ6ICAnc2VsZWN0cyBhbGwgbGluZXMgdGhhdCBoYXZlIG5vIGN1cnNvcnMgYW5kIG5vIHNlbGVjdGlvbnMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQraSdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtpJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdE5leHRIaWdobGlnaHQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICAnU2VsZWN0IE5leHQgSGlnaGxpZ2h0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2cnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrZydcbiAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RQcmV2SGlnaGxpZ2h0OlxuICAgICAgICAgICAgbmFtZTogICdTZWxlY3QgUHJldmlvdXMgSGlnaGxpZ2h0J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K2cnXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrc2hpZnQrZydcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBzZWxlY3RUZXh0QmV0d2VlbkN1cnNvcnNPclN1cnJvdW5kOlxuICAgICAgICAgICAgbmFtZTogJ1NlbGVjdCBCZXR3ZWVuIEN1cnNvcnMsIEJyYWNrZXRzIG9yIFF1b3RlcydcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICAgIHNlbGVjdCB0ZXh0IGJldHdlZW4gZXZlbiBjdXJzb3JzLCBpZiBhdCBsZWFzdCB0d28gY3Vyc29ycyBleGlzdC4gXG4gICAgICAgICAgICAgICAgc2VsZWN0IHRleHQgYmV0d2VlbiBoaWdobGlnaHRlZCBicmFja2V0cyBvciBxdW90ZXMgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrY3RybCtiJ1xuXG4gICAgICAgIHRvZ2dsZVN0aWNreVNlbGVjdGlvbjpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICdUb2dnbGUgU3RpY2t5IFNlbGVjdGlvbidcbiAgICAgICAgICAgIHRleHQ6ICAnY3VycmVudCBzZWxlY3Rpb24gaXMgbm90IHJlbW92ZWQgd2hlbiBhZGRpbmcgbmV3IHNlbGVjdGlvbnMnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrYCdcbiAgICAgICAgICAgIGFjY2VsOiBcImN0cmwrJ1wiXG4gICAgICAgICAgICBcbiAgICBzZWxlY3RTaW5nbGVSYW5nZTogKHIsIG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCByP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkVkaXRvci4je25hbWV9LnNlbGVjdFNpbmdsZVJhbmdlIC0tIHVuZGVmaW5lZCByYW5nZSFcIlxuICAgICAgICAgICAgXG4gICAgICAgIGN1cnNvclggPSBpZiBvcHQ/LmJlZm9yZSB0aGVuIHJbMV1bMF0gZWxzZSByWzFdWzFdXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbY3Vyc29yWCwgclswXV1dXG4gICAgICAgIEBkby5zZWxlY3QgW3JdXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgICAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICB0b2dnbGVTdGlja3lTZWxlY3Rpb246IC0+XG5cbiAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiB0aGVuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICBlbHNlIEBzdGFydFN0aWNreVNlbGVjdGlvbigpXG4gICAgXG4gICAgc3RhcnRTdGlja3lTZWxlY3Rpb246IC0+XG4gICAgICAgIFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gdHJ1ZVxuICAgICAgICBwb3N0LmVtaXQgJ3N0aWNreScgdHJ1ZVxuICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgZW5kU3RpY2t5U2VsZWN0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgQHN0aWNreVNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgIHBvc3QuZW1pdCAnc3RpY2t5JyBmYWxzZVxuICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgc3RhcnRTZWxlY3Rpb246IChvcHQgPSBleHRlbmQ6ZmFsc2UpIC0+XG5cbiAgICAgICAgaWYgbm90IG9wdD8uZXh0ZW5kXG4gICAgICAgICAgICBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzID0gbnVsbFxuICAgICAgICAgICAgaWYgbm90IEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycyBvciBAbnVtQ3Vyc29ycygpICE9IEBzdGFydFNlbGVjdGlvbkN1cnNvcnMubGVuZ3RoXG4gICAgICAgICAgICBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQHN0YXJ0U2VsZWN0aW9uQ3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBzZWwgPSBAY29udGludW91c1NlbGVjdGlvbkF0UG9zSW5SYW5nZXMgYywgQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIHNlbFsxXSwgY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNbMF0gPSBzZWxbMF1bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjWzFdID0gc2VsWzBdWzFdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCByYW5nZXNGcm9tUG9zaXRpb25zIEBzdGFydFNlbGVjdGlvbkN1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgZW5kU2VsZWN0aW9uOiAob3B0ID0gZXh0ZW5kOmZhbHNlKSAtPlxuXG4gICAgICAgIGlmIG5vdCBvcHQ/LmV4dGVuZCBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycyA9IG51bGxcbiAgICAgICAgICAgIGlmIG5vdCBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBbXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9sZEN1cnNvcnMgICA9IEBzdGFydFNlbGVjdGlvbkN1cnNvcnMgPyBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb24gPSBAc3RpY2t5U2VsZWN0aW9uIGFuZCBAZG8uc2VsZWN0aW9ucygpIG9yIFtdICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXdDdXJzb3JzICAgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9sZEN1cnNvcnMubGVuZ3RoICE9IG5ld0N1cnNvcnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkVkaXRvci4je0BuYW1lfS5lbmRTZWxlY3Rpb24gLS0gb2xkQ3Vyc29ycy5zaXplICE9IG5ld0N1cnNvcnMuc2l6ZVwiIG9sZEN1cnNvcnMubGVuZ3RoLCBuZXdDdXJzb3JzLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5AZG8ubnVtQ3Vyc29ycygpXVxuICAgICAgICAgICAgICAgIG9jID0gb2xkQ3Vyc29yc1tjaV1cbiAgICAgICAgICAgICAgICBuYyA9IG5ld0N1cnNvcnNbY2ldXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbm90IG9jPyBvciBub3QgbmM/XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJFZGl0b3IuI3tAbmFtZX0uZW5kU2VsZWN0aW9uIC0tIGludmFsaWQgY3Vyc29yc1wiIG9jLCBuY1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2VzID0gQHJhbmdlc0ZvckxpbmVzQmV0d2VlblBvc2l0aW9ucyBvYywgbmMsIHRydWUgIzwgZXh0ZW5kIHRvIGZ1bGwgbGluZXMgaWYgY3Vyc29yIGF0IHN0YXJ0IG9mIGxpbmUgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbiA9IG5ld1NlbGVjdGlvbi5jb25jYXQgcmFuZ2VzXG4gICAgXG4gICAgICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvblxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZFJhbmdlVG9TZWxlY3Rpb246IChyYW5nZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMucHVzaCByYW5nZVxuICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgZW5kUG9zaXRpb25zRnJvbVJhbmdlcyhuZXdTZWxlY3Rpb25zKSwgbWFpbjonbGFzdCdcbiAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgcmVtb3ZlU2VsZWN0aW9uQXRJbmRleDogKHNpKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgbmV3U2VsZWN0aW9ucy5zcGxpY2Ugc2ksIDFcbiAgICAgICAgaWYgbmV3U2VsZWN0aW9ucy5sZW5ndGhcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBlbmRQb3NpdGlvbnNGcm9tUmFuZ2VzIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46KG5ld0N1cnNvcnMubGVuZ3RoK3NpLTEpICUgbmV3Q3Vyc29ycy5sZW5ndGhcbiAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgIEBkby5lbmQoKSAgICAgICAgXG5cbiAgICBzZWxlY3ROb25lOiAtPiBcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgIHNlbGVjdEFsbDogLT5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNlbGVjdCBAcmFuZ2VzRm9yQWxsTGluZXMoKVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBzZWxlY3RJbnZlcnRlZDogLT5cbiAgICAgICAgXG4gICAgICAgIGludmVydGVkUmFuZ2VzID0gW10gICAgICAgIFxuICAgICAgICBzYyA9IEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCktMV1cbiAgICAgICAgICAgIGlmIGxpIG5vdCBpbiBzY1xuICAgICAgICAgICAgICAgIGludmVydGVkUmFuZ2VzLnB1c2ggQHJhbmdlRm9yTGluZUF0SW5kZXggbGlcbiAgICAgICAgaWYgaW52ZXJ0ZWRSYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgW3JhbmdlU3RhcnRQb3MgXy5maXJzdCBpbnZlcnRlZFJhbmdlc11cbiAgICAgICAgICAgIEBkby5zZWxlY3QgaW52ZXJ0ZWRSYW5nZXNcbiAgICAgICAgICAgIEBkby5lbmQoKSAgICAgXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHNlbGVjdFRleHRCZXR3ZWVuQ3Vyc29yc09yU3Vycm91bmQ6IC0+XG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSBhbmQgQG51bUN1cnNvcnMoKSAlIDIgPT0gMCAgXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IFtdXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIG9sZEN1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLm9sZEN1cnNvcnMubGVuZ3RoXSBieSAyXG4gICAgICAgICAgICAgICAgYzAgPSBvbGRDdXJzb3JzW2ldXG4gICAgICAgICAgICAgICAgYzEgPSBvbGRDdXJzb3JzW2krMV1cbiAgICAgICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gbmV3U2VsZWN0aW9ucy5jb25jYXQgQHJhbmdlc0ZvckxpbmVzQmV0d2VlblBvc2l0aW9ucyBjMCwgYzFcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggYzFcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIGVsc2UgQHNlbGVjdEJldHdlZW5TdXJyb3VuZCgpXG5cbiAgICBzZWxlY3RCZXR3ZWVuU3Vycm91bmQ6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdXJyID0gQGhpZ2hsaWdodHNTdXJyb3VuZGluZ0N1cnNvcigpXG4gICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgc3RhcnQgPSByYW5nZUVuZFBvcyBzdXJyWzBdXG4gICAgICAgICAgICBlbmQgPSByYW5nZVN0YXJ0UG9zIHN1cnJbMV1cbiAgICAgICAgICAgIHMgPSBAcmFuZ2VzRm9yTGluZXNCZXR3ZWVuUG9zaXRpb25zIHN0YXJ0LCBlbmRcbiAgICAgICAgICAgIHMgPSBjbGVhblJhbmdlcyBzXG4gICAgICAgICAgICBpZiBzLmxlbmd0aFxuICAgICAgICAgICAgICAgIEBkby5zZWxlY3Qgc1xuICAgICAgICAgICAgICAgIGlmIEBkby5udW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgW3JhbmdlRW5kUG9zKF8ubGFzdCBzKV0sIE1haW46ICdjbG9zZXN0J1xuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICBcbiAgICBzZWxlY3RTdXJyb3VuZDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN1cnIgPSBAaGlnaGxpZ2h0c1N1cnJvdW5kaW5nQ3Vyc29yKClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBAZG8uc2VsZWN0IHN1cnJcbiAgICAgICAgICAgIGlmIEBkby5udW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyAocmFuZ2VFbmRQb3MocikgZm9yIHIgaW4gQGRvLnNlbGVjdGlvbnMoKSksIG1haW46ICdjbG9zZXN0J1xuICAgICAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICAgICBcbiAgICBzZWxlY3ROZXh0SGlnaGxpZ2h0OiAtPiAjIGNvbW1hbmQrZ1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIHIgPSByYW5nZUFmdGVyUG9zSW5SYW5nZXMgQGN1cnNvclBvcygpLCBAaGlnaGxpZ2h0cygpXG4gICAgICAgIHIgPz0gQGhpZ2hsaWdodCAwXG4gICAgICAgIGlmIHI/XG4gICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgciwgYmVmb3JlOiByWzJdPy5jbHNzID09ICdjbG9zZSdcbiAgICAgICAgICAgIEBzY3JvbGxDdXJzb3JJbnRvVmlldz8oKSAjIDwgdGhpcyBhbHNvIHN1Y2tzXG5cbiAgICBzZWxlY3RQcmV2SGlnaGxpZ2h0OiAtPiAjIGNvbW1hbmQrc2hpZnQrZ1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIGhzID0gQGhpZ2hsaWdodHMoKVxuICAgICAgICByID0gcmFuZ2VCZWZvcmVQb3NJblJhbmdlcyBAY3Vyc29yUG9zKCksIGhzXG4gICAgICAgIHIgPz0gXy5sYXN0IGhzXG4gICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByIGlmIHI/XG5cbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/selection.coffee