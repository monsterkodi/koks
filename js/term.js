// koffee 1.12.0

/*
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000
 */
var $, BaseEditor, History, Shell, Term, TextEditor, elem, klog, kpos, post, ref, render, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, elem = ref.elem, klog = ref.klog, kpos = ref.kpos, post = ref.post, slash = ref.slash;

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
            features: ['Scrollbar', 'Hrzntlbar', 'Minimap', 'Meta', 'Numbers', 'Autocomplete', 'Brackets', 'Strings', 'CursorLine']
        });
        this.editor.setText('');
        this.shell = new Shell(this);
        this.history = new History(this);
        this.autocomplete = this.editor.autocomplete;
        this.editor.on('changed', this.onChanged);
        post.on('fontSize', this.onFontSize);
    }

    Term.prototype.cursorToPrevPwd = function() {
        var meta;
        if (meta = this.editor.meta.prevMetaOfClass('pwd', this.editor.mainCursor()[1])) {
            return this.editor.singleCursorAtPos([0, meta[0]]);
        }
    };

    Term.prototype.cursorToNextPwd = function() {
        var meta;
        if (meta = this.editor.meta.nextMetaOfClass('pwd', this.editor.mainCursor()[1])) {
            return this.editor.singleCursorAtPos([0, meta[0]]);
        }
    };

    Term.prototype.deleteOutputOfPwdMeta = function(meta) {
        var i, index, j, next, ref1, ref2;
        if (meta != null) {
            meta;
        } else {
            meta = this.editor.meta.metaOfClassAtLine('pwd', this.editor.mainCursor()[1]);
        }
        if (!meta) {
            return;
        }
        index = this.editor.meta.metas.indexOf(meta);
        if (index < this.editor.meta.metas.length - 1) {
            this.editor.singleCursorAtPos([0, meta[0]]);
            if (next = this.editor.meta.nextMetaOfSameClass(meta)) {
                for (i = j = ref1 = meta[0], ref2 = next[0]; ref1 <= ref2 ? j < ref2 : j > ref2; i = ref1 <= ref2 ? ++j : --j) {
                    this.editor.deleteSelectionOrCursorLines();
                }
            }
            return this.editor.moveCursorsDown();
        }
    };

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
                    var pos;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        return _this.deleteOutputOfPwdMeta(meta);
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
                    if (meta[2].number.clss === 'input busy') {
                        return _this.shell.handleCancel();
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
        if (!meta) {
            return;
        }
        this.resetInput();
        meta[2].number = {
            text: '✖',
            clss: 'fail'
        };
        meta[2].clss = 'fail';
        this.editor.minimap.drawLines(meta[0], meta[0]);
        return this.editor.meta.update(meta);
    };

    Term.prototype.succMeta = function(meta, lastCode) {
        if (!meta) {
            return;
        }
        this.resetInput();
        if (lastCode === 'busy') {
            meta[2].number = {
                text: '\uf013',
                clss: 'succ busy'
            };
        } else {
            meta[2].number = {
                text: '▶',
                clss: 'succ'
            };
        }
        meta[2].clss = 'succ';
        meta[2].click = (function(_this) {
            return function(meta, event) {
                _this.editor.singleCursorAtEnd();
                _this.editor.setInputText(_this.editor.line(meta[0]));
                return _this.shell.execute({
                    cmd: _this.editor.line(meta[0])
                });
            };
        })(this);
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
                    var pos;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        return _this.shell.handleCancel();
                    } else {
                        return klog('cmd text?');
                    }
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

    Term.prototype.isShell = function() {
        var ref1, ref2, ref3;
        return ((ref1 = this.shell) != null ? ref1.child : void 0) && ((ref2 = (ref3 = this.shell) != null ? ref3.last.cmd.split(' ')[0] : void 0) === 'bash' || ref2 === 'cmd' || ref2 === 'powershell' || ref2 === 'fish');
    };

    Term.prototype.onEnter = function() {
        if (this.editor.isInputCursor()) {
            if (this.isShell()) {
                klog('enter');
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
            case 'alt+up':
                return this.cursorToPrevPwd();
            case 'alt+down':
                return this.cursorToNextPwd();
            case 'alt+delete':
                return this.deleteOutputOfPwdMeta();
            case 'ctrl+c':
                return this.shell.handleCancel();
        }
        if (this.isShell()) {
            if (char) {
                if (key !== 'backspace') {
                    this.shell.child.stdin.write(char);
                } else {
                    this.shell.child.stdin.write('\x08');
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
                    case 'up':
                        return this.history.prev();
                    case 'down':
                        return this.history.next();
                    case 'ctrl+e':
                        return this.editor.moveCursorsAtBoundaryRight();
                }
            }
        }
        return 'unhandled';
    };

    return Term;

})();

