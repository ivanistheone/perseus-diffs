


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
//$('body').append('<div id="perseus-diff-ui"> <a href="#" id="perseus-diff-get">get diff</a> </div>' );


// generate a latex section with exercise content
var generate_tex = function ( ex_json, figures ){
    var tex = "";
    var idx;

    tex += "\n\n\\section{\\href{https://www.khanacademy.org/devadmin/content/items/" + ex_json.id + "}{" + ex_json.id + "}"  +"}\n\n" ;
    tex += "\\noindent\n" + handle_graphics( ex_json.itemData.question.content, figures);
    tex += "\n\n";
    tex += "\\paragraph{Ans}" + ex_json.itemData.answerArea.options.content;
    if ( ex_json.itemData.answerArea.options.widgets["expression 1"] ){
        tex += " " + ex_json.itemData.answerArea.options.widgets["expression 1"].options.value;
    }
    tex += "\n\n";
    for (idx in ex_json.itemData.hints ){
        tex += "\\paragraph{Hint " + (Number(idx)+1)  + "}" ;
        tex += handle_graphics( ex_json.itemData.hints[idx].content, figures);
        tex += "\n\n";
    }
    tex += "\n\n";
    
    // metadata
    tex += "\\medskip\n\\noindent\n";
    tex += "\\textbf{Tags:} {\\footnotesize " + ex_json.tags_parsed.join(", ") + "}\\\\\n";
    tex += "\\textbf{Version:} "+ ex_json.revisionData[0].sha.substring(0,8) + ".. " + ex_json.revisionData[0].creationDate + "\n";
    tex += "\\smallskip\\hrule\n\n\n\n";

    return tex;
}


//  replaces 
var handle_graphics = function (text, figures) {

    var image_re = /\!\[.*?\]\((.*?)\)/g;  
    
    text = text.replace( image_re, function ($0,$1) {        // $1 is the url of the img
        var list,
            filename;

        list = $1.split("/");
        filename = list[list.length-1];
        figures[filename] = $1; 
        return "\\includegraphics[scale=\\shrinkfactor]{figures/" + filename + "}";
    });

    return text;


}

// fixup  $\begin{align} --> \begin{align} //              \end{align}$ --> \end{align}
var fixup_aligns = function ( doc ){
    var tmpdoc, tmpdoc2;
    doc = doc.replace( /\$[ ]*\\begin{align[\*]?}/g, "\\begin{align*}" );
    doc = doc.replace( /\\end{align[\*]?}[ ]*\$/g, "\\end{align*}" );

    return doc;
}


// extracts the JSON data for an exercise url
var fetch_exercise_json = function ( ex_url ){
    var html,           // the rar HTML source of the exercise page
        parser,         // an HTML parser 
        $dom,           // parsed HTML
        script_list,    // all <script> tags on the exercise --- we want the last one
        data_raw,       // a function closure which calls editItemInit 
        myitem_json,    // where we want the data to go
        data_new,       // a "hack" to put json data into myitem_json
        idx,            // loop idx for tags
        tag_id,         // long tag id tag 
        tag_name;       // human readable tag name

    html ="";
    $.ajax({ url: ex_url, type: 'get', dataType: 'html', async: false, success: function(data) { html = data; } });
    
    $dom =  $(html);
    scripts_list = $dom.filter('script').get();
    data_raw = scripts_list[scripts_list.length-1].innerHTML;
    data_new = data_raw.replace("PerseusAdmin.editItemInit(item);", "myitem_json=item;") ;
    eval(data_new);

    // parse tags into usable strings
    myitem_json["tags_parsed"] = [];
    for (idx in myitem_json.tags ) {
        if( myitem_json.tags.hasOwnProperty(idx) ){
            tag_id = myitem_json.tags[idx];
            tag_name = $dom.find('#ai-tag-filter-container').find("[value='" + tag_id +"']").text();
            myitem_json["tags_parsed"].push( tag_name.replace("Math.", "") );
        }
    }

    return myitem_json;

}

var extract_exercises_as_tex = function ( list_of_tag_names ) {
// define vars 
    var idx,idx2,           // indices into lists of urls
        url,                // 
        ex_json,            // the json repr. of an exercise
        texdoc="",          // where the final latex source will be stored
        list_of_urls,       // list of URLs to visit
        figures = {},       // { filename:url }  hash for images ![](url)  
        sublist_of_urls;    // list of URLs to visit


    if (!list_of_tag_names) {
        // get list of urls for all exercises on current page
        list_of_urls =  $("td .simple-button").map( function(){ return $(this).attr('href'); }).get();
        list_of_urls.sort();    // normalize order 
    } else {
        // construct list of urls from tags specified
        list_of_urls = [];
        // iterite over list of tag names 
        for (idx in list_of_tag_names ){
            sublist_of_urls = $("tr:contains('"+list_of_tag_names[idx] + "')").find("a").map( function(){ return $(this).attr('href'); }).get();   
            console.log("Processing " + sublist_of_urls.length + " urls for tag " + list_of_tag_names[idx] );
            sublist_of_urls = sublist_of_urls.sort();
            for (idx2 in sublist_of_urls ) { 
                 if  ( $.inArray( sublist_of_urls[idx2], list_of_urls) < 0 ) {   // only add if (not found)=(-1)
                    list_of_urls.push( sublist_of_urls[idx2] );
                 }
            } // end of list_of_urls.extend (uniq) 
            
        } //for        
    } //else


    texdoc += "\\documentclass[twocolumn,10pt]{article}\n";
    texdoc += "\\title{Khan exercises}\n"; 
    texdoc += "\\setlength{\\columnsep}{20pt} \n\\usepackage{amsmath,hyperref,cancel,graphicx}\n \\def\\shrinkfactor{0.55}\n \\usepackage[margin=1.5cm]{geometry}\n\\usepackage[usenames,dvipsnames]{color}\n \n \\newcommand{\\blue}[1]{{\\color{Blue}#1}} \n \\newcommand{\\purple}[1]{{\\color{Purple}#1}} \n \\newcommand{\\red}[1]{{\\color{Red}#1}} \n \\newcommand{\\green}[1]{{\\color{Green}#1}} \n \\newcommand{\\gray}[1]{{\\color{Gray}#1}} \n  \\newcommand{\\pink}[1]{{\\color{Magenta}#1}}   \n\n\n"
    texdoc += "\\begin{document}\n\\maketitle\n\n";

    
    for( idx in list_of_urls ){

        url = list_of_urls[idx];
        console.log(" processing " + url );

        ex_json = fetch_exercise_json( url );   // extracts the JSON data from an exercise

        texdoc +=  generate_tex( ex_json, figures);
        
    }
    
    // append command for getting pulling in .pngs via wget
    texdoc += "%%  Create a directory called 'figures' in latex dir and run the following command \n"
    texdoc += "%  wget \\\n"
    for ( idx in figures ) {
        url = figures[idx];
        texdoc += "%    " + url + " \\\n";
    }
    texdoc += "\n\n"
    
    texdoc += "\\end{document}\n\n";
    console.log(" done ");

    return fixup_aligns(texdoc);
}


