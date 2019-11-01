// koffee 1.4.0

/*
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000
 */
var $, BaseEditor, History, Shell, Term, TextEditor, elem, kerror, klog, kpos, post, ref, render, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, kerror = ref.kerror, slash = ref.slash, elem = ref.elem, klog = ref.klog, kpos = ref.kpos, $ = ref.$;

BaseEditor = require('./editor/editor');

TextEditor = require('./editor/texteditor');

render = require('./editor/render');

History = require('./history');

Shell = require('./shell');

Term = (function() {
    function Term() {
        this.scrollBy = bind(this.scrollBy, this);
        this.resized = bind(this.resized, this);
        this.onFontSize = bind(this.onFontSize, this);
        var main;
        main = $('#main');
        this.div = elem({
            "class": 'term'
        });
        main.appendChild(this.div);
        this.num = 0;
        this.rows = 0;
        this.cols = 0;
        this.size = {
            charWidth: 0,
            lineHeight: 0
        };
        this.editor = new TextEditor(this, {
            features: ['Scrollbar', 'Minimap', 'Meta', 'Numbers', 'Autocomplete', 'Brackets', 'Strings', 'CursorLine']
        });
        this.editor.setText('');
        this.shell = new Shell(this);
        this.history = new History(this);
        this.autocomplete = this.editor.autocomplete;
        post.on('fontSize', this.onFontSize);
    }

    Term.prototype.failMeta = function(meta) {
        meta[2].number = {
            text: '✖',
            clss: 'fail'
        };
        meta[2].clss = 'fail';
        return this.editor.meta.update(meta);
    };

    Term.prototype.succMeta = function(meta) {
        meta[2].number = {
            text: '▶',
            clss: 'succ'
        };
        meta[2].clss = 'succ';
        return this.editor.meta.update(meta);
    };

    Term.prototype.insertCmdMeta = function(li, cmd) {
        return this.editor.meta.add({
            line: li,
            clss: 'cmd',
            number: {
                text: '▶',
                clss: 'cmd'
            },
            end: cmd.length + 1,
            click: (function(_this) {
                return function(meta, event) {
                    _this.editor.singleCursorAtEnd();
                    _this.editor.setInputText(_this.editor.line(meta[0]));
                    return _this.shell.execute({
                        cmd: _this.editor.line(meta[0])
                    });
                };
            })(this)
        });
    };

    Term.prototype.moveInputMeta = function() {
        if (this.editor.numLines() - 1 > this.inputMeta[0]) {
            return this.editor.meta.moveLineMeta(this.inputMeta, this.editor.numLines() - 1 - this.inputMeta[0]);
        } else {
            if (this.inputMeta[0] !== this.editor.numLines() - 1) {
                return kerror('input meta not at end?', this.inputMeta[0], this.editor.numLines() - 1);
            }
        }
    };

    Term.prototype.clear = function() {
        this.editor.clear();
        return this.inputMeta = this.editor.meta.add({
            line: 0,
            clss: 'input',
            number: {
                text: '▶'
            },
            click: (function(_this) {
                return function(meta, event) {
                    var pos;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        return klog('input number');
                    } else {
                        return klog('input text?');
                    }
                };
            })(this)
        });
    };

    Term.prototype.onFontSize = function(size) {
        this.editor.setFontSize(size);
        return this.editor.singleCursorAtEnd();
    };

    Term.prototype.resized = function() {
        return this.editor.resized();
    };

    Term.prototype.scrollBy = function(delta) {
        var ref1;
        if (this.autocomplete.list) {
            this.autocomplete.close();
        }
        this.editor.scroll.by(delta);
        if (!((0 < (ref1 = this.editor.scroll.scroll) && ref1 < this.editor.scroll.scrollMax - 1))) {
            return post.emit('stopWheel');
        }
    };

    Term.prototype.pwd = function() {
        var dir;
        dir = slash.tilde(process.cwd());
        this.editor.appendOutput(dir);
        this.editor.meta.add({
            line: Math.max(0, this.editor.numLines() - 2),
            clss: 'pwd',
            number: {
                text: ' ',
                clss: 'pwd'
            },
            end: dir.length + 1,
            click: (function(_this) {
                return function(meta, event) {
                    var i, index, j, next, pos, ref1, ref2;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        index = _this.editor.meta.metas.indexOf(meta);
                        if (index < _this.editor.meta.metas.length - 1) {
                            _this.editor.singleCursorAtPos([0, meta[0]]);
                            if (next = _this.editor.meta.nextMetaOfSameClass(meta)) {
                                for (i = j = ref1 = meta[0], ref2 = next[0]; ref1 <= ref2 ? j < ref2 : j > ref2; i = ref1 <= ref2 ? ++j : --j) {
                                    _this.editor.deleteSelectionOrCursorLines();
                                }
                            }
                            return _this.editor.moveCursorsDown();
                        }
                    } else {
                        _this.editor.singleCursorAtEnd();
                        return _this.shell.cd(_this.editor.line(meta[0]));
                    }
                };
            })(this)
        });
        return true;
    };

    Term.prototype.onEnter = function() {
        if (this.editor.isInputCursor()) {
            if (this.shell.child && this.shell.last.cmd === 'koffee') {
                this.shell.child.stdin.write('\n');
                this.editor.setInputText('');
                return;
            }
            if (this.autocomplete.isListItemSelected()) {
                this.autocomplete.complete({});
            } else if (this.autocomplete.selectedCompletion()) {
                return this.shell.execute({
                    fallback: this.editor.lastLine() + this.autocomplete.selectedCompletion()
                });
            }
            return this.shell.execute({});
        } else {
            return this.editor.singleCursorAtEnd();
        }
    };

    Term.prototype.handleKey = function(mod, key, combo, char, event) {
        switch (combo) {
            case 'enter':
                return this.onEnter();
        }
        if (this.shell.child && this.shell.last.cmd === 'koffee') {
            if (char) {
                switch (key) {
                    case 'backspace':
                        this.shell.child.stdin.write('\x08');
                        break;
                    default:
                        this.shell.child.stdin.write(char);
                }
            } else {
                klog('pipe key', key, combo);
            }
        } else {
            if ('unhandled' !== this.autocomplete.handleModKeyComboEvent(mod, key, combo, event)) {
                return;
            }
            if (this.editor.isInputCursor()) {
                switch (combo) {
                    case 'alt+up':
                        return this.editor.moveCursorsUp();
                    case 'up':
                        return this.history.prev();
                    case 'down':
                        return this.history.next();
                    case 'ctrl+c':
                        return this.shell.handleCancel();
                }
            }
        }
        return 'unhandled';
    };

    return Term;

})();

