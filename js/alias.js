// koffee 1.4.0

/*
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000
 */
var Alias, Cmmd, History, empty, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), slash = ref.slash, empty = ref.empty;

Cmmd = require('./cmmd');

History = require('./history');

Alias = (function(superClass) {
    extend(Alias, superClass);

    function Alias() {
        this.alias = {
            a: 'alias',
            c: 'clear',
            cls: 'clear',
            cl: 'c&&l',
            cdl: 'cd $$ && clear && l',
            h: 'history',
            k: 'konrad',
            nl: 'npm ls --depth 0 | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            ng: 'npm ls --depth 0 -g | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            ni: 'npm install && nl',
            na: 'npm install --save $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            nd: 'npm install --save-dev $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            nr: 'npm uninstall --save $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            ks: 'k -s',
            kd: 'k -d',
            kc: 'k -c',
            kb: 'k -b',
            kf: 'k -f',
            kt: 'k -t',
            ku: 'k -u',
            ki: 'k -i',
            kp: 'k -p',
            km: 'k -m',
            kR: 'k -R',
            l: 'color-ls',
            ls: 'color-ls',
            la: 'l -a',
            ll: 'l -l',
            lla: 'l -la',
            e: 'electron .',
            ed: 'e -D',
            ps: 'wmic PROCESS GET Name,ProcessId,ParentProcessId'
        };
        Alias.__super__.constructor.apply(this, arguments);
    }

    Alias.prototype.substitute = function(cmd) {
        var a, alias, i, len, ref1;
        ref1 = Object.keys(this.alias);
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            if (cmd.startsWith(a + ' ')) {
                alias = this.alias[a];
                if (alias.indexOf('$$') >= 0) {
                    return alias.replace('$$', cmd.slice(a.length + 1).trim());
                }
            }
        }
        return cmd;
    };

    Alias.prototype.onCommand = function(cmd) {
        var a, i, len, ref1;
        ref1 = Object.keys(this.alias);
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            if (cmd === a || cmd.startsWith(a + ' ')) {
                return this.shell.enqueue({
                    cmd: this.alias[a] + cmd.slice(a.length),
                    front: true
                });
            }
        }
        if (cmd === 'history' || cmd.startsWith('history ')) {
            return this.histCmd(cmd);
        }
        if (cmd === 'brain' || cmd.startsWith('brain ')) {
            return this.brainCmd(cmd);
        }
        if (cmd === 'alias' || cmd.startsWith('alias ')) {
            return this.aliasCmd(cmd);
        }
        switch (cmd) {
            case 'clear':
                return this.term.clear();
            case 'cwd':
                return this.editor.appendOutput(slash.path(process.cwd()));
            case 'blink':
                return this.editor.toggleBlink();
        }
    };

    Alias.prototype.aliasCmd = function(cmd) {
        var k, ref1, v;
        if (cmd === 'alias') {
            ref1 = this.alias;
            for (k in ref1) {
                v = ref1[k];
                this.editor.appendOutput(k + " " + v);
            }
        }
        return true;
    };

    Alias.prototype.brainCmd = function(cmd) {
        var arg;
        if (cmd === 'brain') {
            window.brain.dump(this.editor);
        } else {
            switch (arg = cmd.slice(6).trim()) {
                case 'clear':
                    window.brain.clear();
            }
        }
        return true;
    };

    Alias.prototype.histCmd = function(cmd) {
        var arg;
        arg = cmd.slice(8).trim();
        if (empty(arg)) {
            arg = 'list';
        }
        switch (arg) {
            case 'clear':
                History.clear();
                break;
            default:
                return this.term.history.cmd(arg);
        }
        return true;
    };

    return Alias;

})(Cmmd);

