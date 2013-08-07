



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



// load prereq scripts
// PROBLEM --- need https 
/* 
var s = document.createElement("script");
s.type = "text/javascript";
s.src = "//ivanistheone.github.io/ideacollector/js/vendor/FileSaver.js";
$("head").append(s);

// TODO: submit to cdnjs --
*/



// setup UI
$('body').append('<div id="perseus-diff-ui"> <a href="#" id="perseus-diff-get">get diff</a> </div>' );





var generate_tex = function ( ex_json ){
    var tex = "";
    var idx;

    tex += "\n\n\\section{" + ex_json.id + "}" ;
    tex += "\\url{https://www.khanacademy.org/devadmin/content/items/" + ex_json.id + "}\n\n";
    tex += ex_json.itemData.question.content ;
    tex += "\n\n";
    tex += ex_json.itemData.answerArea.options.content;
    tex += "\n\n";
    for (idx in ex_json.itemData.hints ){
        tex += "\\paragraph{Hint " + (Number(idx)+1)  + "}" ;
        tex += ex_json.itemData.hints[idx].content;
        tex += "\n\n";
    }
    tex += "\n\n";

    return tex;
}




var extract_exercises_as_tex = function () {
    // define vars 
    var idx,            // index into  list_of_urls 
        url,            // 
        html,           // the rar HTML source of the exercise page
        parser,         // an HTML parser 
        dom,            // parsed HTML
        script_list,    // all <script> tags on the exercise --- we want the last one
        data_raw,       // a function closure which calls editItemInit 
        myitem_json,    // where we want the data to go
        data_new,       // a "hack" to put json data into myitem_json
        texdoc="";      // where the final latex source will be stored


    // get list of urls for all exercises on current page
    var list_of_urls =  $("td .simple-button").map( function(){ return $(this).attr('href'); }).get();

    texdoc += "\\documentclass[10pt]{article}\n";
    texdoc += "\\title{Khan exercises}\n"
    texdoc += " \\usepackage{amsmath,hyperref}\n \\usepackage[usenames,dvipsnames]{color}\n \n \\newcommand{\\blue}[1]{{\\color{Blue}#1}} \n \\newcommand{\\purple}[1]{{\\color{Purple}#1}} \n \\newcommand{\\red}[1]{{\\color{Red}#1}} \n \\newcommand{\\green}[1]{{\\color{Green}#1}} \n \\newcommand{\\gray}[1]{{\\color{Gray}#1}} \n\n\n"
    texdoc += "\\begin{document}\n\\maketitle\n\n";

    for( idx in list_of_urls ){

        url = list_of_urls[idx];
        console.log(" processing " + url );

        // extracts the JSON data from an exercise
        html ="";
        $.ajax({ url: url, type: 'get', dataType: 'html', async: false, success: function(data) { html = data; } });
        
        parser = new DOMParser();
        dom = parser.parseFromString( html, "text/html" );
        scripts_list = dom.getElementsByTagName('script');
        data_raw = scripts_list[scripts_list.length-1].innerHTML;
        data_new = data_raw.replace("PerseusAdmin.editItemInit(item);", "myitem_json=item;") ;
        eval(data_new);

        texdoc +=  generate_tex( myitem_json );
        
    }
    texdoc += "\\end{document}\n\n";
    console.log(" done ");

    return texdoc;

}


// fixup  $\begin{align} --> \begin{align}
//              \end{align}$ --> \end{align}
var fixup_aligns = function ( doc ){
    var tmpdoc, tmpdoc2;
    doc = doc.replace( /\$[ ]*\\begin{align[\*]?}/g, "\\begin{align*}" );
    doc = doc.replace( /\\end{align[\*]?}[ ]*\$/g, "\\end{align*}" );

    return doc;
}

