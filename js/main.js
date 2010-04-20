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
            text: el.find('textarea').val()
        };
    }

    function saveNote(el) {
        var doc = serializeNote(el);
        var isNew = !doc._id;

        // skip if new and empty
        if (isNew && !doc.text) return;
        // skip if not changed
        if (doc.text == el.data('text')) return;

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
            success: saveProject,
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
            error: function(a,b,c) {
                addNote();
                showError(a,b,c);
            }
        });
    }

    function saveProject() {
        PROJECT.children = $('#unordered-list').children().map(function() {
            return $(this).data('id');
        }).get();
        PROJECT.title = $('h1 input').val();
        DB.saveDoc(PROJECT);
    }

    function loadNote(id, el) {
        DB.openDoc(id, {
            success: function(note) {
                el = el || addNote();
                el.data('id', note._id).data('rev', note._rev).find('textarea').val(note.text);
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
        note.find('textarea').val(text || '').focus()
        return note;
    }

    $('textarea').live('keydown', function (event){
        if (event.keyCode == 13) { // enter
            event.preventDefault();
            var note = addNote('', $(this).parent());
            saveNote(note);
        }

        if (event.keyCode == 8) { // backspace
            if ( $(this).val() === '' ) {
                if ($(this).hasClass('indented')) {
                    $(this).removeClass('indented');
                } else if ( $('textarea').length > 2 ) {
                    event.preventDefault();
                    $(this).parent().prev().find('textarea').focus();
                    deleteNote($(this).parent());
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