module.exports = Alias;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxHQUFBLEVBQVEsT0FGUjtZQUdBLEVBQUEsRUFBUSxNQUhSO1lBSUEsR0FBQSxFQUFRLHFCQUpSO1lBS0EsQ0FBQSxFQUFRLFNBTFI7WUFNQSxDQUFBLEVBQVEsUUFOUjtZQU9BLEVBQUEsRUFBUSw4RUFQUjtZQVFBLEVBQUEsRUFBUSxpRkFSUjtZQVNBLEVBQUEsRUFBUSxtQkFUUjtZQVVBLEVBQUEsRUFBUSxtRkFWUjtZQVdBLEVBQUEsRUFBUSx1RkFYUjtZQVlBLEVBQUEsRUFBUSxxRkFaUjtZQWFBLEVBQUEsRUFBUSxNQWJSO1lBY0EsRUFBQSxFQUFRLE1BZFI7WUFlQSxFQUFBLEVBQVEsTUFmUjtZQWdCQSxFQUFBLEVBQVEsTUFoQlI7WUFpQkEsRUFBQSxFQUFRLE1BakJSO1lBa0JBLEVBQUEsRUFBUSxNQWxCUjtZQW1CQSxFQUFBLEVBQVEsTUFuQlI7WUFvQkEsRUFBQSxFQUFRLE1BcEJSO1lBcUJBLEVBQUEsRUFBUSxNQXJCUjtZQXNCQSxFQUFBLEVBQVEsTUF0QlI7WUF1QkEsRUFBQSxFQUFRLE1BdkJSO1lBd0JBLENBQUEsRUFBUSxVQXhCUjtZQXlCQSxFQUFBLEVBQVEsVUF6QlI7WUEwQkEsRUFBQSxFQUFRLE1BMUJSO1lBMkJBLEVBQUEsRUFBUSxNQTNCUjtZQTRCQSxHQUFBLEVBQVEsT0E1QlI7WUE2QkEsQ0FBQSxF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UDtBQUFBLGlCQUNTLE9BRFQ7Z0JBQ3NCLE9BQU8sQ0FBQyxLQUFSLENBQUE7QUFBYjtBQURUO0FBRVMsdUJBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBZCxDQUFrQixHQUFsQjtBQUZoQjtlQUdBO0lBUEs7Ozs7R0EvRU87O0FBd0ZwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgXG4jIyNcblxueyBzbGFzaCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCAgICA9IHJlcXVpcmUgJy4vY21tZCdcbkhpc3RvcnkgPSByZXF1aXJlICcuL2hpc3RvcnknXG5cbmNsYXNzIEFsaWFzIGV4dGVuZHMgQ21tZFxuICAgIFxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAYWxpYXMgPSBcbiAgICAgICAgICAgIGE6ICAgICAgJ2FsaWFzJ1xuICAgICAgICAgICAgYzogICAgICAnY2xlYXInXG4gICAgICAgICAgICBjbHM6ICAgICdjbGVhcidcbiAgICAgICAgICAgIGNsOiAgICAgJ2MmJmwnXG4gICAgICAgICAgICBjZGw6ICAgICdjZCAkJCAmJiBjbGVhciAmJiBsJ1xuICAgICAgICAgICAgaDogICAgICAnaGlzdG9yeSdcbiAgICAgICAgICAgIGs6ICAgICAgJ2tvbnJhZCdcbiAgICAgICAgICAgIG5sOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZzogICAgICducG0gbHMgLS1kZXB0aCAwIC1nIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmk6ICAgICAnbnBtIGluc3RhbGwgJiYgbmwnXG4gICAgICAgICAgICBuYTogICAgICducG0gaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZDogICAgICducG0gaW5zdGFsbCAtLXNhdmUtZGV2ICQkIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBrczogICAgICdrIC1zJ1xuICAgICAgICAgICAga2Q6ICAgICAnayAtZCdcbiAgICAgICAgICAgIGtjOiAgICAgJ2sgLWMnXG4gICAgICAgICAgICBrYjogICAgICdrIC1iJ1xuICAgICAgICAgICAga2Y6ICAgICAnayAtZidcbiAgICAgICAgICAgIGt0OiAgICAgJ2sgLXQnXG4gICAgICAgICAgICBrdTogICAgICdrIC11J1xuICAgICAgICAgICAga2k6ICAgICAnayAtaSdcbiAgICAgICAgICAgIGtwOiAgICAgJ2sgLXAnXG4gICAgICAgICAgICBrbTogICAgICdrIC1tJ1xuICAgICAgICAgICAga1I6ICAgICAnayAtUidcbiAgICAgICAgICAgIGw6ICAgICAgJ2NvbG9yLWxzJ1xuICAgICAgICAgICAgbHM6ICAgICAnY29sb3ItbHMnXG4gICAgICAgICAgICBsYTogICAgICdsIC1hJ1xuICAgICAgICAgICAgbGw6ICAgICAnbCAtbCdcbiAgICAgICAgICAgIGxsYTogICAgJ2wgLWxhJ1xuICAgICAgICAgICAgZTogICAgICAnZWxlY3Ryb24gLidcbiAgICAgICAgICAgIGVkOiAgICAgJ2UgLUQnXG4gICAgICAgICAgICBwczogICAgICd3bWljIFBST0NFU1MgR0VUIE5hbWUsUHJvY2Vzc0lkLFBhcmVudFByb2Nlc3NJZCdcbiAgICAgICAgc3VwZXJcblxuICAgIHN1YnN0aXR1dGU6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICBhbGlhcyA9IEBhbGlhc1thXVxuICAgICAgICAgICAgICAgIGlmIGFsaWFzLmluZGV4T2YoJyQkJykgPj0gMFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxpYXMucmVwbGFjZSAnJCQnIGNtZFthLmxlbmd0aCsxLi5dLnRyaW0oKVxuICAgICAgICBjbWRcbiAgICAgICAgXG4gICAgb25Db21tYW5kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQgPT0gYSBvciBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzaGVsbC5lbnF1ZXVlIGNtZDpAYWxpYXNbYV0gKyBjbWRbYS5sZW5ndGguLl0sIGZyb250OnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnaGlzdG9yeScgb3IgY21kLnN0YXJ0c1dpdGggJ2hpc3RvcnkgJyB0aGVuIHJldHVybiBAaGlzdENtZCAgY21kXG4gICAgICAgIGlmIGNtZCA9PSAnYnJhaW4nICAgb3IgY21kLnN0YXJ0c1dpdGggJ2JyYWluICcgICB0aGVuIHJldHVybiBAYnJhaW5DbWQgY21kXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnICAgb3IgY21kLnN0YXJ0c1dpdGggJ2FsaWFzICcgICB0aGVuIHJldHVybiBAYWxpYXNDbWQgY21kXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjbWRcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyAgIHRoZW4gcmV0dXJuIEB0ZXJtLmNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ2N3ZCcgICAgIHRoZW4gcmV0dXJuIEBlZGl0b3IuYXBwZW5kT3V0cHV0IHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgd2hlbiAnYmxpbmsnICAgdGhlbiByZXR1cm4gQGVkaXRvci50b2dnbGVCbGluaygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGFsaWFzQ21kOiAoY21kKSAtPiAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnXG4gICAgICAgICAgICBmb3Igayx2IG9mIEBhbGlhc1xuICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IFwiI3trfSAje3Z9XCJcbiAgICAgICAgdHJ1ZVxuXG4gICAgYnJhaW5DbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2JyYWluJ1xuICAgICAgICAgICAgd2luZG93LmJyYWluLmR1bXAgQGVkaXRvciAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzd2l0Y2ggYXJnID0gY21kWzYuLl0udHJpbSgpXG4gICAgICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gd2luZG93LmJyYWluLmNsZWFyKClcbiAgICAgICAgdHJ1ZVxuICAgICAgICBcbiAgICBoaXN0Q21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzguLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gSGlzdG9yeS5jbGVhcigpXG4gICAgICAgICAgICBlbHNlIHJldHVybiBAdGVybS5oaXN0b3J5LmNtZCBhcmdcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQWxpYXNcbiJdfQ==
//# sourceURL=../coffee/alias.coffee