module.exports = Term;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUdBQUE7SUFBQTs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLGVBQUYsRUFBUSxtQkFBUixFQUFnQixpQkFBaEIsRUFBdUIsZUFBdkIsRUFBNkIsZUFBN0IsRUFBbUMsZUFBbkMsRUFBeUM7O0FBRXpDLFVBQUEsR0FBYSxPQUFBLENBQVEsaUJBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLE9BQUEsR0FBYSxPQUFBLENBQVEsV0FBUjs7QUFDYixLQUFBLEdBQWEsT0FBQSxDQUFRLFNBQVI7O0FBRVA7SUFFQyxjQUFBOzs7O0FBRUMsWUFBQTtRQUFBLElBQUEsR0FBTSxDQUFBLENBQUUsT0FBRjtRQUNOLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxNQUFOO1NBQUw7UUFDUCxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsR0FBbEI7UUFFQSxJQUFDLENBQUEsR0FBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUNJO1lBQUEsU0FBQSxFQUFZLENBQVo7WUFDQSxVQUFBLEVBQVksQ0FEWjs7UUFHSixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksVUFBSixDQUFlLElBQWYsRUFBa0I7WUFBQSxRQUFBLEVBQVMsQ0FDakMsV0FEaUMsRUFFakMsU0FGaUMsRUFHakMsTUFIaUMsRUFJakMsU0FKaUMsRUFLakMsY0FMaUMsRUFNakMsVUFOaUMsRUFPakMsU0FQaUMsRUFRakMsWUFSaUMsQ0FBVDtTQUFsQjtRQVdWLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FB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QUo5QixpQkFESjthQVpKOztlQW1CQTtJQTFCTzs7Ozs7O0FBNEJmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBrZXJyb3IsIHNsYXNoLCBlbGVtLCBrbG9nLCBrcG9zLCAkIH0gPSByZXF1aXJlICdreGsnXG5cbkJhc2VFZGl0b3IgPSByZXF1aXJlICcuL2VkaXRvci9lZGl0b3InXG5UZXh0RWRpdG9yID0gcmVxdWlyZSAnLi9lZGl0b3IvdGV4dGVkaXRvcidcbnJlbmRlciAgICAgPSByZXF1aXJlICcuL2VkaXRvci9yZW5kZXInXG5IaXN0b3J5ICAgID0gcmVxdWlyZSAnLi9oaXN0b3J5J1xuU2hlbGwgICAgICA9IHJlcXVpcmUgJy4vc2hlbGwnXG5cbmNsYXNzIFRlcm1cblxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBtYWluID0kICcjbWFpbidcbiAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6J3Rlcm0nIFxuICAgICAgICBtYWluLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBAbnVtICA9IDAgICBcbiAgICAgICAgQHJvd3MgPSAwXG4gICAgICAgIEBjb2xzID0gMFxuICAgICAgICBAc2l6ZSA9XG4gICAgICAgICAgICBjaGFyV2lkdGg6ICAwXG4gICAgICAgICAgICBsaW5lSGVpZ2h0OiAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvciBALCBmZWF0dXJlczpbXG4gICAgICAgICAgICAnU2Nyb2xsYmFyJ1xuICAgICAgICAgICAgJ01pbmltYXAnXG4gICAgICAgICAgICAnTWV0YSdcbiAgICAgICAgICAgICdOdW1iZXJzJ1xuICAgICAgICAgICAgJ0F1dG9jb21wbGV0ZSdcbiAgICAgICAgICAgICdCcmFja2V0cydcbiAgICAgICAgICAgICdTdHJpbmdzJ1xuICAgICAgICAgICAgJ0N1cnNvckxpbmUnXG4gICAgICAgIF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvci5zZXRUZXh0ICcnXG4gICAgICAgIFxuICAgICAgICBAc2hlbGwgICA9IG5ldyBTaGVsbCBAXG4gICAgICAgIEBoaXN0b3J5ID0gbmV3IEhpc3RvcnkgQFxuICAgICAgICBAYXV0b2NvbXBsZXRlID0gQGVkaXRvci5hdXRvY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdmb250U2l6ZScgQG9uRm9udFNpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmFpbE1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIG1ldGFbMl0ubnVtYmVyID0gdGV4dDon4pyWJyBjbHNzOidmYWlsJ1xuICAgICAgICBtZXRhWzJdLmNsc3MgPSAnZmFpbCdcbiAgICAgICAgQGVkaXRvci5tZXRhLnVwZGF0ZSBtZXRhXG4gICAgICAgIFxuICAgIHN1Y2NNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBtZXRhWzJdLm51bWJlciA9IHRleHQ6J+KWticgY2xzczonc3VjYydcbiAgICAgICAgbWV0YVsyXS5jbHNzID0gJ3N1Y2MnXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBpbnNlcnRDbWRNZXRhOiAobGksIGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGQgXG4gICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJ+KWtidcbiAgICAgICAgICAgICAgICBjbHNzOiAnY21kJ1xuICAgICAgICAgICAgZW5kOiBjbWQubGVuZ3RoKzFcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICAgICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSBjbWQ6QGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICBcbiAgICBtb3ZlSW5wdXRNZXRhOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvci5udW1MaW5lcygpLTEgPiBAaW5wdXRNZXRhWzBdXG4gICAgICAgICAgICBAZWRpdG9yLm1ldGEubW92ZUxpbmVNZXRhIEBpbnB1dE1ldGEsIEBlZGl0b3IubnVtTGluZXMoKS0xLUBpbnB1dE1ldGFbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGlucHV0TWV0YVswXSAhPSBAZWRpdG9yLm51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgIGtlcnJvciAnaW5wdXQgbWV0YSBub3QgYXQgZW5kPycgQGlucHV0TWV0YVswXSwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPiBcbiAgICBcbiAgICAgICAgQGVkaXRvci5jbGVhcigpXG4gICAgICAgIEBpbnB1dE1ldGEgPSBAZWRpdG9yLm1ldGEuYWRkXG4gICAgICAgICAgICBsaW5lOiAwXG4gICAgICAgICAgICBjbHNzOiAnaW5wdXQnXG4gICAgICAgICAgICBudW1iZXI6IHRleHQ6ICfilrYnXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHBvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBwb3MueCA8IDQwXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2lucHV0IG51bWJlcidcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2lucHV0IHRleHQ/J1xuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuICAgIG9uRm9udFNpemU6IChzaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5zZXRGb250U2l6ZSBzaXplXG4gICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBcbiAgICByZXNpemVkOiA9PiBAZWRpdG9yLnJlc2l6ZWQoKVxuICAgIFxuICAgIHNjcm9sbEJ5OiAoZGVsdGEpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYXV0b2NvbXBsZXRlLmxpc3RcbiAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY2xvc2UoKVxuICAgICAgICBAZWRpdG9yLnNjcm9sbC5ieSBkZWx0YVxuICAgICAgICBpZiBub3QgKDAgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXgtMSlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc3RvcFdoZWVsJ1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBwd2Q6IC0+XG4gICAgICAgIFxuICAgICAgICBkaXIgPSBzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IGRpclxuICAgICAgICBAZWRpdG9yLm1ldGEuYWRkXG4gICAgICAgICAgICBsaW5lOiBNYXRoLm1heCAwLCBAZWRpdG9yLm51bUxpbmVzKCktMlxuICAgICAgICAgICAgY2xzczogJ3B3ZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJyAnXG4gICAgICAgICAgICAgICAgY2xzczogJ3B3ZCdcbiAgICAgICAgICAgIGVuZDogZGlyLmxlbmd0aCsxXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHBvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBwb3MueCA8IDQwXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gQGVkaXRvci5tZXRhLm1ldGFzLmluZGV4T2YgbWV0YVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IEBlZGl0b3IubWV0YS5tZXRhcy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCxtZXRhWzBdXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmV4dCA9IEBlZGl0b3IubWV0YS5uZXh0TWV0YU9mU2FtZUNsYXNzIG1ldGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBbbWV0YVswXS4uLm5leHRbMF1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuZGVsZXRlU2VsZWN0aW9uT3JDdXJzb3JMaW5lcygpXG4gICAgICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLm1vdmVDdXJzb3JzRG93bigpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgICAgICAgICAgICAgQHNoZWxsLmNkIEBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uRW50ZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZWRpdG9yLmlzSW5wdXRDdXJzb3IoKVxuICAgICAgICAgICAgaWYgQHNoZWxsLmNoaWxkIGFuZCBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAc2hlbGwuY2hpbGQuc3RkaW4ud3JpdGUgJ1xcbidcbiAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCAnJ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgaWYgQGF1dG9jb21wbGV0ZS5pc0xpc3RJdGVtU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY29tcGxldGUge31cbiAgICAgICAgICAgIGVsc2UgaWYgQGF1dG9jb21wbGV0ZS5zZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZXhlY3V0ZSBmYWxsYmFjazpAZWRpdG9yLmxhc3RMaW5lKCkgKyBAYXV0b2NvbXBsZXRlLnNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSB7fVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBoYW5kbGVLZXk6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3Rlcm0uaGFuZGxlS2V5JyBtb2QsIGtleSwgY29tYm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgdGhlbiByZXR1cm4gQG9uRW50ZXIoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxsLmNoaWxkIGFuZCBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgIGlmIGNoYXJcbiAgICAgICAgICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSAnXFx4MDgnXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSBjaGFyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAncGlwZSBrZXknIGtleSwgY29tYm9cbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBhdXRvY29tcGxldGUuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBlZGl0b3IuaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2FsdCt1cCcgdGhlbiByZXR1cm4gQGVkaXRvci5tb3ZlQ3Vyc29yc1VwKClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICB0aGVuIHJldHVybiBAaGlzdG9yeS5wcmV2KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICB0aGVuIHJldHVybiBAaGlzdG9yeS5uZXh0KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCtjJyB0aGVuIHJldHVybiBAc2hlbGwuaGFuZGxlQ2FuY2VsKClcbiAgICAgICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUZXJtXG4iXX0=
//# sourceURL=../coffee/term.coffee