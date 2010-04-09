(function($, undefined) {

    var DB = '/db/jotfox';

    $.ajaxSetup({
        'contentType': 'application/json',
        'dataType': 'json',
        'username': 'onessomankesheatioungtho',
        'password': 'OCFD11H3Y5f4IWuV1jatigcn'
    });

    function reportError(callback) {
        return function(data, textStatus) {
            if (data.error) {
                console.log(data);
            } else {
                if (callback) callback(data);
            }
        }
    }

    function saveRow(el, next) {
        var doc = { text: el.val() };
        if (el.data('id')) { doc._id = el.data('id'); doc._rev = el.data('rev'); next: el.data('next'); }
        if (next) doc.next = next;
        $.post(DB, JSON.stringify(doc), reportError(function(data) {
            el.data('id', data.id);
            el.data('rev', data.rev);
            var prev = el.parent().prev();
            if (!next && prev.length) saveRow(prev.find('textarea'), data.id);
        }));
    }

    function linkRows(prev, next) {
        if (prev.length)
            saveRow(prev.find('textarea'), next.length ? next.find('textarea').data('id') : null);
    }

    function deleteRow(el) {
        linkRows(el.parent().prev(), el.parent().next());
        var id = el.data('id');
        if (!id) return;
        var rev = el.data('rev');
        $.ajax({ type: 'DELETE', url: DB + '/' + id + '?rev=' + rev, success: reportError(), error: reportError()});
    }

    function getStartId(callback) {
        $.getJSON(DB + '/_all_docs?limit=1', {}, function(data) {
            if (callback) callback(data.rows[0].id);
        });
    }

    function loadRows(startId) {
        $.getJSON(DB + '/' + startId, reportError(function(data) {
            $('<li><textarea></textarea></li>').insertBefore($('.newest:first').parent())
            .find('textarea')
            .val(data.text).data('id', data._id)
            .data('rev', data._rev)
            .data('next', data.next);
            if (data.next) loadRows(data.next);
        }));
    }

    //hotkeys plugin doesn't overwrite live(), just bind() :(
    $('#container').bind('keydown', 'ctrl+right', function (event){
        event.preventDefault();
        if (event.target.tagName === "TEXTAREA") {
            if ( $(event.target).hasClass('child') ) {
                $(event.target).addClass('baby');
            } else {
                $(event.target).addClass('child');
            }
        }
    });

/*
    $('#container').bind('keydown', 'ctrl+left', function (event){
    event.preventDefault();
    if (event.target.tagName === "TEXTAREA") {
        if ( $(event.target).hasClass('baby') ) {
        $(event.target).removeClass('baby');
        } else if ( $(event.target).hasClass('child') ) {
        $(event.target).removeClass('child');
        }
    }
    });
*/

    $('textarea').live('keydown', function (event){
        if (event.keyCode == 13) { // enter
            saveRow($(this));
            event.preventDefault();
            $(this).removeClass('hascursor');
            $('#clone-army .note')
            .clone()
            .insertAfter( $(this).parent() )
            .find('textarea').focus()
        }

        if (event.keyCode == 8) { // backspace
            if ( $(this).val() === '' ) {
                if ($(this).hasClass('indented')) {
                    $(this).removeClass('indented');
                } else if ( $('textarea').length > 2 ) {
                    event.preventDefault();
                    deleteRow($(this));
                    $(this).parent().prev().find('textarea').focus();
                    $(this).parent().remove();
                }
            }
        }
    });

    $(function(){

        $('.fillme').live('focusin', function() {
            $(this).addClass('hascursor');
        });

        $('.fillme').live('focusout', function() {
            $(this).removeClass('hascursor');
        });

        $('#clone-army .note')
        .clone()
        .appendTo('#unordered-list')
        .find('textarea')
        .focus();

        $('#unordered-list').sortable({
            stop: function(event, ui) {
                saveRow(ui.item.next().find('textarea'));
                saveRow(ui.item.find('textarea'));
            }
        });

        getStartId(function(id) {
            loadRows(id);
        });
    });

})(jQuery);