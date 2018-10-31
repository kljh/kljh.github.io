"use strict";

function peer_edit(editor, uid) {
    var srv = "";
    if (window.location.protocol=="file:") srv = "http://localhost:8085";
    if (window.location.host=="kljh.github.io") srv = "https://kljh.herokuapp.com";

    var dmp = new diff_match_patch();
    editor.on("changes", function (ed, chg) { content_updated(ed, chg) });

    const throttling_timeout = 500, heartbeat_timeout = 2500;

    var timeoutID = window.setTimeout(content_updated_throttled, throttling_timeout, "init");
    function content_updated(ed, chg) {
        var ts = new Date().toISOString().substr(11,12)
        //console.log("change", ts);

        window.clearTimeout(timeoutID);
        timeoutID = window.setTimeout(content_updated_throttled, throttling_timeout, ts);
    }
    var prev_txt = "";
    function content_updated_throttled(ts) {
        var txt = editor.getValue();
        var diffs = dmp.diff_main(prev_txt, txt);
        dmp.diff_cleanupSemantic(diffs);
        //var patches = dmp.patch_toText(dmp.patch_make(prev_txt, txt));
        var patches = dmp.patch_toText(dmp.patch_make(prev_txt, diffs));

        //console.log("change throttled", ts); // , JSON.stringify(txt));

        var h = 0;
        for (var i=0; i<txt.length; i++)
            h = ( h + (h>>1||1)*txt.charCodeAt(i) ) % 0xFFFF;

        $.ajax({
            type: "POST",
            url: srv+"/peer/tick",
            dataType: 'json', // expected back
            contentType : 'application/json',
            data: JSON.stringify({ uid: uid, p: patches, h }),
        })
        // done/fail
        .then(data => {
            //console.log(data)
            if (data.h != h) {
                update_editor_to_latest(data.t);
            }
        })
        .catch(console.err)

        prev_txt = txt;

        window.clearTimeout(timeoutID);
        timeoutID = window.setTimeout(content_updated_throttled, heartbeat_timeout, ts);
    }

    function update_editor_to_latest(next_txt) {
        // Save current content and cursor position
        editor.focus();
        var curr_txt = editor.getValue();
        var curr_pos = editor.getCursor();

        // Received latest head from server, use it.
        // But if the server head is empty, then keep our editor content and it to the server.
        if (next_txt) editor.getDoc().setValue(next_txt);
        prev_txt = next_txt;

        // Restore the cursor
        if (curr_pos) {
            var next_pos = new_pos_using_patch(curr_pos, curr_txt, next_txt);
            if (!next_pos) console.warn("curr_pos", curr_pos, "next_pos", next_pos);
            editor.setCursor(next_pos);
        }
    }

    function new_pos_using_patch(curr_pos, curr_txt, next_txt) {
        const marker = '@' //'\0';

        if (!curr_pos)
            return;

        // add a marker to locate the cursor in current text
        var doc = curr_txt.split("\n");
        var line = doc[curr_pos.line];
        line = line.substr(0, curr_pos.ch) + marker + line.substr(curr_pos.ch);
        doc[curr_pos.line] = line;
        var curr_txt_with_marker = doc.join("\n");

        // create a patch with it
        var diffs = dmp.diff_main(curr_txt, curr_txt_with_marker);
        var patches = dmp.patch_make(curr_txt, diffs);

        // apply patch on new text
        var tmp = dmp.patch_apply(patches, next_txt);
        var ok = tmp[1].reduce((acc, cur) => acc && cur, true);
        if (!ok) return; // can't do much here ...
        var next_txt_with_marker = tmp[0];

        // find position of marker
        var next_pos;
        var doc = next_txt_with_marker.split("\n");
        for (var i=0; i<doc.length; i++) {
            var j = doc[i].indexOf(marker);
            if (j!=-1)
                next_pos = { line: i, ch: j };
        }
        return next_pos;
    }

    function new_pos_using_patch_test() {
        var curr_txt = "abc\ndefghijkl\nmnop\n";
        console.log(new_pos_using_patch({ line: 1, ch: 4 }, curr_txt, curr_txt+"qwertyu\n")); // lines added after
        console.log(new_pos_using_patch({ line: 1, ch: 4 }, curr_txt, "qwertyu\n"+curr_txt)); // lines added before
        console.log(new_pos_using_patch({ line: 1, ch: 4 }, curr_txt, curr_txt.replace("defghijkl", "defghijkljh"))); // chars added after
        console.log(new_pos_using_patch({ line: 1, ch: 4 }, curr_txt, curr_txt.replace("defghijkl", "fghijkl"))); // chars added before
    }

}

