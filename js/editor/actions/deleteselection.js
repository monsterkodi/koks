// koffee 1.12.0
var _, klog, ref,
    indexOf = [].indexOf;

ref = require('kxk'), klog = ref.klog, _ = ref._;

module.exports = {
    deleteSelectionOrCursorLines: function() {
        this["do"].start();
        if (!this["do"].numSelections()) {
            this.selectMoreLines();
        }
        this.deleteSelection({
            deleteLines: !this.isInputCursor()
        });
        return this["do"].end();
    },
    deleteSelection: function(opt) {
        var c, csel, ep, i, j, joinLines, k, l, len, len1, len2, len3, len4, len5, len6, lineSelected, m, n, nc, newCursors, o, oldSelections, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, rg, s, sp;
        if (opt == null) {
            opt = {
                deleteLines: !this.isInputCursor()
            };
        }
        this["do"].start();
        if (this["do"].numSelections()) {
            newCursors = this["do"].cursors();
            oldSelections = this["do"].selections();
            joinLines = [];
            ref1 = this["do"].cursors().reverse();
            for (i = 0, len = ref1.length; i < len; i++) {
                c = ref1[i];
                if (opt.deleteLines) {
                    csel = this.continuousSelectionAtPosInRanges(c, oldSelections);
                } else {
                    rg = rangeAtPosInRanges(c, oldSelections);
                    if (rg != null) {
                        csel = [rangeStartPos(rg), rangeEndPos(rg)];
                    }
                }
                if (csel != null) {
                    sp = csel[0], ep = csel[1];
                    ref2 = positionsBetweenPosAndPosInPositions(sp, ep, newCursors);
                    for (j = 0, len1 = ref2.length; j < len1; j++) {
                        nc = ref2[j];
                        cursorSet(nc, sp);
                    }
                    if (sp[1] < ep[1] && sp[0] > 0 && ep[0] < this["do"].line(ep[1]).length) {
                        joinLines.push(sp[1]);
                        ref3 = positionsAfterLineColInPositions(ep[1], ep[0], newCursors);
                        for (k = 0, len2 = ref3.length; k < len2; k++) {
                            nc = ref3[k];
                            cursorSet(nc, sp[0] + nc[0] - ep[0], sp[1]);
                        }
                    }
                }
            }
            ref4 = this["do"].selections().reverse();
            for (l = 0, len3 = ref4.length; l < len3; l++) {
                s = ref4[l];
                if (s[0] >= this["do"].numLines()) {
                    continue;
                }
                lineSelected = s[1][0] === 0 && s[1][1] === this["do"].line(s[0]).length;
                if (lineSelected && opt.deleteLines && this["do"].numLines() > 1) {
                    this["do"]["delete"](s[0]);
                    ref5 = positionsBelowLineIndexInPositions(s[0], newCursors);
                    for (m = 0, len4 = ref5.length; m < len4; m++) {
                        nc = ref5[m];
                        cursorDelta(nc, 0, -1);
                    }
                } else {
                    if (s[0] >= this["do"].numLines()) {
                        continue;
                    }
                    this["do"].change(s[0], this["do"].line(s[0]).splice(s[1][0], s[1][1] - s[1][0]));
                    ref6 = positionsAfterLineColInPositions(s[0], s[1][1], newCursors);
                    for (n = 0, len5 = ref6.length; n < len5; n++) {
                        nc = ref6[n];
                        cursorDelta(nc, -(s[1][1] - s[1][0]));
                    }
                }
                if (ref7 = s[0], indexOf.call(joinLines, ref7) >= 0) {
                    this["do"].change(s[0], this["do"].line(s[0]) + this["do"].line(s[0] + 1));
                    this["do"]["delete"](s[0] + 1);
                    ref8 = positionsBelowLineIndexInPositions(s[0], newCursors);
                    for (o = 0, len6 = ref8.length; o < len6; o++) {
                        nc = ref8[o];
                        cursorDelta(nc, 0, -1);
                    }
                    _.pull(joinLines, s[0]);
                }
            }
            this["do"].select([]);
            this["do"].setCursors(newCursors);
            this.endSelection();
        }
        return this["do"].end();
    },
    continuousSelectionAtPosInRanges: function(p, sel) {
        var ep, nlr, plr, r, sil, sp;
        r = rangeAtPosInRanges(p, sel);
        if (r && lengthOfRange(r)) {
            sp = rangeStartPos(r);
            while ((sp[0] === 0) && (sp[1] > 0)) {
                plr = this.rangeForLineAtIndex(sp[1] - 1);
                sil = rangesAtLineIndexInRanges(sp[1] - 1, sel);
                if (sil.length === 1 && isSameRange(sil[0], plr)) {
                    sp = rangeStartPos(plr);
                } else if (sil.length && _.last(sil)[1][1] === plr[1][1]) {
                    sp = rangeStartPos(_.last(sil));
                } else {
                    break;
                }
            }
            ep = rangeEndPos(r);
            while ((ep[0] === this.line(ep[1]).length) && (ep[1] < this.numLines() - 1)) {
                nlr = this.rangeForLineAtIndex(ep[1] + 1);
                sil = rangesAtLineIndexInRanges(ep[1] + 1, sel);
                if (sil.length === 1 && isSameRange(sil[0], nlr)) {
                    ep = rangeEndPos(nlr);
                } else if (sil.length && _.first(sil)[1][0] === 0) {
                    ep = rangeEndPos(_.first(sil));
                } else {
                    break;
                }
            }
            return [sp, ep];
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlc2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsiZGVsZXRlc2VsZWN0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSxZQUFBO0lBQUE7O0FBQUEsTUFBYyxPQUFBLENBQVEsS0FBUixDQUFkLEVBQUUsZUFBRixFQUFROztBQUVSLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSw0QkFBQSxFQUE4QixTQUFBO1FBRTFCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFHLENBQUksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLGFBQUosQ0FBQSxDQUFQO1lBQ0ksSUFBQyxDQUFBLGVBQUQsQ0FBQSxFQURKOztRQUVBLElBQUMsQ0FBQSxlQUFELENBQWlCO1lBQUEsV0FBQSxFQUFZLENBQUksSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFoQjtTQUFqQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFOMEIsQ0FBOUI7SUFRQSxlQUFBLEVBQWlCLFNBQUMsR0FBRDtBQUViLFlBQUE7O1lBRmMsTUFBTTtnQkFBQSxXQUFBLEVBQVksQ0FBSSxJQUFDLENBQUEsYUFBRCxDQUFBLENBQWhCOzs7UUFFcEIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUVBLElBQUcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLGFBQUosQ0FBQSxDQUFIO1lBRUksVUFBQSxHQUFhLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7WUFDYixhQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQUE7WUFDaEIsU0FBQSxHQUFZO0FBRVo7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBRyxHQUFHLENBQUMsV0FBUDtvQkFDSSxJQUFBLEdBQU8sSUFBQyxDQUFBLGdD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dkI7b0JBQ0ksRUFBQSxHQUFLLFdBQUEsQ0FBWSxHQUFaLEVBRFQ7aUJBQUEsTUFFSyxJQUFHLEdBQUcsQ0FBQyxNQUFKLElBQWUsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQWEsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQWhCLEtBQXNCLENBQXhDO29CQUNELEVBQUEsR0FBSyxXQUFBLENBQVksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQVosRUFESjtpQkFBQSxNQUFBO0FBR0QsMEJBSEM7O1lBTFQ7bUJBU0EsQ0FBQyxFQUFELEVBQUssRUFBTCxFQXJCSjs7SUFIOEIsQ0F2RWxDIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG57IGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aycgXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBcbiAgICBkZWxldGVTZWxlY3Rpb25PckN1cnNvckxpbmVzOiAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaWYgbm90IEBkby5udW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBzZWxlY3RNb3JlTGluZXMoKVxuICAgICAgICBAZGVsZXRlU2VsZWN0aW9uIGRlbGV0ZUxpbmVzOm5vdCBAaXNJbnB1dEN1cnNvcigpXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgZGVsZXRlU2VsZWN0aW9uOiAob3B0ID0gZGVsZXRlTGluZXM6bm90IEBpc0lucHV0Q3Vyc29yKCkpIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIEBkby5udW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgb2xkU2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIGpvaW5MaW5lcyA9IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjIGluIEBkby5jdXJzb3JzKCkucmV2ZXJzZSgpXG4gICAgICAgICAgICAgICAgaWYgb3B0LmRlbGV0ZUxpbmVzXG4gICAgICAgICAgICAgICAgICAgIGNzZWwgPSBAY29udGludW91c1NlbGVjdGlvbkF0UG9zSW5SYW5nZXMgYywgb2xkU2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmcgPSByYW5nZUF0UG9zSW5SYW5nZXMgYywgb2xkU2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiByZz9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNzZWwgPSBbcmFuZ2VTdGFydFBvcyhyZyksIHJhbmdlRW5kUG9zKHJnKV1cbiAgICAgICAgICAgICAgICBpZiBjc2VsP1xuICAgICAgICAgICAgICAgICAgICBbc3AsIGVwXSA9IGNzZWxcbiAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0JldHdlZW5Qb3NBbmRQb3NJblBvc2l0aW9ucyBzcCwgZXAsIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvclNldCBuYywgc3BcbiAgICAgICAgICAgICAgICAgICAgaWYgc3BbMV0gPCBlcFsxXSBhbmQgc3BbMF0gPiAwIGFuZCBlcFswXSA8IEBkby5saW5lKGVwWzFdKS5sZW5ndGggXG4gICAgICAgICAgICAgICAgICAgICAgICAjIHNlbGVjdGlvbiBzcGFucyBtdWx0aXBsZSBsaW5lcyBhbmQgZmlyc3QgYW5kIGxhc3QgbGluZSBhcmUgY3V0XG4gICAgICAgICAgICAgICAgICAgICAgICBqb2luTGluZXMucHVzaCBzcFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0FmdGVyTGluZUNvbEluUG9zaXRpb25zIGVwWzFdLCBlcFswXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgc2V0IGN1cnNvcnMgYWZ0ZXIgc2VsZWN0aW9uIGluIGxhc3Qgam9pbmVkIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JTZXQgbmMsIHNwWzBdK25jWzBdLWVwWzBdLCBzcFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHMgaW4gQGRvLnNlbGVjdGlvbnMoKS5yZXZlcnNlKClcbiAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBzWzBdID49IEBkby5udW1MaW5lcygpXG4gICAgICAgICAgICAgICAgbGluZVNlbGVjdGVkID0gc1sxXVswXSA9PSAwIGFuZCBzWzFdWzFdID09IEBkby5saW5lKHNbMF0pLmxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIGxpbmVTZWxlY3RlZCBhbmQgb3B0LmRlbGV0ZUxpbmVzIGFuZCBAZG8ubnVtTGluZXMoKSA+IDFcbiAgICAgICAgICAgICAgICAgICAgQGRvLmRlbGV0ZSBzWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zIHNbMF0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAwLCAtMSAjIG1vdmUgY3Vyc29ycyBiZWxvdyBkZWxldGVkIGxpbmUgdXBcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIGlmIHNbMF0gPj0gQGRvLm51bUxpbmVzKClcbiAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBzWzBdLCBAZG8ubGluZShzWzBdKS5zcGxpY2Ugc1sxXVswXSwgc1sxXVsxXS1zWzFdWzBdXG4gICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNBZnRlckxpbmVDb2xJblBvc2l0aW9ucyBzWzBdLCBzWzFdWzFdLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgLShzWzFdWzFdLXNbMV1bMF0pICMgbW92ZSBjdXJzb3JzIGFmdGVyIGRlbGV0aW9uIGluIHNhbWUgbGluZSBsZWZ0XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHNbMF0gaW4gam9pbkxpbmVzXG4gICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2Ugc1swXSwgQGRvLmxpbmUoc1swXSkgKyBAZG8ubGluZShzWzBdKzEpXG4gICAgICAgICAgICAgICAgICAgIEBkby5kZWxldGUgc1swXSsxXG4gICAgICAgICAgICAgICAgICAgIGZvciBuYyBpbiBwb3NpdGlvbnNCZWxvd0xpbmVJbmRleEluUG9zaXRpb25zIHNbMF0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIG5jLCAwLCAtMSAjIG1vdmUgY3Vyc29ycyBiZWxvdyBkZWxldGVkIGxpbmUgdXBcbiAgICAgICAgICAgICAgICAgICAgXy5wdWxsIGpvaW5MaW5lcywgc1swXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBlbmRTZWxlY3Rpb24oKVxuICAgICAgICBcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgI1xuICAgICMgcmV0dXJucyBzdGFydCBhbmQgZW5kIHBvc2l0aW9ucyBvZiByYW5nZXMgdGhhdCBoYXZlIGVpdGhlciBubyBjaGFyYWN0ZXJzIG9yIGp1c3QgYSBzaW5nbGUgbmV3bGluZSBiZXR3ZWVuIHRoZW1cblxuICAgIGNvbnRpbnVvdXNTZWxlY3Rpb25BdFBvc0luUmFuZ2VzOiAocCwgc2VsKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHIgPSByYW5nZUF0UG9zSW5SYW5nZXMgcCwgc2VsXG4gICAgICAgIGlmIHIgYW5kIGxlbmd0aE9mUmFuZ2UgclxuICAgICAgICAgICAgc3AgPSByYW5nZVN0YXJ0UG9zIHJcbiAgICAgICAgICAgIHdoaWxlIChzcFswXSA9PSAwKSBhbmQgKHNwWzFdID4gMClcbiAgICAgICAgICAgICAgICBwbHIgPSBAcmFuZ2VGb3JMaW5lQXRJbmRleCBzcFsxXS0xXG4gICAgICAgICAgICAgICAgc2lsID0gcmFuZ2VzQXRMaW5lSW5kZXhJblJhbmdlcyBzcFsxXS0xLCBzZWxcbiAgICAgICAgICAgICAgICBpZiBzaWwubGVuZ3RoID09IDEgYW5kIGlzU2FtZVJhbmdlIHNpbFswXSwgcGxyXG4gICAgICAgICAgICAgICAgICAgIHNwID0gcmFuZ2VTdGFydFBvcyBwbHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNpbC5sZW5ndGggYW5kIF8ubGFzdChzaWwpWzFdWzFdID09IHBsclsxXVsxXVxuICAgICAgICAgICAgICAgICAgICBzcCA9IHJhbmdlU3RhcnRQb3MgXy5sYXN0IHNpbFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGVwID0gcmFuZ2VFbmRQb3MgclxuICAgICAgICAgICAgd2hpbGUgKGVwWzBdID09IEBsaW5lKGVwWzFdKS5sZW5ndGgpIGFuZCAoZXBbMV0gPCBAbnVtTGluZXMoKS0xKVxuICAgICAgICAgICAgICAgIG5sciA9IEByYW5nZUZvckxpbmVBdEluZGV4IGVwWzFdKzFcbiAgICAgICAgICAgICAgICBzaWwgPSByYW5nZXNBdExpbmVJbmRleEluUmFuZ2VzIGVwWzFdKzEsIHNlbFxuICAgICAgICAgICAgICAgIGlmIHNpbC5sZW5ndGggPT0gMSBhbmQgaXNTYW1lUmFuZ2Ugc2lsWzBdLCBubHJcbiAgICAgICAgICAgICAgICAgICAgZXAgPSByYW5nZUVuZFBvcyBubHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHNpbC5sZW5ndGggYW5kIF8uZmlyc3Qoc2lsKVsxXVswXSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGVwID0gcmFuZ2VFbmRQb3MgXy5maXJzdCBzaWxcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFtzcCwgZXBdXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/deleteselection.coffee