module.exports = Term;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbInRlcm0uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJGQUFBO0lBQUE7O0FBUUEsTUFBdUMsT0FBQSxDQUFRLEtBQVIsQ0FBdkMsRUFBRSxTQUFGLEVBQUssZUFBTCxFQUFXLGVBQVgsRUFBaUIsZUFBakIsRUFBdUIsZUFBdkIsRUFBNkI7O0FBRTdCLFVBQUEsR0FBYSxPQUFBLENBQVEsaUJBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLE9BQUEsR0FBYSxPQUFBLENBQVEsV0FBUjs7QUFDYixLQUFBLEdBQWEsT0FBQSxDQUFRLFNBQVI7O0FBR1A7SUFFQyxjQUFBOzs7OztBQUVDLFlBQUE7UUFBQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7UUFDTixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sTUFBTjtTQUFMO1FBQ1AsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEdBQWxCO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FDSTtZQUFBLFNBQUEsRUFBWSxDQUFaO1lBQ0EsVUFBQSxFQUFZLENBRFo7O1FBR0osSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFVBQUosQ0FBZSxJQUFmLEVBQWtCO1lBQUEsUUFBQSxFQUFTLENBQ2pDLFdBRGlDLEVBRWpDLFdBRmlDLEVBR2pDLFNBSGlDLEVBSWpDLE1BSmlDLEVBS2pDLFNBTGlDLEVBTWpDLGNBTmlDLEVBT2pDLFVBUGlDLEVBUWpDLFNBUmlDLEVBU2pDLFlBVGlDLENBQVQ7U0FBbEI7UUFZVixJQUFDLENB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Q0FBQyxLQUFLLENBQUMsS0FBbkIsQ0FBeUIsSUFBekIsRUFESjtpQkFBQSxNQUFBO29CQUdJLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFuQixDQUF5QixNQUF6QixFQUhKO2lCQURKO2FBQUEsTUFBQTtnQkFNSSxJQUFBLENBQUssVUFBTCxFQUFnQixHQUFoQixFQUFxQixLQUFyQixFQU5KO2FBRFI7U0FBQSxNQUFBO1lBVUksSUFBVSxXQUFBLEtBQWUsSUFBQyxDQUFBLFlBQVksQ0FBQyxzQkFBZCxDQUFxQyxHQUFyQyxFQUEwQyxHQUExQyxFQUErQyxLQUEvQyxFQUFzRCxLQUF0RCxDQUF6QjtBQUFBLHVCQUFBOztZQUVBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBSDtBQUNJLHdCQUFPLEtBQVA7QUFBQSx5QkFDUyxJQURUO0FBQ3VCLCtCQUFPLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFBO0FBRDlCLHlCQUVTLE1BRlQ7QUFFdUIsK0JBQU8sSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQUE7QUFGOUIseUJBR1MsUUFIVDtBQUd1QiwrQkFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQUE7QUFIOUIsaUJBREo7YUFaSjs7ZUFrQkE7SUFoQ087Ozs7OztBQWtDZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgJCwgZWxlbSwga2xvZywga3BvcywgcG9zdCwgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuQmFzZUVkaXRvciA9IHJlcXVpcmUgJy4vZWRpdG9yL2VkaXRvcidcblRleHRFZGl0b3IgPSByZXF1aXJlICcuL2VkaXRvci90ZXh0ZWRpdG9yJ1xucmVuZGVyICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yL3JlbmRlcidcbkhpc3RvcnkgICAgPSByZXF1aXJlICcuL2hpc3RvcnknXG5TaGVsbCAgICAgID0gcmVxdWlyZSAnLi9zaGVsbCdcbiMgUFRZICAgICAgICA9IHJlcXVpcmUgJy4vcHR5J1xuXG5jbGFzcyBUZXJtXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOid0ZXJtJyBcbiAgICAgICAgbWFpbi5hcHBlbmRDaGlsZCBAZGl2XG5cbiAgICAgICAgQG51bSAgPSAwICAgXG4gICAgICAgIEByb3dzID0gMFxuICAgICAgICBAY29scyA9IDBcbiAgICAgICAgQHNpemUgPVxuICAgICAgICAgICAgY2hhcldpZHRoOiAgMFxuICAgICAgICAgICAgbGluZUhlaWdodDogMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZWRpdG9yID0gbmV3IFRleHRFZGl0b3IgQCwgZmVhdHVyZXM6W1xuICAgICAgICAgICAgJ1Njcm9sbGJhcidcbiAgICAgICAgICAgICdIcnpudGxiYXInXG4gICAgICAgICAgICAnTWluaW1hcCdcbiAgICAgICAgICAgICdNZXRhJ1xuICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAnQXV0b2NvbXBsZXRlJ1xuICAgICAgICAgICAgJ0JyYWNrZXRzJ1xuICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAnQ3Vyc29yTGluZSdcbiAgICAgICAgXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZWRpdG9yLnNldFRleHQgJydcblxuICAgICAgICBAc2hlbGwgICA9IG5ldyBTaGVsbCBAXG4gICAgICAgICMgQHB0eSAgICAgPSBuZXcgUFRZIEBcbiAgICAgICAgQGhpc3RvcnkgPSBuZXcgSGlzdG9yeSBAXG4gICAgICAgIEBhdXRvY29tcGxldGUgPSBAZWRpdG9yLmF1dG9jb21wbGV0ZVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgQG9uQ2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnZm9udFNpemUnIEBvbkZvbnRTaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuXG4gICAgY3Vyc29yVG9QcmV2UHdkOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbWV0YSA9IEBlZGl0b3IubWV0YS5wcmV2TWV0YU9mQ2xhc3MgJ3B3ZCcgQGVkaXRvci5tYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsbWV0YVswXV1cblxuICAgIGN1cnNvclRvTmV4dFB3ZDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG1ldGEgPSBAZWRpdG9yLm1ldGEubmV4dE1ldGFPZkNsYXNzICdwd2QnIEBlZGl0b3IubWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLG1ldGFbMF1dXG4gICAgICAgICAgICBcbiAgICBkZWxldGVPdXRwdXRPZlB3ZE1ldGE6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgbWV0YSA/PSBAZWRpdG9yLm1ldGEubWV0YU9mQ2xhc3NBdExpbmUgJ3B3ZCcgQGVkaXRvci5tYWluQ3Vyc29yKClbMV1cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBtZXRhXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBlZGl0b3IubWV0YS5tZXRhcy5pbmRleE9mIG1ldGFcbiAgICAgICAgaWYgaW5kZXggPCBAZWRpdG9yLm1ldGEubWV0YXMubGVuZ3RoLTFcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsbWV0YVswXV1cbiAgICAgICAgICAgIGlmIG5leHQgPSBAZWRpdG9yLm1ldGEubmV4dE1ldGFPZlNhbWVDbGFzcyBtZXRhXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW21ldGFbMF0uLi5uZXh0WzBdXVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmRlbGV0ZVNlbGVjdGlvbk9yQ3Vyc29yTGluZXMoKVxuICAgICAgICAgICAgQGVkaXRvci5tb3ZlQ3Vyc29yc0Rvd24oKVxuICAgICAgICAgICAgXG4gICAgYWRkRGlyTWV0YTogKGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGRcbiAgICAgICAgICAgIGxpbmU6IE1hdGgubWF4IDAsIEBlZGl0b3IubnVtTGluZXMoKS0yXG4gICAgICAgICAgICBjbHNzOiAncHdkJ1xuICAgICAgICAgICAgbnVtYmVyOiBcbiAgICAgICAgICAgICAgICB0ZXh0OiAnICdcbiAgICAgICAgICAgICAgICBjbHNzOiAncHdkJ1xuICAgICAgICAgICAgZW5kOiBkaXIubGVuZ3RoKzFcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcG9zID0ga3BvcyBldmVudFxuICAgICAgICAgICAgICAgIGlmIHBvcy54IDwgNDBcbiAgICAgICAgICAgICAgICAgICAgQGRlbGV0ZU91dHB1dE9mUHdkTWV0YSBtZXRhXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgICAgICAgICAgICAgQHNoZWxsLmNkIEBlZGl0b3IubGluZSBtZXRhWzBdXG5cbiAgICBhZGRJbnB1dE1ldGE6IC0+XG4gICAgICAgIFxuICAgICAgICBAaW5wdXRNZXRhID0gQGVkaXRvci5tZXRhLmFkZFxuICAgICAgICAgICAgbGluZTogMFxuICAgICAgICAgICAgY2xzczogJ2lucHV0J1xuICAgICAgICAgICAgbnVtYmVyOiBcbiAgICAgICAgICAgICAgICB0ZXh0OiAn4pa2J1xuICAgICAgICAgICAgICAgIGNsc3M6ICdpbnB1dCdcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgaWYgbWV0YVsyXS5udW1iZXIuY2xzcyA9PSAnaW5wdXQgYnVzeSdcbiAgICAgICAgICAgICAgICAgICAgQHNoZWxsLmhhbmRsZUNhbmNlbCgpXG4gIFxuICAgICAgICBpZiBAc2hlbGwuY2hpbGRcbiAgICAgICAgICAgIEBidXN5SW5wdXQoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBidXN5SW5wdXQ6IC0+XG5cbiAgICAgICAgQGlucHV0TWV0YVsyXT8ubnVtYmVyLnRleHQgPSAnXFx1ZjAxMydcbiAgICAgICAgQGlucHV0TWV0YVsyXT8ubnVtYmVyLmNsc3MgPSAnaW5wdXQgYnVzeSdcbiAgICAgICAgQGVkaXRvci5tZXRhLnVwZGF0ZSBAaW5wdXRNZXRhXG4gICAgICAgIFxuICAgIHJlc2V0SW5wdXQ6IC0+XG4gICAgICAgIFxuICAgICAgICBAaW5wdXRNZXRhWzJdPy5udW1iZXIudGV4dCA9ICfilrYnXG4gICAgICAgIEBpbnB1dE1ldGFbMl0/Lm51bWJlci5jbHNzID0gJ2lucHV0J1xuICAgICAgICBAZWRpdG9yLm1ldGEudXBkYXRlIEBpbnB1dE1ldGFcbiAgICBcbiAgICBmYWlsTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBtZXRhXG4gICAgICAgIFxuICAgICAgICBAcmVzZXRJbnB1dCgpXG4gICAgICAgIFxuICAgICAgICBtZXRhWzJdLm51bWJlciA9IHRleHQ6J+KclicgY2xzczonZmFpbCdcbiAgICAgICAgbWV0YVsyXS5jbHNzID0gJ2ZhaWwnXG4gICAgICAgIEBlZGl0b3IubWluaW1hcC5kcmF3TGluZXMgbWV0YVswXSwgbWV0YVswXVxuICAgICAgICBAZWRpdG9yLm1ldGEudXBkYXRlIG1ldGFcbiAgICAgICAgXG4gICAgc3VjY01ldGE6IChtZXRhLCBsYXN0Q29kZSkgLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IG1ldGFcblxuICAgICAgICBAcmVzZXRJbnB1dCgpXG4gICAgICAgIFxuICAgICAgICBpZiBsYXN0Q29kZSA9PSAnYnVzeSdcbiAgICAgICAgICAgIG1ldGFbMl0ubnVtYmVyID0gXG4gICAgICAgICAgICAgICAgdGV4dDogJ1xcdWYwMTMnXG4gICAgICAgICAgICAgICAgY2xzczogJ3N1Y2MgYnVzeSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWV0YVsyXS5udW1iZXIgPSB0ZXh0OifilrYnIGNsc3M6J3N1Y2MnXG4gICAgICAgIG1ldGFbMl0uY2xzcyA9ICdzdWNjJ1xuICAgICAgICBcbiAgICAgICAgbWV0YVsyXS5jbGljayA9IChtZXRhLCBldmVudCkgPT5cbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICAgICAgICAgIEBzaGVsbC5leGVjdXRlIGNtZDpAZWRpdG9yLmxpbmUgbWV0YVswXVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5taW5pbWFwLmRyYXdMaW5lcyBtZXRhWzBdLCBtZXRhWzBdXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBpbnNlcnRDbWRNZXRhOiAobGksIGNtZCkgLT5cblxuICAgICAgICBAYnVzeUlucHV0KClcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGQgXG4gICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJ1xcdWYwMTMnXG4gICAgICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIGVuZDogY21kLmxlbmd0aCsxXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIHBvcyA9IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBwb3MueCA8IDQwXG4gICAgICAgICAgICAgICAgICAgIEBzaGVsbC5oYW5kbGVDYW5jZWwoKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAga2xvZyAnY21kIHRleHQ/JyAgICAgICAgICAgICAgICBcbiAgICBcbiAgICBtb3ZlSW5wdXRNZXRhOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGVkaXRvci5udW1MaW5lcygpLTEgIT0gQGlucHV0TWV0YVswXVxuICAgICAgICAgICAgb2xkTGluZSA9IEBpbnB1dE1ldGFbMF1cbiAgICAgICAgICAgIEBlZGl0b3IubWV0YS5tb3ZlTGluZU1ldGEgQGlucHV0TWV0YSwgQGVkaXRvci5udW1MaW5lcygpLTEtQGlucHV0TWV0YVswXSAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZUNvbG9yIG9sZExpbmVcbiAgICAgICAgICAgIFxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAbW92ZUlucHV0TWV0YSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogLT4gXG4gICAgXG4gICAgICAgIGRlbGV0ZSBAc2hlbGwubGFzdD8ubWV0YVxuICAgICAgICBAZWRpdG9yLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBhZGRJbnB1dE1ldGEoKVxuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4gICAgb25Gb250U2l6ZTogKHNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnNldEZvbnRTaXplIHNpemVcbiAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgIFxuICAgIHJlc2l6ZWQ6ID0+IEBlZGl0b3IucmVzaXplZCgpXG4gICAgXG4gICAgc2Nyb2xsQnk6IChkZWx0YSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhdXRvY29tcGxldGUubGlzdFxuICAgICAgICAgICAgQGF1dG9jb21wbGV0ZS5jbG9zZSgpXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLmJ5IGRlbHRhXG4gICAgICAgIGlmIG5vdCAoMCA8IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCA8IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heC0xKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdzdG9wV2hlZWwnXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHB3ZDogLT5cbiAgICAgICAgXG4gICAgICAgIGRpciA9IHNsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgZGlyXG4gICAgICAgIEBhZGREaXJNZXRhIGRpclxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBpc1NoZWxsOiAtPiBAc2hlbGw/LmNoaWxkIGFuZCBAc2hlbGw/Lmxhc3QuY21kLnNwbGl0KCcgJylbMF0gaW4gWydiYXNoJyAnY21kJyAncG93ZXJzaGVsbCcgJ2Zpc2gnXVxuICAgIFxuICAgIG9uRW50ZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAZWRpdG9yLmlzSW5wdXRDdXJzb3IoKVxuICAgICAgICAgICAgaWYgQGlzU2hlbGwoKVxuICAgICAgICAgICAgICAgIGtsb2cgJ2VudGVyJ1xuICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSAnXFxuJ1xuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0ICcnXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBpZiBAYXV0b2NvbXBsZXRlLmlzTGlzdEl0ZW1TZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgQGF1dG9jb21wbGV0ZS5jb21wbGV0ZSB7fVxuICAgICAgICAgICAgZWxzZSBpZiBAYXV0b2NvbXBsZXRlLnNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzaGVsbC5leGVjdXRlIGZhbGxiYWNrOkBlZGl0b3IubGFzdExpbmUoKSArIEBhdXRvY29tcGxldGUuc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIEBzaGVsbC5leGVjdXRlIHt9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGhhbmRsZUtleTogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+ICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAndGVybS5oYW5kbGVLZXknIG1vZCwga2V5LCBjb21ib1xuICAgICAgICBcbiAgICAgICAgIyBAcHR5LmhhbmRsZUtleSBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG4gICAgICAgICMgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZW50ZXInICAgICAgdGhlbiByZXR1cm4gQG9uRW50ZXIoKVxuICAgICAgICAgICAgd2hlbiAnYWx0K3VwJyAgICAgdGhlbiByZXR1cm4gQGN1cnNvclRvUHJldlB3ZCgpXG4gICAgICAgICAgICB3aGVuICdhbHQrZG93bicgICB0aGVuIHJldHVybiBAY3Vyc29yVG9OZXh0UHdkKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtkZWxldGUnIHRoZW4gcmV0dXJuIEBkZWxldGVPdXRwdXRPZlB3ZE1ldGEoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtjJyAgICAgdGhlbiByZXR1cm4gQHNoZWxsLmhhbmRsZUNhbmNlbCgpXG4gICAgICAgIFxuICAgICAgICBpZiBAaXNTaGVsbCgpXG4gICAgICAgICAgICAgICAgaWYgY2hhclxuICAgICAgICAgICAgICAgICAgICBpZiBrZXkgbm90IGluIFsnYmFja3NwYWNlJ11cbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSBjaGFyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSAnXFx4MDgnXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBrbG9nICdwaXBlIGtleScga2V5LCBjb21ib1xuICAgICAgICAgICAgICAgICAgICAjIHJldHVyblxuICAgICAgICBlbHNlICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQGF1dG9jb21wbGV0ZS5oYW5kbGVNb2RLZXlDb21ib0V2ZW50IG1vZCwga2V5LCBjb21ibywgZXZlbnRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQGVkaXRvci5pc0lucHV0Q3Vyc29yKClcbiAgICAgICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICB0aGVuIHJldHVybiBAaGlzdG9yeS5wcmV2KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICB0aGVuIHJldHVybiBAaGlzdG9yeS5uZXh0KClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCtlJyB0aGVuIHJldHVybiBAZWRpdG9yLm1vdmVDdXJzb3JzQXRCb3VuZGFyeVJpZ2h0KClcbiAgICAgICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUZXJtXG4iXX0=
//# sourceURL=../coffee/term.coffee