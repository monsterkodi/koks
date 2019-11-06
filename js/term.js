// koffee 1.4.0

/*
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000
 */
var $, BaseEditor, History, Shell, Term, TextEditor, elem, klog, kpos, post, ref, render, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, slash = ref.slash, elem = ref.elem, kpos = ref.kpos, klog = ref.klog, $ = ref.$;

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
        this.onChanged = bind(this.onChanged, this);
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
        this.editor.on('changed', this.onChanged);
        this.shell = new Shell(this);
        this.history = new History(this);
        this.autocomplete = this.editor.autocomplete;
        post.on('fontSize', this.onFontSize);
    }

    Term.prototype.addDirMeta = function(dir) {
        return this.editor.meta.add({
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
    };

    Term.prototype.addInputMeta = function() {
        this.inputMeta = this.editor.meta.add({
            line: 0,
            clss: 'input',
            number: {
                text: '▶',
                clss: 'input'
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
        if (this.shell.child) {
            return this.busyInput();
        }
    };

    Term.prototype.busyInput = function() {
        var ref1, ref2;
        if ((ref1 = this.inputMeta[2]) != null) {
            ref1.number.text = '\uf013';
        }
        if ((ref2 = this.inputMeta[2]) != null) {
            ref2.number.clss = 'input busy';
        }
        return this.editor.meta.update(this.inputMeta);
    };

    Term.prototype.resetInput = function() {
        var ref1, ref2;
        if ((ref1 = this.inputMeta[2]) != null) {
            ref1.number.text = '▶';
        }
        if ((ref2 = this.inputMeta[2]) != null) {
            ref2.number.clss = 'input';
        }
        return this.editor.meta.update(this.inputMeta);
    };

    Term.prototype.failMeta = function(meta) {
        this.resetInput();
        meta[2].number = {
            text: '✖',
            clss: 'fail'
        };
        meta[2].clss = 'fail';
        this.editor.minimap.drawLines(meta[0], meta[0]);
        return this.editor.meta.update(meta);
    };

    Term.prototype.succMeta = function(meta) {
        this.resetInput();
        meta[2].number = {
            text: '▶',
            clss: 'succ'
        };
        meta[2].clss = 'succ';
        this.editor.minimap.drawLines(meta[0], meta[0]);
        return this.editor.meta.update(meta);
    };

    Term.prototype.insertCmdMeta = function(li, cmd) {
        this.busyInput();
        return this.editor.meta.add({
            line: li,
            clss: 'cmd',
            number: {
                text: '\uf013',
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
        var oldLine;
        if (this.editor.numLines() - 1 !== this.inputMeta[0]) {
            oldLine = this.inputMeta[0];
            this.editor.meta.moveLineMeta(this.inputMeta, this.editor.numLines() - 1 - this.inputMeta[0]);
            return this.editor.numbers.updateColor(oldLine);
        }
    };

    Term.prototype.onChanged = function(changeInfo) {
        if (changeInfo.changes.length) {
            return this.moveInputMeta();
        }
    };

    Term.prototype.clear = function() {
        var ref1;
        if ((ref1 = this.shell.last) != null) {
            delete ref1.meta;
        }
        this.editor.clear();
        this.addInputMeta();
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
        this.addDirMeta(dir);
        return true;
    };

    Term.prototype.onEnter = function() {
        if (this.editor.isInputCursor()) {
            if (this.shell.child) {
                klog('enter');
                this.shell.child.write('\r');
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
            case 'alt+up':
                return this.editor.moveCursorsUp();
            case 'alt+down':
                return this.editor.moveCursorsDown();
            case 'ctrl+c':
                return this.shell.handleCancel();
        }
        if (this.shell.child) {
            if (char) {
                switch (key) {
                    case 'backspace':
                        this.shell.child.write('\x08');
                        break;
                    default:
                        klog('pipe char', char);
                        this.shell.child.write(char);
                }
                return;
            } else {
                klog('pipe key', key, combo);
            }
        } else {
            if ('unhandled' !== this.autocomplete.handleModKeyComboEvent(mod, key, combo, event)) {
                return;
            }
            if (this.editor.isInputCursor()) {
                switch (combo) {
                    case 'up':
                        return this.history.prev();
                    case 'down':
                        return this.history.next();
                }
            }
        }
        return 'unhandled';
    };

    return Term;

})();

module.exports = Term;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMkZBQUE7SUFBQTs7QUFRQSxNQUF1QyxPQUFBLENBQVEsS0FBUixDQUF2QyxFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsZUFBckIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLFVBQUEsR0FBYSxPQUFBLENBQVEsaUJBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLE9BQUEsR0FBYSxPQUFBLENBQVEsV0FBUjs7QUFDYixLQUFBLEdBQWEsT0FBQSxDQUFRLFNBQVI7O0FBRVA7SUFFQyxjQUFBOzs7OztBQUVDLFlBQUE7UUFBQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7UUFDTixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sTUFBTjtTQUFMO1FBQ1AsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEdBQWxCO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FDSTtZQUFBLFNBQUEsRUFBWSxDQUFaO1lBQ0EsVUFBQSxFQUFZLENBRFo7O1FBR0osSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFVBQUosQ0FBZSxJQUFmLEVBQWtCO1lBQUEsUUFBQSxFQUFTLENBQ2pDLFdBRGlDLEVBRWpDLFNBRmlDLEVBR2pDLE1BSGlDLEVBSWpDLFNBSmlDLEVBS2pDLGNBTGlDLEVBTWpDLFVBTmlDLEVBT2pDLFNBUGlDLEVBUWpDLFlBUmlDLENBQVQ7U0FBbEI7UUFXVixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsRUFBaEI7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QUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgXG4gICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgZWxlbSwga3Bvcywga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5CYXNlRWRpdG9yID0gcmVxdWlyZSAnLi9lZGl0b3IvZWRpdG9yJ1xuVGV4dEVkaXRvciA9IHJlcXVpcmUgJy4vZWRpdG9yL3RleHRlZGl0b3InXG5yZW5kZXIgICAgID0gcmVxdWlyZSAnLi9lZGl0b3IvcmVuZGVyJ1xuSGlzdG9yeSAgICA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblNoZWxsICAgICAgPSByZXF1aXJlICcuL3NoZWxsJ1xuXG5jbGFzcyBUZXJtXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOid0ZXJtJyBcbiAgICAgICAgbWFpbi5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgQG51bSAgPSAwICAgXG4gICAgICAgIEByb3dzID0gMFxuICAgICAgICBAY29scyA9IDBcbiAgICAgICAgQHNpemUgPVxuICAgICAgICAgICAgY2hhcldpZHRoOiAgMFxuICAgICAgICAgICAgbGluZUhlaWdodDogMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZWRpdG9yID0gbmV3IFRleHRFZGl0b3IgQCwgZmVhdHVyZXM6W1xuICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICdNaW5pbWFwJ1xuICAgICAgICAgICAgJ01ldGEnXG4gICAgICAgICAgICAnTnVtYmVycydcbiAgICAgICAgICAgICdBdXRvY29tcGxldGUnXG4gICAgICAgICAgICAnQnJhY2tldHMnXG4gICAgICAgICAgICAnU3RyaW5ncydcbiAgICAgICAgICAgICdDdXJzb3JMaW5lJ1xuICAgICAgICBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgQG9uQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNoZWxsICAgPSBuZXcgU2hlbGwgQFxuICAgICAgICBAaGlzdG9yeSA9IG5ldyBIaXN0b3J5IEBcbiAgICAgICAgQGF1dG9jb21wbGV0ZSA9IEBlZGl0b3IuYXV0b2NvbXBsZXRlXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZm9udFNpemUnIEBvbkZvbnRTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuXG4gICAgYWRkRGlyTWV0YTogKGRpcikgLT5cbiAgICAgICAgQGVkaXRvci5tZXRhLmFkZFxuICAgICAgICAgICAgbGluZTogTWF0aC5tYXggMCwgQGVkaXRvci5udW1MaW5lcygpLTJcbiAgICAgICAgICAgIGNsc3M6ICdwd2QnXG4gICAgICAgICAgICBudW1iZXI6IFxuICAgICAgICAgICAgICAgIHRleHQ6ICcgJ1xuICAgICAgICAgICAgICAgIGNsc3M6ICdwd2QnXG4gICAgICAgICAgICBlbmQ6IGRpci5sZW5ndGgrMVxuICAgICAgICAgICAgY2xpY2s6IChtZXRhLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBwb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgcG9zLnggPCA0MFxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IEBlZGl0b3IubWV0YS5tZXRhcy5pbmRleE9mIG1ldGFcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5kZXggPCBAZWRpdG9yLm1ldGEubWV0YXMubGVuZ3RoLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsbWV0YVswXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5leHQgPSBAZWRpdG9yLm1ldGEubmV4dE1ldGFPZlNhbWVDbGFzcyBtZXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gW21ldGFbMF0uLi5uZXh0WzBdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmRlbGV0ZVNlbGVjdGlvbk9yQ3Vyc29yTGluZXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5tb3ZlQ3Vyc29yc0Rvd24oKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jZCBAZWRpdG9yLmxpbmUgbWV0YVswXVxuXG4gICAgYWRkSW5wdXRNZXRhOiAtPlxuICAgICAgICBcbiAgICAgICAgQGlucHV0TWV0YSA9IEBlZGl0b3IubWV0YS5hZGRcbiAgICAgICAgICAgIGxpbmU6IDBcbiAgICAgICAgICAgIGNsc3M6ICdpbnB1dCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJ+KWtidcbiAgICAgICAgICAgICAgICBjbHNzOiAnaW5wdXQnXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHBvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBwb3MueCA8IDQwXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2lucHV0IG51bWJlcidcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2lucHV0IHRleHQ/J1xuICBcbiAgICAgICAgaWYgQHNoZWxsLmNoaWxkXG4gICAgICAgICAgICBAYnVzeUlucHV0KClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgYnVzeUlucHV0OiAtPlxuXG4gICAgICAgIEBpbnB1dE1ldGFbMl0/Lm51bWJlci50ZXh0ID0gJ1xcdWYwMTMnXG4gICAgICAgIEBpbnB1dE1ldGFbMl0/Lm51bWJlci5jbHNzID0gJ2lucHV0IGJ1c3knXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgQGlucHV0TWV0YVxuICAgICAgICBcbiAgICByZXNldElucHV0OiAtPlxuICAgICAgICBcbiAgICAgICAgQGlucHV0TWV0YVsyXT8ubnVtYmVyLnRleHQgPSAn4pa2J1xuICAgICAgICBAaW5wdXRNZXRhWzJdPy5udW1iZXIuY2xzcyA9ICdpbnB1dCdcbiAgICAgICAgQGVkaXRvci5tZXRhLnVwZGF0ZSBAaW5wdXRNZXRhXG4gICAgXG4gICAgZmFpbE1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIEByZXNldElucHV0KClcbiAgICAgICAgXG4gICAgICAgIG1ldGFbMl0ubnVtYmVyID0gdGV4dDon4pyWJyBjbHNzOidmYWlsJ1xuICAgICAgICBtZXRhWzJdLmNsc3MgPSAnZmFpbCdcbiAgICAgICAgQGVkaXRvci5taW5pbWFwLmRyYXdMaW5lcyBtZXRhWzBdLCBtZXRhWzBdXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBzdWNjTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgQHJlc2V0SW5wdXQoKVxuICAgICAgICBcbiAgICAgICAgbWV0YVsyXS5udW1iZXIgPSB0ZXh0OifilrYnIGNsc3M6J3N1Y2MnXG4gICAgICAgIG1ldGFbMl0uY2xzcyA9ICdzdWNjJ1xuICAgICAgICBAZWRpdG9yLm1pbmltYXAuZHJhd0xpbmVzIG1ldGFbMF0sIG1ldGFbMF1cbiAgICAgICAgQGVkaXRvci5tZXRhLnVwZGF0ZSBtZXRhXG4gICAgICAgIFxuICAgIGluc2VydENtZE1ldGE6IChsaSwgY21kKSAtPlxuXG4gICAgICAgIEBidXN5SW5wdXQoKVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5tZXRhLmFkZCBcbiAgICAgICAgICAgIGxpbmU6IGxpXG4gICAgICAgICAgICBjbHNzOiAnY21kJ1xuICAgICAgICAgICAgbnVtYmVyOiBcbiAgICAgICAgICAgICAgICB0ZXh0OiAnXFx1ZjAxMydcbiAgICAgICAgICAgICAgICBjbHNzOiAnY21kJ1xuICAgICAgICAgICAgZW5kOiBjbWQubGVuZ3RoKzFcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICAgICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSBjbWQ6QGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICBcbiAgICBtb3ZlSW5wdXRNZXRhOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvci5udW1MaW5lcygpLTEgIT0gQGlucHV0TWV0YVswXVxuICAgICAgICAgICAgb2xkTGluZSA9IEBpbnB1dE1ldGFbMF1cbiAgICAgICAgICAgIEBlZGl0b3IubWV0YS5tb3ZlTGluZU1ldGEgQGlucHV0TWV0YSwgQGVkaXRvci5udW1MaW5lcygpLTEtQGlucHV0TWV0YVswXSAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZUNvbG9yIG9sZExpbmVcbiAgICAgICAgICAgIFxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAbW92ZUlucHV0TWV0YSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT4gXG4gICAgXG4gICAgICAgIGRlbGV0ZSBAc2hlbGwubGFzdD8ubWV0YVxuICAgICAgICBAZWRpdG9yLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBhZGRJbnB1dE1ldGEoKVxuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4gICAgb25Gb250U2l6ZTogKHNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnNldEZvbnRTaXplIHNpemVcbiAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgIFxuICAgIHJlc2l6ZWQ6ID0+IEBlZGl0b3IucmVzaXplZCgpXG4gICAgXG4gICAgc2Nyb2xsQnk6IChkZWx0YSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhdXRvY29tcGxldGUubGlzdFxuICAgICAgICAgICAgQGF1dG9jb21wbGV0ZS5jbG9zZSgpXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLmJ5IGRlbHRhXG4gICAgICAgIGlmIG5vdCAoMCA8IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCA8IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heC0xKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdzdG9wV2hlZWwnXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHB3ZDogLT5cbiAgICAgICAgXG4gICAgICAgIGRpciA9IHNsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgZGlyXG4gICAgICAgIEBhZGREaXJNZXRhIGRpclxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbkVudGVyOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvci5pc0lucHV0Q3Vyc29yKClcbiAgICAgICAgICAgIGlmIEBzaGVsbC5jaGlsZCAjYW5kIEBzaGVsbC5sYXN0LmNtZCA9PSAna29mZmVlJ1xuICAgICAgICAgICAgICAgIGtsb2cgJ2VudGVyJ1xuICAgICAgICAgICAgICAgICMgQHNoZWxsLmNoaWxkLnN0ZGluLndyaXRlICdcXG4nXG4gICAgICAgICAgICAgICAgQHNoZWxsLmNoaWxkLndyaXRlICdcXHInXG4gICAgICAgICAgICAgICAgIyBpZiBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCAnJ1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgaWYgQGF1dG9jb21wbGV0ZS5pc0xpc3RJdGVtU2VsZWN0ZWQoKVxuICAgICAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY29tcGxldGUge31cbiAgICAgICAgICAgIGVsc2UgaWYgQGF1dG9jb21wbGV0ZS5zZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZXhlY3V0ZSBmYWxsYmFjazpAZWRpdG9yLmxhc3RMaW5lKCkgKyBAYXV0b2NvbXBsZXRlLnNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBAc2hlbGwuZXhlY3V0ZSB7fVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBoYW5kbGVLZXk6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3Rlcm0uaGFuZGxlS2V5JyBtb2QsIGtleSwgY29tYm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcicgICAgdGhlbiByZXR1cm4gQG9uRW50ZXIoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K3VwJyAgIHRoZW4gcmV0dXJuIEBlZGl0b3IubW92ZUN1cnNvcnNVcCgpXG4gICAgICAgICAgICB3aGVuICdhbHQrZG93bicgdGhlbiByZXR1cm4gQGVkaXRvci5tb3ZlQ3Vyc29yc0Rvd24oKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtjJyAgIHRoZW4gcmV0dXJuIEBzaGVsbC5oYW5kbGVDYW5jZWwoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHNoZWxsLmNoaWxkICMgYW5kIEBzaGVsbC5sYXN0LmNtZCA9PSAna29mZmVlJ1xuICAgICAgICAgICAgaWYgY2hhclxuICAgICAgICAgICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnYmFja3NwYWNlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgIyBAc2hlbGwuY2hpbGQuc3RkaW4ud3JpdGUgJ1xceDA4J1xuICAgICAgICAgICAgICAgICAgICAgICAgQHNoZWxsLmNoaWxkLndyaXRlICdcXHgwOCdcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAga2xvZyAncGlwZSBjaGFyJyBjaGFyXG4gICAgICAgICAgICAgICAgICAgICAgICAjIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSBjaGFyXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGwuY2hpbGQud3JpdGUgY2hhclxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtsb2cgJ3BpcGUga2V5JyBrZXksIGNvbWJvXG4gICAgICAgIGVsc2UgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAYXV0b2NvbXBsZXRlLmhhbmRsZU1vZEtleUNvbWJvRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBldmVudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAZWRpdG9yLmlzSW5wdXRDdXJzb3IoKVxuICAgICAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgICAgICB3aGVuICd1cCcgICAgIHRoZW4gcmV0dXJuIEBoaXN0b3J5LnByZXYoKVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgIHRoZW4gcmV0dXJuIEBoaXN0b3J5Lm5leHQoKVxuICAgICAgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFRlcm1cbiJdfQ==
//# sourceURL=../coffee/term.coffee