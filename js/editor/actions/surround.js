// koffee 1.12.0
var _, ref, reversed;

ref = require('kxk'), reversed = ref.reversed, _ = ref._;

module.exports = {
    initSurround: function() {
        this.surroundStack = [];
        this.surroundPairs = {
            '#': ['#{', '}'],
            '{': ['{', '}'],
            '}': ['{', '}'],
            '[': ['[', ']'],
            ']': ['[', ']'],
            '(': ['(', ')'],
            ')': ['(', ')'],
            '<': ['<', '>'],
            '>': ['<', '>'],
            "'": ["'", "'"],
            '"': ['"', '"'],
            '*': ['*', '*']
        };
        return this.surroundCharacters = "{}[]()\"'".split('');
    },
    isUnbalancedSurroundCharacter: function(ch) {
        var c, cl, count, cr, cursor, i, j, len, len1, ref1, ref2, ref3;
        if (ch === "#") {
            return false;
        }
        ref1 = this.surroundPairs[ch], cl = ref1[0], cr = ref1[1];
        if (cl.length > 1) {
            return false;
        }
        ref2 = this.cursors();
        for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            count = 0;
            ref3 = this.line(cursor[1]);
            for (j = 0, len1 = ref3.length; j < len1; j++) {
                c = ref3[j];
                if (c === cl) {
                    count += 1;
                } else if (c === cr) {
                    count -= 1;
                }
            }
            if (((cl === cr) && (count % 2)) || ((cl !== cr) && count)) {
                return true;
            }
        }
        return false;
    },
    selectionContainsOnlyQuotes: function() {
        var c, i, len, ref1;
        ref1 = this.textOfSelection();
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c === '\n') {
                continue;
            }
            if (c !== '"' && c !== "'") {
                return false;
            }
        }
        return true;
    },
    insertTripleQuotes: function() {
        var after, before, p, ref1;
        if (this.numCursors() > 1) {
            return false;
        }
        if (this.numSelections()) {
            return false;
        }
        p = this.cursorPos();
        ref1 = this.splitStateLineAtPos(this.state, p), before = ref1[0], after = ref1[1];
        if (!before.endsWith('""')) {
            return false;
        }
        if (before.length > 2 && before[before.length - 3] === '"') {
            return false;
        }
        if (after.startsWith('"')) {
            return false;
        }
        this["do"].start();
        this["do"].change(p[1], before + '""""' + after);
        this["do"].setCursors([[p[0] + 1, p[1]]]);
        this["do"].end();
        return true;
    },
    insertSurroundCharacter: function(ch) {
        var c, cl, cr, found, i, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, m, n, newCursors, newSelections, ns, o, os, q, ref1, ref2, ref3, ref4, ref5, ref6, sr;
        if (this.isUnbalancedSurroundCharacter(ch)) {
            return false;
        }
        if (this.numSelections() && (ch === '"' || ch === "'") && this.selectionContainsOnlyQuotes()) {
            return false;
        }
        newCursors = this["do"].cursors();
        if (this.surroundStack.length) {
            if (_.last(this.surroundStack)[1] === ch) {
                for (i = 0, len = newCursors.length; i < len; i++) {
                    c = newCursors[i];
                    if (this["do"].line(c[1])[c[0]] !== ch) {
                        this.surroundStack = [];
                        break;
                    }
                }
                if (this.surroundStack.length && _.last(this.surroundStack)[1] === ch) {
                    this["do"].start();
                    this.selectNone();
                    this.deleteForward();
                    this["do"].end();
                    this.surroundStack.pop();
                    return false;
                }
            }
            if (!found) {
                for (j = 0, len1 = newCursors.length; j < len1; j++) {
                    c = newCursors[j];
                    if (this.isRangeInString(rangeForPos(c))) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                return false;
            }
        }
        if (ch === "'" && !this.numSelections()) {
            for (k = 0, len2 = newCursors.length; k < len2; k++) {
                c = newCursors[k];
                if (c[0] > 0 && /[A-Za-z]/.test(this["do"].line(c[1])[c[0] - 1])) {
                    return false;
                }
            }
        }
        this["do"].start();
        if (this["do"].numSelections() === 0) {
            newSelections = rangesFromPositions(newCursors);
        } else {
            newSelections = this["do"].selections();
        }
        ref1 = this.surroundPairs[ch], cl = ref1[0], cr = ref1[1];
        this.surroundStack.push([cl, cr]);
        ref2 = reversed(newSelections);
        for (l = 0, len3 = ref2.length; l < len3; l++) {
            ns = ref2[l];
            if (cl === '#{') {
                if (sr = this.rangeOfStringSurroundingRange(ns)) {
                    if (this["do"].line(sr[0])[sr[1][0]] === "'") {
                        this["do"].change(ns[0], this["do"].line(ns[0]).splice(sr[1][0], 1, '"'));
                    }
                    if (this["do"].line(sr[0])[sr[1][1] - 1] === "'") {
                        this["do"].change(ns[0], this["do"].line(ns[0]).splice(sr[1][1] - 1, 1, '"'));
                    }
                }
            }
            this["do"].change(ns[0], this["do"].line(ns[0]).splice(ns[1][1], 0, cr));
            this["do"].change(ns[0], this["do"].line(ns[0]).splice(ns[1][0], 0, cl));
            ref3 = positionsAfterLineColInPositions(ns[0], ns[1][0] - 1, newCursors);
            for (m = 0, len4 = ref3.length; m < len4; m++) {
                c = ref3[m];
                c[0] += cl.length;
            }
            ref4 = rangesAfterLineColInRanges(ns[0], ns[1][1] - 1, newSelections);
            for (n = 0, len5 = ref4.length; n < len5; n++) {
                os = ref4[n];
                os[1][0] += cr.length;
                os[1][1] += cr.length;
            }
            ref5 = rangesAfterLineColInRanges(ns[0], ns[1][0] - 1, newSelections);
            for (o = 0, len6 = ref5.length; o < len6; o++) {
                os = ref5[o];
                os[1][0] += cl.length;
                os[1][1] += cl.length;
            }
            ref6 = positionsAfterLineColInPositions(ns[0], ns[1][1], newCursors);
            for (q = 0, len7 = ref6.length; q < len7; q++) {
                c = ref6[q];
                c[0] += cr.length;
            }
        }
        this["do"].select(rangesNotEmptyInRanges(newSelections));
        this["do"].setCursors(newCursors);
        this["do"].end();
        return true;
    },
    deleteEmptySurrounds: function() {
        var after, before, c, cs, i, j, k, l, len, len1, len2, len3, nc, numPairs, openClosePairs, pairs, ref1, ref2, ref3, sc, so, uniquePairs;
        cs = this["do"].cursors();
        pairs = _.uniqWith(_.values(this.surroundPairs), _.isEqual);
        openClosePairs = [];
        for (i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            numPairs = openClosePairs.length;
            for (j = 0, len1 = pairs.length; j < len1; j++) {
                ref1 = pairs[j], so = ref1[0], sc = ref1[1];
                before = this["do"].line(c[1]).slice(c[0] - so.length, c[0]);
                after = this["do"].line(c[1]).slice(c[0], c[0] + sc.length);
                if (so === before && sc === after) {
                    openClosePairs.push([so, sc]);
                    break;
                }
            }
            if (numPairs === openClosePairs.length) {
                return false;
            }
        }
        if (cs.length !== openClosePairs.length) {
            return false;
        }
        uniquePairs = _.uniqWith(openClosePairs, _.isEqual);
        for (k = 0, len2 = cs.length; k < len2; k++) {
            c = cs[k];
            ref2 = openClosePairs.shift(), so = ref2[0], sc = ref2[1];
            this["do"].change(c[1], this["do"].line(c[1]).splice(c[0] - so.length, so.length + sc.length));
            ref3 = positionsAfterLineColInPositions(c[1], c[0], cs);
            for (l = 0, len3 = ref3.length; l < len3; l++) {
                nc = ref3[l];
                nc[0] -= sc.length + so.length;
            }
            c[0] -= so.length;
        }
        if (this.surroundStack.length) {
            if (uniquePairs.length === 1 && _.isEqual(uniquePairs[0], _.last(this.surroundStack))) {
                this.surroundStack.pop();
            } else {
                this.surroundStack = [];
            }
        }
        this["do"].setCursors(cs);
        return true;
    },
    highlightsSurroundingCursor: function() {
        var hs;
        if (this.numHighlights() % 2 === 0) {
            hs = this.highlights();
            sortRanges(hs);
            if (this.numHighlights() === 2) {
                return hs;
            } else if (this.numHighlights() === 4) {
                if (areSameRanges([hs[1], hs[2]], this.selections())) {
                    return [hs[0], hs[3]];
                } else {
                    return [hs[1], hs[2]];
                }
            }
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vycm91bmQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJzdXJyb3VuZC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBa0IsT0FBQSxDQUFRLEtBQVIsQ0FBbEIsRUFBRSx1QkFBRixFQUFZOztBQUVaLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxZQUFBLEVBQWMsU0FBQTtRQUVWLElBQUMsQ0FBQSxhQUFELEdBQWlCO1FBRWpCLElBQUMsQ0FBQSxhQUFELEdBQ0k7WUFBQSxHQUFBLEVBQUssQ0FBQyxJQUFELEVBQU0sR0FBTixDQUFMO1lBQ0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFLLEdBQUwsQ0FETDtZQUVBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBSyxHQUFMLENBRkw7WUFHQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQUssR0FBTCxDQUhMO1lBSUEsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFLLEdBQUwsQ0FKTDtZQUtBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBSyxHQUFMLENBTEw7WUFNQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQUssR0FBTCxDQU5MO1lBT0EsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFLLEdBQUwsQ0FQTDtZQVFBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBSyxHQUFMLENBUkw7WUFTQSxHQUFBLEVBQUssQ0FBQyxHQUFELEVBQUssR0FBTCxDQVRMO1lBVUEsR0FBQSxFQUFLLENBQUMsR0FBRCxFQUFLLEdBQUwsQ0FWTDtZQVdBLEdBQUEsRUFBSyxDQUFDLEdBQUQsRUFBSyxHQUFMLENBWEw7O2VBYUosSUFBQyxDQUFBLGtCQUFELEdBQXNCLFdBQVcsQ0FBQyxLQUFaLENBQWtCLEVBQWxCO0lBbEJaLENBQWQ7SUFvQkEsNkJBQUEsRUFBK0IsU0FBQyxFQUFEO0FBRTNCLFlBQUE7UUFBQSxJQUFnQixFQUFBLEtBQU8sR0FB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MDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG5cbnsgcmV2ZXJzZWQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPVxuXG4gICAgaW5pdFN1cnJvdW5kOiAtPlxuICAgICAgICBcbiAgICAgICAgQHN1cnJvdW5kU3RhY2sgPSBbXVxuXG4gICAgICAgIEBzdXJyb3VuZFBhaXJzID0gXG4gICAgICAgICAgICAnIyc6IFsnI3snICd9J10gIyA8LSB0aGlzIGhhcyB0byBjb21lXG4gICAgICAgICAgICAneyc6IFsneycgJ30nXSAgIyA8LSBiZWZvcmUgdGhhdFxuICAgICAgICAgICAgJ30nOiBbJ3snICd9J11cbiAgICAgICAgICAgICdbJzogWydbJyAnXSddXG4gICAgICAgICAgICAnXSc6IFsnWycgJ10nXVxuICAgICAgICAgICAgJygnOiBbJygnICcpJ11cbiAgICAgICAgICAgICcpJzogWycoJyAnKSddXG4gICAgICAgICAgICAnPCc6IFsnPCcgJz4nXVxuICAgICAgICAgICAgJz4nOiBbJzwnICc+J11cbiAgICAgICAgICAgIFwiJ1wiOiBbXCInXCIgXCInXCJdXG4gICAgICAgICAgICAnXCInOiBbJ1wiJyAnXCInXVxuICAgICAgICAgICAgJyonOiBbJyonICcqJ10gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgQHN1cnJvdW5kQ2hhcmFjdGVycyA9IFwie31bXSgpXFxcIidcIi5zcGxpdCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgaXNVbmJhbGFuY2VkU3Vycm91bmRDaGFyYWN0ZXI6IChjaCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBjaCBpbiBbXCIjXCJdXG4gICAgICAgIFtjbCxjcl0gPSBAc3Vycm91bmRQYWlyc1tjaF1cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGNsLmxlbmd0aCA+IDFcbiAgICAgICAgZm9yIGN1cnNvciBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgIGZvciBjIGluIEBsaW5lKGN1cnNvclsxXSlcbiAgICAgICAgICAgICAgICBpZiBjID09IGNsXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ICs9IDFcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGMgPT0gY3JcbiAgICAgICAgICAgICAgICAgICAgY291bnQgLT0gMVxuICAgICAgICAgICAgaWYgKChjbCA9PSBjcikgYW5kIChjb3VudCAlIDIpKSBvciAoKGNsICE9IGNyKSBhbmQgY291bnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgXG4gICAgc2VsZWN0aW9uQ29udGFpbnNPbmx5UXVvdGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBjID09ICdcXG4nXG4gICAgICAgICAgICBpZiBjIG5vdCBpbiBbJ1wiJyBcIidcIl1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgdHJ1ZVxuICAgIFxuICAgIGluc2VydFRyaXBsZVF1b3RlczogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBAbnVtQ3Vyc29ycygpID4gMVxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICBwID0gQGN1cnNvclBvcygpXG4gICAgICAgIFtiZWZvcmUsIGFmdGVyXSA9IEBzcGxpdFN0YXRlTGluZUF0UG9zIEBzdGF0ZSwgcFxuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IGJlZm9yZS5lbmRzV2l0aCAnXCJcIidcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIGJlZm9yZS5sZW5ndGggPiAyIGFuZCBiZWZvcmVbYmVmb3JlLmxlbmd0aC0zXSA9PSAnXCInXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBhZnRlci5zdGFydHNXaXRoICdcIidcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLmNoYW5nZSBwWzFdLCBiZWZvcmUgKyAnXCJcIlwiXCInICsgYWZ0ZXJcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1twWzBdKzEsIHBbMV1dXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgdHJ1ZVxuICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGluc2VydFN1cnJvdW5kQ2hhcmFjdGVyOiAoY2gpIC0+XG5cbiAgICAgICAgaWYgQGlzVW5iYWxhbmNlZFN1cnJvdW5kQ2hhcmFjdGVyIGNoXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBjaCBpbiBbJ1wiJyBcIidcIl0gYW5kIEBzZWxlY3Rpb25Db250YWluc09ubHlRdW90ZXMoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHN1cnJvdW5kU3RhY2subGVuZ3RoXG4gICAgICAgICAgICBpZiBfLmxhc3QoQHN1cnJvdW5kU3RhY2spWzFdID09IGNoXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShjWzFdKVtjWzBdXSAhPSBjaFxuICAgICAgICAgICAgICAgICAgICAgICAgQHN1cnJvdW5kU3RhY2sgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBAc3Vycm91bmRTdGFjay5sZW5ndGggYW5kIF8ubGFzdChAc3Vycm91bmRTdGFjaylbMV0gPT0gY2hcbiAgICAgICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgICAgICAgICBAZGVsZXRlRm9yd2FyZCgpXG4gICAgICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgICAgICBAc3Vycm91bmRTdGFjay5wb3AoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgZm91bmRcbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpc1JhbmdlSW5TdHJpbmcgcmFuZ2VGb3JQb3MgY1xuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGNoID09IFwiJ1wiIGFuZCBub3QgQG51bVNlbGVjdGlvbnMoKSAjIGNoZWNrIGlmIGFueSBhbHBhYmV0aWNhbCBjaGFyYWN0ZXIgaXMgYmVmb3JlIGFueSBjdXJzb3JcbiAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBpZiBjWzBdID4gMCBhbmQgL1tBLVphLXpdLy50ZXN0IEBkby5saW5lKGNbMV0pW2NbMF0tMV0gXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaWYgQGRvLm51bVNlbGVjdGlvbnMoKSA9PSAwXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gcmFuZ2VzRnJvbVBvc2l0aW9ucyBuZXdDdXJzb3JzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICBcbiAgICAgICAgW2NsLGNyXSA9IEBzdXJyb3VuZFBhaXJzW2NoXVxuICAgICAgICAgICAgXG4gICAgICAgIEBzdXJyb3VuZFN0YWNrLnB1c2ggW2NsLGNyXVxuXG4gICAgICAgIGZvciBucyBpbiByZXZlcnNlZCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNsID09ICcjeycgIyBjb252ZXJ0IHNpbmdsZSBzdHJpbmcgdG8gZG91YmxlIHN0cmluZ1xuICAgICAgICAgICAgICAgIGlmIHNyID0gQHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlIG5zXG4gICAgICAgICAgICAgICAgICAgIGlmIEBkby5saW5lKHNyWzBdKVtzclsxXVswXV0gPT0gXCInXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgbnNbMF0sIEBkby5saW5lKG5zWzBdKS5zcGxpY2Ugc3JbMV1bMF0sIDEsICdcIidcbiAgICAgICAgICAgICAgICAgICAgaWYgQGRvLmxpbmUoc3JbMF0pW3NyWzFdWzFdLTFdID09IFwiJ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIG5zWzBdLCBAZG8ubGluZShuc1swXSkuc3BsaWNlIHNyWzFdWzFdLTEsIDEsICdcIidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAZG8uY2hhbmdlIG5zWzBdLCBAZG8ubGluZShuc1swXSkuc3BsaWNlIG5zWzFdWzFdLCAwLCBjclxuICAgICAgICAgICAgQGRvLmNoYW5nZSBuc1swXSwgQGRvLmxpbmUobnNbMF0pLnNwbGljZSBuc1sxXVswXSwgMCwgY2xcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGMgaW4gcG9zaXRpb25zQWZ0ZXJMaW5lQ29sSW5Qb3NpdGlvbnMgbnNbMF0sIG5zWzFdWzBdLTEsIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBjWzBdICs9IGNsLmxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIG9zIGluIHJhbmdlc0FmdGVyTGluZUNvbEluUmFuZ2VzIG5zWzBdLCBuc1sxXVsxXS0xLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgb3NbMV1bMF0gKz0gY3IubGVuZ3RoXG4gICAgICAgICAgICAgICAgb3NbMV1bMV0gKz0gY3IubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3Igb3MgaW4gcmFuZ2VzQWZ0ZXJMaW5lQ29sSW5SYW5nZXMgbnNbMF0sIG5zWzFdWzBdLTEsIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBvc1sxXVswXSArPSBjbC5sZW5ndGhcbiAgICAgICAgICAgICAgICBvc1sxXVsxXSArPSBjbC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGMgaW4gcG9zaXRpb25zQWZ0ZXJMaW5lQ29sSW5Qb3NpdGlvbnMgbnNbMF0sIG5zWzFdWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgY1swXSArPSBjci5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGRvLnNlbGVjdCByYW5nZXNOb3RFbXB0eUluUmFuZ2VzIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGRlbGV0ZUVtcHR5U3Vycm91bmRzOiAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGNzID0gQGRvLmN1cnNvcnMoKVxuXG4gICAgICAgIHBhaXJzID0gXy51bmlxV2l0aCBfLnZhbHVlcyhAc3Vycm91bmRQYWlycyksIF8uaXNFcXVhbFxuXG4gICAgICAgIG9wZW5DbG9zZVBhaXJzID0gW11cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIGNzXG4gICAgICAgICAgICBudW1QYWlycyA9IG9wZW5DbG9zZVBhaXJzLmxlbmd0aFxuICAgICAgICAgICAgIyBjaGVjayBpZiBhbGwgY3Vyc29ycyBhcmUgaW5zaWRlIG9mIGVtcHR5IHN1cnJvdW5kIHBhaXJzXG4gICAgICAgICAgICBmb3IgW3NvLCBzY10gaW4gcGFpcnNcbiAgICAgICAgICAgICAgICBiZWZvcmUgPSBAZG8ubGluZShjWzFdKS5zbGljZSBjWzBdLXNvLmxlbmd0aCwgY1swXVxuICAgICAgICAgICAgICAgIGFmdGVyICA9IEBkby5saW5lKGNbMV0pLnNsaWNlIGNbMF0sIGNbMF0rc2MubGVuZ3RoXG4gICAgICAgICAgICAgICAgaWYgc28gPT0gYmVmb3JlIGFuZCBzYyA9PSBhZnRlclxuICAgICAgICAgICAgICAgICAgICBvcGVuQ2xvc2VQYWlycy5wdXNoIFtzbyxzY11cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGlmIG51bVBhaXJzID09IG9wZW5DbG9zZVBhaXJzLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZSBcblxuICAgICAgICBpZiBjcy5sZW5ndGggIT0gb3BlbkNsb3NlUGFpcnMubGVuZ3RoXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgXG4gICAgICAgICAgICBcbiAgICAgICAgIyBhbGwgY3Vyc29ycyBpbiBlbXB0eSBzdXJyb3VuZCAtPiByZW1vdmUgYm90aCBzdXJyb3VuZHNcbiAgICAgICAgXG4gICAgICAgIHVuaXF1ZVBhaXJzID0gXy51bmlxV2l0aCBvcGVuQ2xvc2VQYWlycywgXy5pc0VxdWFsXG4gICAgICAgIGZvciBjIGluIGNzXG4gICAgICAgICAgICBbc28sc2NdID0gb3BlbkNsb3NlUGFpcnMuc2hpZnQoKVxuICBcbiAgICAgICAgICAgIEBkby5jaGFuZ2UgY1sxXSwgQGRvLmxpbmUoY1sxXSkuc3BsaWNlIGNbMF0tc28ubGVuZ3RoLCBzby5sZW5ndGgrc2MubGVuZ3RoXG4gICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQWZ0ZXJMaW5lQ29sSW5Qb3NpdGlvbnMgY1sxXSwgY1swXSwgY3NcbiAgICAgICAgICAgICAgICBuY1swXSAtPSBzYy5sZW5ndGggKyBzby5sZW5ndGggXG4gICAgICAgICAgICBjWzBdIC09IHNvLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgaWYgQHN1cnJvdW5kU3RhY2subGVuZ3RoICMgcG9wIG9yIGNsZWFuIHN1cnJvdW5kIHN0YWNrXG4gICAgICAgICAgICBpZiB1bmlxdWVQYWlycy5sZW5ndGggPT0gMSBhbmQgXy5pc0VxdWFsIHVuaXF1ZVBhaXJzWzBdLCBfLmxhc3QgQHN1cnJvdW5kU3RhY2sgXG4gICAgICAgICAgICAgICAgQHN1cnJvdW5kU3RhY2sucG9wKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc3Vycm91bmRTdGFjayA9IFtdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIGNzXG4gICAgICAgIFxuICAgICAgICB0cnVlICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGhpZ2hsaWdodHNTdXJyb3VuZGluZ0N1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgJSAyID09IDBcbiAgICAgICAgICAgIGhzID0gQGhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgc29ydFJhbmdlcyBoc1xuICAgICAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSA9PSAyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhzXG4gICAgICAgICAgICBlbHNlIGlmIEBudW1IaWdobGlnaHRzKCkgPT0gNFxuICAgICAgICAgICAgICAgIGlmIGFyZVNhbWVSYW5nZXMgW2hzWzFdLCBoc1syXV0sIEBzZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtoc1swXSwgaHNbM11dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2hzWzFdLCBoc1syXV1cblxuIl19
//# sourceURL=../../../coffee/editor/actions/surround.coffee