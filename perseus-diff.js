



/*
 * DOMParser HTML extension
 * 2012-09-04
 * 
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
    "use strict";

    var
      DOMParser_proto = DOMParser.prototype
    , real_parseFromString = DOMParser_proto.parseFromString
    ;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {}

    DOMParser_proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            var
              doc = document.implementation.createHTMLDocument("")
            ;
                if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                    doc.documentElement.innerHTML = markup;
                }
                else {
                    doc.body.innerHTML = markup;
                }
            return doc;
        } else {
            return real_parseFromString.apply(this, arguments);
        }
    };
}(DOMParser));







// extracts the JSON data from an exercise
$.get("https://www.khanacademy.org/devadmin/content/items/xd3fd3624", function(data) { html = data; } );
var myitem_json; // store item json data here

var parser = new DOMParser();
var dom = parser.parseFromString( html, "text/html" );
scripts_list = dom.getElementsByTagName('script');
var data_raw = scripts_list[scripts_list.length-1].innerHTML;
var data_new = data_raw.replace("PerseusAdmin.editItemInit(item);", "myitem_json=item;") ;
eval(data_new);
console.log( myitem_json );



// generate latex file


// (manually run latex-diff on command line)

