(function($, undefined) {

    $('textarea').live('keydown', function (event){
        if (event.keyCode == '13') { // enter
            event.preventDefault();
            $('<li><textarea></textarea></li>')
            .insertAfter( $(this).parent() )
            .find('textarea').focus();
        }

        if (event.keyCode == '27') { // esc
            event.preventDefault();
            $(this).parent().toggleClass('ihaveabullet');
        }
    });

    $(function(){
        $('<span/>') //just for fun
        .html('fox')
        .appendTo('h1');

        $('#imalist').sortable();
    });

})(jQuery);