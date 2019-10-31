// koffee 1.4.0

/*
 0000000  00     00  00     00  0000000    
000       000   000  000   000  000   000  
000       000000000  000000000  000   000  
000       000 0 000  000 0 000  000   000  
 0000000  000   000  000   000  0000000
 */
var Cmmd, klog, post, ref;

ref = require('kxk'), post = ref.post, klog = ref.klog;

Cmmd = (function() {
    function Cmmd(shell) {
        this.shell = shell;
        this.term = this.shell.term;
        this.editor = this.term.editor;
    }

    Cmmd.prototype.onCommand = function(cmd) {
        return klog('unhandled cmd', cmd);
    };

    Cmmd.prototype.newLine = function() {
        this.editor.appendText('');
        return true;
    };

    Cmmd.prototype.clearLine = function() {
        this.editor.deleteToEndOfLineOrWholeLine();
        return true;
    };

    return Cmmd;

})();

module.exports = Cmmd;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY21tZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBaUIsT0FBQSxDQUFRLEtBQVIsQ0FBakIsRUFBRSxlQUFGLEVBQVE7O0FBRUY7SUFFQyxjQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsUUFBRDtRQUNBLElBQUMsQ0FBQSxJQUFELEdBQVUsSUFBQyxDQUFBLEtBQUssQ0FBQztRQUNqQixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxJQUFJLENBQUM7SUFGakI7O21CQUlILFNBQUEsR0FBVyxTQUFDLEdBQUQ7ZUFBUyxJQUFBLENBQUssZUFBTCxFQUFxQixHQUFyQjtJQUFUOzttQkFFWCxPQUFBLEdBQVMsU0FBQTtRQUVMLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFtQixFQUFuQjtlQUNBO0lBSEs7O21CQUtULFNBQUEsR0FBVyxTQUFBO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyw0QkFBUixDQUFBO2VBQ0E7SUFITzs7Ozs7O0FBS2YsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiMjI1xuXG57IHBvc3QsIGtsb2cgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgQ21tZFxuXG4gICAgQDogKEBzaGVsbCkgLT4gXG4gICAgICAgIEB0ZXJtICAgPSBAc2hlbGwudGVybVxuICAgICAgICBAZWRpdG9yID0gQHRlcm0uZWRpdG9yXG4gICAgICAgIFxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT4ga2xvZyAndW5oYW5kbGVkIGNtZCcgY21kXG4gICAgICAgICAgICAgICAgXG4gICAgbmV3TGluZTogLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kVGV4dCAnJ1xuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGNsZWFyTGluZTogLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuZGVsZXRlVG9FbmRPZkxpbmVPcldob2xlTGluZSgpXG4gICAgICAgIHRydWVcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENtbWRcbiJdfQ==
//# sourceURL=../coffee/cmmd.coffee