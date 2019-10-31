// koffee 1.4.0

/*
000000000   0000000   0000000     0000000
   000     000   000  000   000  000     
   000     000000000  0000000    0000000 
   000     000   000  000   000       000
   000     000   000  0000000    0000000
 */
var $, Tab, Tabs, Term, _, drag, elem, empty, kpos, popup, post, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, empty = ref.empty, valid = ref.valid, slash = ref.slash, popup = ref.popup, elem = ref.elem, drag = ref.drag, kpos = ref.kpos, $ = ref.$, _ = ref._;

Tab = require('./tab');

Term = require('./term');

Tabs = (function() {
    function Tabs(titlebar) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.closeTabs = bind(this.closeTabs, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onClick = bind(this.onClick, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.tabs = [];
        this.div = elem({
            "class": 'tabs'
        });
        titlebar.insertBefore(this.div, $('.minimize'));
        this.div.addEventListener('click', this.onClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        post.on('stash', this.stash);
        post.on('restore', this.restore);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
    }

    Tabs.prototype.stash = function() {
        var paths, ref1, tab;
        paths = (function() {
            var i, len, ref1, results;
            ref1 = this.tabs;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                tab = ref1[i];
                results.push(tab.text);
            }
            return results;
        }).call(this);
        return window.stash.set('tabs', {
            paths: paths,
            active: Math.min((ref1 = this.activeTab()) != null ? ref1.index() : void 0, paths.length - 1)
        });
    };

    Tabs.prototype.restore = function() {
        var active, paths, ref1;
        active = window.stash.get('tabs:active', 0);
        paths = window.stash.get('tabs:paths');
        if (empty(paths)) {
            this.addTab(slash.tilde(process.cwd()));
            return;
        }
        while (paths.length) {
            this.addTab(paths.shift());
        }
        return (ref1 = this.tabs[active]) != null ? ref1.activate() : void 0;
    };

    Tabs.prototype.onClick = function(event) {
        var tab;
        if (tab = this.tab(event.target)) {
            if (event.target.classList.contains('dot')) {
                this.closeTab(tab);
            } else {
                tab.activate();
            }
        }
        return true;
    };

    Tabs.prototype.onDragStart = function(d, e) {
        var br;
        this.dragTab = this.tab(e.target);
        if (!this.dragTab) {
            return 'skip';
        }
        if (event.button !== 1) {
            return 'skip';
        }
        this.dragDiv = this.dragTab.div.cloneNode(true);
        this.dragTab.div.style.opacity = '0';
        br = this.dragTab.div.getBoundingClientRect();
        this.dragDiv.style.position = 'absolute';
        this.dragDiv.style.top = br.top + "px";
        this.dragDiv.style.left = br.left + "px";
        this.dragDiv.style.width = (br.width - 12) + "px";
        this.dragDiv.style.height = (br.height - 3) + "px";
        this.dragDiv.style.flex = 'unset';
        this.dragDiv.style.pointerEvents = 'none';
        return document.body.appendChild(this.dragDiv);
    };

    Tabs.prototype.onDragMove = function(d, e) {
        var tab;
        this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px)";
        if (tab = this.tabAtX(d.pos.x)) {
            if (tab.index() !== this.dragTab.index()) {
                return this.swap(tab, this.dragTab);
            }
        }
    };

    Tabs.prototype.onDragStop = function(d, e) {
        this.dragTab.div.style.opacity = '';
        return this.dragDiv.remove();
    };

    Tabs.prototype.tab = function(id) {
        if (_.isNumber(id)) {
            return this.tabs[id];
        }
        if (_.isElement(id)) {
            return _.find(this.tabs, function(t) {
                return t.div.contains(id);
            });
        }
        if (_.isString(id)) {
            return _.find(this.tabs, function(t) {
                return t.info.text === id;
            });
        }
    };

    Tabs.prototype.activeTab = function() {
        return _.find(this.tabs, function(t) {
            return t.isActive();
        });
    };

    Tabs.prototype.numTabs = function() {
        return this.tabs.length;
    };

    Tabs.prototype.tabAtX = function(x) {
        return _.find(this.tabs, function(t) {
            var br;
            br = t.div.getBoundingClientRect();
            return (br.left <= x && x <= br.left + br.width);
        });
    };

    Tabs.prototype.resized = function() {
        var i, len, ref1, results, tab;
        ref1 = this.tabs;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            results.push(tab.term.resized());
        }
        return results;
    };

    Tabs.prototype.addTab = function(text) {
        var tab;
        tab = new Tab(this, new Term);
        tab.term.tab = tab;
        if (text) {
            tab.update(text);
        }
        this.tabs.push(tab);
        tab.activate();
        post.emit('menuAction', 'Clear');
        return tab;
    };

    Tabs.prototype.closeTab = function(tab) {
        var ref1;
        if (tab == null) {
            tab = this.activeTab();
        }
        if (tab == null) {
            return;
        }
        if (this.tabs.length > 1) {
            if (tab === this.activeTab()) {
                if ((ref1 = tab.nextOrPrev()) != null) {
                    ref1.activate();
                }
            }
        }
        tab.close();
        _.pull(this.tabs, tab);
        if (empty(this.tabs)) {
            post.emit('menuAction', 'Close');
        }
        return this;
    };

    Tabs.prototype.closeOtherTabs = function() {
        var keep;
        if (!this.activeTab()) {
            return;
        }
        keep = _.pullAt(this.tabs, this.activeTab().index());
        while (this.numTabs()) {
            this.tabs.pop().close();
        }
        return this.tabs = keep;
    };

    Tabs.prototype.closeTabs = function() {
        var results;
        results = [];
        while (this.numTabs()) {
            results.push(this.tabs.pop().close());
        }
        return results;
    };

    Tabs.prototype.navigate = function(key) {
        var index;
        index = this.activeTab().index();
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = (this.numTabs() + index) % this.numTabs();
        return this.tabs[index].activate();
    };

    Tabs.prototype.swap = function(ta, tb) {
        var ref1;
        if ((ta == null) || (tb == null)) {
            return;
        }
        if (ta.index() > tb.index()) {
            ref1 = [tb, ta], ta = ref1[0], tb = ref1[1];
        }
        this.tabs[ta.index()] = tb;
        this.tabs[tb.index() + 1] = ta;
        return this.div.insertBefore(tb.div, ta.div);
    };

    Tabs.prototype.move = function(key) {
        var tab;
        tab = this.activeTab();
        switch (key) {
            case 'left':
                return this.swap(tab, tab.prev());
            case 'right':
                return this.swap(tab, tab.next());
        }
    };

    Tabs.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(pos(event)));
    };

    Tabs.prototype.showContextMenu = function(absPos) {
        var opt, tab;
        if (tab = this.tab(event.target)) {
            tab.activate();
        }
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Close Other Tabs',
                    combo: 'ctrl+shift+w'
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    return Tabs;

})();

