(function($, undefined) {

    $.couch.urlPrefix = '/db';
    $.couch.login({
        username: 'onessomankesheatioungtho',
        password: 'OCFD11H3Y5f4IWuV1jatigcn'
    });

    var DB = $.couch.db('jotfox');
    var PROJECT;

    function showError(status, error, reason) {
        $('<li></li>').text(reason).appendTo('#messages').fadeIn().delay(5000).fadeOut(function() {
            $(this).remove();
        });
    }

    function serializeNote(el) {
        return {
            _id: el.data('id') || undefined,
            _rev: el.data('rev') || undefined,
            text: el.find('textarea').val(),
            checked: el.hasClass('checked')
        };
    }

    function saveNote(el, force) {
        var doc = serializeNote(el);
        var isNew = !doc._id;

        // skip if not changed
        if (!force && (doc.text == el.data('text'))) return;

        DB.saveDoc(doc, {
            success: function(result) {
                el.data('id', result.id).data('rev', result.rev).data('text', doc.text);
                if (isNew) saveProject();
            },
            error: showError
        });
    }

    function deleteNote(el) {
        var doc = serializeNote(el);
        el.remove();
        if (!doc._id) return;
        DB.removeDoc(doc, {
            error: showError
        });
    }

    function loadProject(id) {
        DB.openDoc(id, {
            success: function(project) {
                PROJECT = project;
                $.each(project.children, function(i, id) {
                    loadNote(id, addNote());
                });
                if (!project.children.length) addNote();
                $('#header h1 input').val(project.title);
            },
            error: function(status,error,reason) {
                addNote();
                showError(status,error,reason);
            }
        });
    }

    function saveProject() {
        PROJECT.children = $('#unordered-list').children().map(function() {
            return $(this).data('id');
        }).get();
        PROJECT.title = $('h1 input').val();
        DB.saveDoc(PROJECT, { error: showError });
    }

    function loadNote(id, el) {
        DB.openDoc(id, {
            success: function(note) {
                el = el || addNote();
                el.data('id', note._id).data('rev', note._rev).find('textarea').val(note.text);
                if (note.checked) el.find('.checkme input').attr('checked', 'checked').trigger('change');
            },
            error: showError
        });
    }

    //hotkeys plugin doesn't overwrite live(), just bind() :(
    $('#container').bind('keydown', 'ctrl+right', function (event){
        event.preventDefault();
        var target = $(event.target);
        if (target.is('.fillme')) {
            if ( target.hasClass('child') ) {
                target.addClass('baby');
            } else {
                target.addClass('child');
            }
        }
    });


    $('#container').bind('keydown', 'ctrl+left', function (event){
        event.preventDefault();
        var target = $(event.target);
        if (target.is('.fillme')) {
            if ( target.hasClass('baby') ) {
                target.removeClass('baby');
            } else if ( target.hasClass('child') ) {
                target.removeClass('child');
            }
        }
    });

    function addNote(text, prev) {
        var note = $('#clone-army .note').clone();
        prev ? note.insertAfter( prev ) : note.appendTo('#unordered-list');
        note.find('textarea').val(text || '');
        return note;
    }

    $('textarea').live('keydown', function (event){
        if (event.keyCode == 13) { // enter
            event.preventDefault();
            var range = $(this).caret();
            var current = $(this).val().substring(0, range.start);
            var next = $(this).val().substring(range.end);
            $(this).text(current);
            var note = addNote(next, $(this).parent());
            saveNote(note);
            note.find('textarea').caret(0,0);
        }

        if (event.keyCode == 8) { // backspace
            var selection = $(this).caret();
            if ( $(this).val().substring(0, selection.start) === '' ) {
                if ($(this).hasClass('baby')) {
                    $(this).removeClass('baby');
                } else if ($(this).hasClass('child')) {
                    $(this).removeClass('child');
                } else {
                    var previous = $(this).parent().prev().find('textarea');
                    if (previous.length) {
                        event.preventDefault();
                        var pos = previous.val().length;
                        previous.val(previous.val() + $(this).val().substring(selection.end));
                        saveNote(previous.parent());
                        deleteNote($(this).parent());
                        previous.caret(pos, pos);
                    }
                }
            }
        }
    });

    $(function(){

        $('input,textarea').live('focusin', function() {
            $(this).addClass('hascursor');
        });

        $('input,textarea').live('focusout', function() {
            $(this).removeClass('hascursor');
        });

        $('.checkme input').live('change', function() {
            var note = $(this).parents('.note:first');
            if ($(this).attr('checked')) {
                note.addClass('checked');
            } else {
                note.removeClass('checked')
            }
            saveNote(note, true);
        });

        $('.fillme').live('focusout', function() {
            saveNote($(this).parent());
        });

        $('h1 input').live('focusout', function() {
            saveProject();
        });

        $('#unordered-list').sortable({
            stop: function(event, ui) {
                saveProject();
            }
        });

        loadProject('default');
    });

})(jQuery);