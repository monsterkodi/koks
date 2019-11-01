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
        klog('fail', this.editor.line(meta[0]));
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
        var ref1;
        if ((ref1 = this.shell.last) != null) {
            delete ref1.meta;
        }
        this.editor.clear();
        this.inputMeta = this.editor.meta.add({
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
        return true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsbUdBQUE7SUFBQTs7QUFRQSxNQUErQyxPQUFBLENBQVEsS0FBUixDQUEvQyxFQUFFLGVBQUYsRUFBUSxtQkFBUixFQUFnQixpQkFBaEIsRUFBdUIsZUFBdkIsRUFBNkIsZUFBN0IsRUFBbUMsZUFBbkMsRUFBeUM7O0FBRXpDLFVBQUEsR0FBYSxPQUFBLENBQVEsaUJBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLE9BQUEsR0FBYSxPQUFBLENBQVEsV0FBUjs7QUFDYixLQUFBLEdBQWEsT0FBQSxDQUFRLFNBQVI7O0FBRVA7SUFFQyxjQUFBOzs7O0FBRUMsWUFBQTtRQUFBLElBQUEsR0FBTSxDQUFBLENBQUUsT0FBRjtRQUNOLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxNQUFOO1NBQUw7UUFDUCxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFDLENBQUEsR0FBbEI7UUFFQSxJQUFDLENBQUEsR0FBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUNJO1lBQUEsU0FBQSxFQUFZLENBQVo7WUFDQSxVQUFBLEVBQVksQ0FEWjs7UUFHSixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksVUFBSixDQUFlLElBQWYsRUFBa0I7WUFBQSxRQUFBLEVBQVMsQ0FDakMsV0FEaUMsRUFFakMsU0FGaUMsRUFHakMsTUFIaUMsRUFJakMsU0FKaUMsRUFLakMsY0FMaUMsRUFNakMsVUFOaUMsRUFPakMsU0FQaUMsRUFRakMsWUFSaUMsQ0FBVDtTQUFsQjtRQVdWLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FB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Qix5QkFHUyxNQUhUO0FBR3VCLCtCQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFBO0FBSDlCLHlCQUlTLFFBSlQ7QUFJdUIsK0JBQU8sSUFBQyxDQUFBLEtBQUssQ0FBQyxZQUFQLENBQUE7QUFKOUIsaUJBREo7YUFaSjs7ZUFtQkE7SUExQk87Ozs7OztBQTRCZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwga2Vycm9yLCBzbGFzaCwgZWxlbSwga2xvZywga3BvcywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CYXNlRWRpdG9yID0gcmVxdWlyZSAnLi9lZGl0b3IvZWRpdG9yJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vZWRpdG9yL3RleHRlZGl0b3InXG5yZW5kZXIgICAgID0gcmVxdWlyZSAnLi9lZGl0b3IvcmVuZGVyJ1xuSGlzdG9yeSAgICA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblNoZWxsICAgICAgPSByZXF1aXJlICcuL3NoZWxsJ1xuXG5jbGFzcyBUZXJtXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOid0ZXJtJyBcbiAgICAgICAgbWFpbi5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgQG51bSAgPSAwICAgXG4gICAgICAgIEByb3dzID0gMFxuICAgICAgICBAY29scyA9IDBcbiAgICAgICAgQHNpemUgPVxuICAgICAgICAgICAgY2hhcldpZHRoOiAgMFxuICAgICAgICAgICAgbGluZUhlaWdodDogMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZWRpdG9yID0gbmV3IFRleHRFZGl0b3IgQCwgZmVhdHVyZXM6W1xuICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICdNaW5pbWFwJ1xuICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAnTnVtYmVycydcbiAgICAgICAgICAgICdBdXRvY29tcGxldGUnXG4gICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAnU3RyaW5ncydcbiAgICAgICAgICAgICdDdXJzb3JMaW5lJ1xuICAgICAgICBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgICAgICBcbiAgICAgICAgQHNoZWxsICAgPSBuZXcgU2hlbGwgQFxuICAgICAgICBAaGlzdG9yeSA9IG5ldyBIaXN0b3J5IEBcbiAgICAgICAgQGF1dG9jb21wbGV0ZSA9IEBlZGl0b3IuYXV0b2NvbXBsZXRlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZm9udFNpemUnIEBvbkZvbnRTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGZhaWxNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBrbG9nICdmYWlsJyBAZWRpdG9yLmxpbmUgbWV0YVswXVxuICAgICAgICBtZXRhWzJdLm51bWJlciA9IHRleHQ6J+KclicgY2xzczonZmFpbCdcbiAgICAgICAgbWV0YVsyXS5jbHNzID0gJ2ZhaWwnXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBzdWNjTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgIyBrbG9nICdzdWNjJyBAZWRpdG9yLmxpbmUgbWV0YVswXVxuICAgICAgICBtZXRhWzJdLm51bWJlciA9IHRleHQ6J+KWticgY2xzczonc3VjYydcbiAgICAgICAgbWV0YVsyXS5jbHNzID0gJ3N1Y2MnXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBpbnNlcnRDbWRNZXRhOiAobGksIGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGQgXG4gICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJ+KWtidcbiAgICAgICAgICAgICAgICBjbHNzOiAnY21kJ1xuICAgICAgICAgICAgZW5kOiBjbWQubGVuZ3RoKzFcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICAgICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSBjbWQ6QGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICBcbiAgICBtb3ZlSW5wdXRNZXRhOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvci5udW1MaW5lcygpLTEgPiBAaW5wdXRNZXRhWzBdXG4gICAgICAgICAgICBAZWRpdG9yLm1ldGEubW92ZUxpbmVNZXRhIEBpbnB1dE1ldGEsIEBlZGl0b3IubnVtTGluZXMoKS0xLUBpbnB1dE1ldGFbMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGlucHV0TWV0YVswXSAhPSBAZWRpdG9yLm51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgIGtlcnJvciAnaW5wdXQgbWV0YSBub3QgYXQgZW5kPycgQGlucHV0TWV0YVswXSwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPiBcbiAgICBcbiAgICAgICAgZGVsZXRlIEBzaGVsbC5sYXN0Py5tZXRhXG4gICAgICAgIEBlZGl0b3IuY2xlYXIoKVxuICAgICAgICBAaW5wdXRNZXRhID0gQGVkaXRvci5tZXRhLmFkZFxuICAgICAgICAgICAgbGluZTogMFxuICAgICAgICAgICAgY2xzczogJ2lucHV0J1xuICAgICAgICAgICAgbnVtYmVyOiB0ZXh0OiAn4pa2J1xuICAgICAgICAgICAgY2xpY2s6IChtZXRhLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBwb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgcG9zLnggPCA0MFxuICAgICAgICAgICAgICAgICAgICBrbG9nICdpbnB1dCBudW1iZXInXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBrbG9nICdpbnB1dCB0ZXh0PydcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuICAgIG9uRm9udFNpemU6IChzaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5zZXRGb250U2l6ZSBzaXplXG4gICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBcbiAgICByZXNpemVkOiA9PiBAZWRpdG9yLnJlc2l6ZWQoKVxuICAgIFxuICAgIHNjcm9sbEJ5OiAoZGVsdGEpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYXV0b2NvbXBsZXRlLmxpc3RcbiAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY2xvc2UoKVxuICAgICAgICBAZWRpdG9yLnNjcm9sbC5ieSBkZWx0YVxuICAgICAgICBpZiBub3QgKDAgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXgtMSlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc3RvcFdoZWVsJ1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBwd2Q6IC0+XG4gICAgICAgIFxuICAgICAgICBkaXIgPSBzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IGRpclxuICAgICAgICBAZWRpdG9yLm1ldGEuYWRkXG4gICAgICAgICAgICBsaW5lOiBNYXRoLm1heCAwLCBAZWRpdG9yLm51bUxpbmVzKCktMlxuICAgICAgICAgICAgY2xzczogJ3B3ZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJyAnXG4gICAgICAgICAgICAgICAgY2xzczogJ3B3ZCdcbiAgICAgICAgICAgIGVuZDogZGlyLmxlbmd0aCsxXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHBvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBwb3MueCA8IDQwXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gQGVkaXRvci5tZXRhLm1ldGFzLmluZGV4T2YgbWV0YVxuICAgICAgICAgICAgICAgICAgICBpZiBpbmRleCA8IEBlZGl0b3IubWV0YS5tZXRhcy5sZW5ndGgtMVxuICAgICAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCxtZXRhWzBdXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmV4dCA9IEBlZGl0b3IubWV0YS5uZXh0TWV0YU9mU2FtZUNsYXNzIG1ldGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBbbWV0YVswXS4uLm5leHRbMF1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuZGVsZXRlU2VsZWN0aW9uT3JDdXJzb3JMaW5lcygpXG4gICAgICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLm1vdmVDdXJzb3JzRG93bigpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgICAgICAgICAgICAgQHNoZWxsLmNkIEBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uRW50ZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZWRpdG9yLmlzSW5wdXRDdXJzb3IoKVxuICAgICAgICAgICAgaWYgQHNoZWxsLmNoaWxkIGFuZCBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAc2hlbGwuY2hpbGQuc3RkaW4ud3JpdGUgJ1xcbidcbiAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCAnJ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgaWYgQGF1dG9jb21wbGV0ZS5pc0xpc3RJdGVtU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY29tcGxldGUge31cbiAgICAgICAgICAgIGVsc2UgaWYgQGF1dG9jb21wbGV0ZS5zZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZXhlY3V0ZSBmYWxsYmFjazpAZWRpdG9yLmxhc3RMaW5lKCkgKyBAYXV0b2NvbXBsZXRlLnNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSB7fVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBoYW5kbGVLZXk6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3Rlcm0uaGFuZGxlS2V5JyBtb2QsIGtleSwgY29tYm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgdGhlbiByZXR1cm4gQG9uRW50ZXIoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxsLmNoaWxkIGFuZCBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgIGlmIGNoYXJcbiAgICAgICAgICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2JhY2tzcGFjZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSAnXFx4MDgnXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSBjaGFyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAncGlwZSBrZXknIGtleSwgY29tYm9cbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBhdXRvY29tcGxldGUuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBlZGl0b3IuaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2FsdCt1cCcgdGhlbiByZXR1cm4gQGVkaXRvci5tb3ZlQ3Vyc29yc1VwKClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICB0aGVuIHJldHVybiBAaGlzdG9yeS5wcmV2KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICB0aGVuIHJldHVybiBAaGlzdG9yeS5uZXh0KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCtjJyB0aGVuIHJldHVybiBAc2hlbGwuaGFuZGxlQ2FuY2VsKClcbiAgICAgICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUZXJtXG4iXX0=
//# sourceURL=../coffee/term.coffee