module.exports = Tabs;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFicy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseUZBQUE7SUFBQTs7QUFRQSxNQUEwRSxPQUFBLENBQVEsS0FBUixDQUExRSxFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixpQkFBbkIsRUFBMEIsaUJBQTFCLEVBQWlDLGlCQUFqQyxFQUF3QyxpQkFBeEMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsZUFBM0QsRUFBaUUsU0FBakUsRUFBb0U7O0FBRXBFLEdBQUEsR0FBTyxPQUFBLENBQVEsT0FBUjs7QUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7SUFFQyxjQUFDLFFBQUQ7Ozs7Ozs7Ozs7UUFFQyxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE1BQU47U0FBTDtRQUVQLFFBQVEsQ0FBQyxZQUFULENBQXNCLElBQUMsQ0FBQSxHQUF2QixFQUE0QixDQUFBLENBQUUsV0FBRixDQUE1QjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBb0MsSUFBQyxDQUFBLE9BQXJDO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixhQUF0QixFQUFvQyxJQUFDLENBQUEsYUFBckM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBa0IsSUFBQyxDQUFBLEtBQW5CO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLEdBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLFdBRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBRlY7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bUJBYU4sYUFBQSxHQUFlLFNBQUMsS0FBRDtlQUFXLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxlQUFELENBQWlCLEdBQUEsQ0FBSSxLQUFKLENBQWpCLENBQWpCO0lBQVg7O21CQUVmLGVBQUEsR0FBaUIsU0FBQyxNQUFEO0FBRWIsWUFBQTtRQUFBLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFELENBQUssS0FBSyxDQUFDLE1BQVgsQ0FBVDtZQUNJLEdBQUcsQ0FBQyxRQUFKLENBQUEsRUFESjs7UUFHQSxJQUFPLGNBQVA7WUFDSSxNQUFBLEdBQVMsSUFBQSxDQUFLLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLElBQW5DLEVBQXlDLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLEdBQXZFLEVBRGI7O1FBR0EsR0FBQSxHQUFNO1lBQUEsS0FBQSxFQUFPO2dCQUNUO29CQUFBLElBQUEsRUFBUSxrQkFBUjtvQkFDQSxLQUFBLEVBQVEsY0FEUjtpQkFEUzthQUFQOztRQVFOLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO1FBQ2YsR0FBRyxDQUFDLENBQUosR0FBUSxNQUFNLENBQUM7ZUFDZixLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7SUFsQmE7Ozs7OztBQW9CckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCBcbiAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwIFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBlbXB0eSwgdmFsaWQsIHNsYXNoLCBwb3B1cCwgZWxlbSwgZHJhZywga3BvcywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5UYWIgID0gcmVxdWlyZSAnLi90YWInXG5UZXJtID0gcmVxdWlyZSAnLi90ZXJtJ1xuXG5jbGFzcyBUYWJzXG4gICAgXG4gICAgQDogKHRpdGxlYmFyKSAtPlxuICAgICAgICBcbiAgICAgICAgQHRhYnMgPSBbXVxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczondGFicydcbiAgICAgICAgXG4gICAgICAgIHRpdGxlYmFyLmluc2VydEJlZm9yZSBAZGl2LCAkICcubWluaW1pemUnXG4gICAgICAgIFxuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJyAgICAgICBAb25DbGlja1xuICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2NvbnRleHRtZW51JyBAb25Db250ZXh0TWVudVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnICAgQHN0YXNoXG4gICAgICAgIHBvc3Qub24gJ3Jlc3RvcmUnIEByZXN0b3JlXG4gICAgICAgIFxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZGl2XG4gICAgICAgICAgICBvblN0YXJ0OiBAb25EcmFnU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdNb3ZlXG4gICAgICAgICAgICBvblN0b3A6ICBAb25EcmFnU3RvcFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcblxuICAgIHN0YXNoOiA9PiBcblxuICAgICAgICBwYXRocyA9ICggdGFiLnRleHQgZm9yIHRhYiBpbiBAdGFicyApXG4gICAgICAgIFxuICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICd0YWJzJywgXG4gICAgICAgICAgICBwYXRoczogIHBhdGhzXG4gICAgICAgICAgICBhY3RpdmU6IE1hdGgubWluIEBhY3RpdmVUYWIoKT8uaW5kZXgoKSwgcGF0aHMubGVuZ3RoLTFcbiAgICBcbiAgICByZXN0b3JlOiA9PlxuICAgICAgICBcbiAgICAgICAgYWN0aXZlID0gd2luZG93LnN0YXNoLmdldCAndGFiczphY3RpdmUnIDBcbiAgICAgICAgcGF0aHMgID0gd2luZG93LnN0YXNoLmdldCAndGFiczpwYXRocydcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IHBhdGhzICMgaGFwcGVucyB3aGVuIGZpcnN0IHdpbmRvdyBvcGVuc1xuICAgICAgICAgICAgQGFkZFRhYiBzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHdoaWxlIHBhdGhzLmxlbmd0aFxuICAgICAgICAgICAgQGFkZFRhYiBwYXRocy5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBAdGFic1thY3RpdmVdPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25DbGljazogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgdGFiID0gQHRhYiBldmVudC50YXJnZXRcbiAgICAgICAgICAgIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ2RvdCdcbiAgICAgICAgICAgICAgICBAY2xvc2VUYWIgdGFiXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGFiLmFjdGl2YXRlKClcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBvbkRyYWdTdGFydDogKGQsIGUpID0+IFxuICAgICAgICBcbiAgICAgICAgIyBpZiBlLmJ1dHRvbiA9PSAyXG4gICAgICAgICAgICAjIEBjbG9zZVRhYiBAdGFiIGUudGFyZ2V0XG4gICAgICAgICAgICAjIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgIFxuICAgICAgICBAZHJhZ1RhYiA9IEB0YWIgZS50YXJnZXRcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAnc2tpcCcgaWYgbm90IEBkcmFnVGFiXG4gICAgICAgIHJldHVybiAnc2tpcCcgaWYgZXZlbnQuYnV0dG9uICE9IDFcbiAgICAgICAgXG4gICAgICAgIEBkcmFnRGl2ID0gQGRyYWdUYWIuZGl2LmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBkcmFnVGFiLmRpdi5zdHlsZS5vcGFjaXR5ID0gJzAnXG4gICAgICAgIGJyID0gQGRyYWdUYWIuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50b3AgID0gXCIje2JyLnRvcH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmxlZnQgPSBcIiN7YnIubGVmdH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLndpZHRoID0gXCIje2JyLndpZHRoLTEyfXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2JyLmhlaWdodC0zfXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUuZmxleCA9ICd1bnNldCdcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIEBkcmFnRGl2XG5cbiAgICBvbkRyYWdNb3ZlOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KVwiXG4gICAgICAgIGlmIHRhYiA9IEB0YWJBdFggZC5wb3MueFxuICAgICAgICAgICAgaWYgdGFiLmluZGV4KCkgIT0gQGRyYWdUYWIuaW5kZXgoKVxuICAgICAgICAgICAgICAgIEBzd2FwIHRhYiwgQGRyYWdUYWJcbiAgICAgICAgXG4gICAgb25EcmFnU3RvcDogKGQsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBkcmFnVGFiLmRpdi5zdHlsZS5vcGFjaXR5ID0gJydcbiAgICAgICAgQGRyYWdEaXYucmVtb3ZlKClcblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICB0YWI6IChpZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIF8uaXNOdW1iZXIgIGlkIHRoZW4gcmV0dXJuIEB0YWJzW2lkXVxuICAgICAgICBpZiBfLmlzRWxlbWVudCBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmRpdi5jb250YWlucyBpZFxuICAgICAgICBpZiBfLmlzU3RyaW5nICBpZCB0aGVuIHJldHVybiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmluZm8udGV4dCA9PSBpZFxuXG4gICAgYWN0aXZlVGFiOiAtPiBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmlzQWN0aXZlKClcbiAgICBudW1UYWJzOiAgIC0+IEB0YWJzLmxlbmd0aFxuICAgIFxuICAgIHRhYkF0WDogKHgpIC0+IFxuICAgICAgICBcbiAgICAgICAgXy5maW5kIEB0YWJzLCAodCkgLT4gXG4gICAgICAgICAgICBiciA9IHQuZGl2LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICBici5sZWZ0IDw9IHggPD0gYnIubGVmdCArIGJyLndpZHRoXG5cbiAgICByZXNpemVkOiAtPiBmb3IgdGFiIGluIEB0YWJzIHRoZW4gdGFiLnRlcm0ucmVzaXplZCgpXG4gICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgXG4gICAgYWRkVGFiOiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRhYiA9IG5ldyBUYWIgQCwgbmV3IFRlcm1cbiAgICAgICAgdGFiLnRlcm0udGFiID0gdGFiXG4gICAgICAgIFxuICAgICAgICBpZiB0ZXh0IHRoZW4gdGFiLnVwZGF0ZSB0ZXh0XG4gICAgICAgICAgICBcbiAgICAgICAgQHRhYnMucHVzaCB0YWJcbiAgICAgICAgdGFiLmFjdGl2YXRlKClcbiAgICAgICAgcG9zdC5lbWl0ICdtZW51QWN0aW9uJyAnQ2xlYXInXG4gICAgICAgIHRhYlxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNsb3NlVGFiOiAodGFiID0gQGFjdGl2ZVRhYigpKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCB0YWI/XG4gICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEB0YWJzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGlmIHRhYiA9PSBAYWN0aXZlVGFiKClcbiAgICAgICAgICAgICAgICB0YWIubmV4dE9yUHJldigpPy5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgdGFiLmNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIF8ucHVsbCBAdGFicywgdGFiXG4gICAgICAgIFxuICAgICAgICBpZiBlbXB0eSBAdGFicyAjIGNsb3NlIHRoZSB3aW5kb3cgd2hlbiBsYXN0IHRhYiB3YXMgY2xvc2VkXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdDbG9zZScgXG4gICAgICAgIFxuICAgICAgICBAXG4gIFxuICAgIGNsb3NlT3RoZXJUYWJzOiAtPiBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGFjdGl2ZVRhYigpXG4gICAgICAgIGtlZXAgPSBfLnB1bGxBdCBAdGFicywgQGFjdGl2ZVRhYigpLmluZGV4KClcbiAgICAgICAgd2hpbGUgQG51bVRhYnMoKVxuICAgICAgICAgICAgQHRhYnMucG9wKCkuY2xvc2UoKVxuICAgICAgICBAdGFicyA9IGtlZXBcbiAgICBcbiAgICBjbG9zZVRhYnM6ID0+XG4gICAgICAgIFxuICAgICAgICB3aGlsZSBAbnVtVGFicygpXG4gICAgICAgICAgICBAdGFicy5wb3AoKS5jbG9zZSgpXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQGFjdGl2ZVRhYigpLmluZGV4KClcbiAgICAgICAgaW5kZXggKz0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gKzFcbiAgICAgICAgaW5kZXggPSAoQG51bVRhYnMoKSArIGluZGV4KSAlIEBudW1UYWJzKClcbiAgICAgICAgQHRhYnNbaW5kZXhdLmFjdGl2YXRlKClcblxuICAgIHN3YXA6ICh0YSwgdGIpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHRhPyBvciBub3QgdGI/XG4gICAgICAgIFt0YSwgdGJdID0gW3RiLCB0YV0gaWYgdGEuaW5kZXgoKSA+IHRiLmluZGV4KClcbiAgICAgICAgQHRhYnNbdGEuaW5kZXgoKV0gICA9IHRiXG4gICAgICAgIEB0YWJzW3RiLmluZGV4KCkrMV0gPSB0YVxuICAgICAgICBAZGl2Lmluc2VydEJlZm9yZSB0Yi5kaXYsIHRhLmRpdlxuICAgIFxuICAgIG1vdmU6IChrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICB0YWIgPSBAYWN0aXZlVGFiKClcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQHN3YXAgdGFiLCB0YWIucHJldigpIFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQHN3YXAgdGFiLCB0YWIubmV4dCgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBwb3MgZXZlbnRcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgdGFiID0gQHRhYiBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRhYi5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Nsb3NlIE90aGVyIFRhYnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3NoaWZ0K3cnIFxuICAgICAgICAjICxcbiAgICAgICAgICAgICMgdGV4dDogICAnTmV3IFdpbmRvdydcbiAgICAgICAgICAgICMgY29tYm86ICAnY3RybCtzaGlmdCtuJyBcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUYWJzXG4iXX0=
//# sourceURL=../coffee/tabs.coffee