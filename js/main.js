(function($, undefined) {

    $(function(){
        $('<span/>') //just for fun
        .html('fox')
        .appendTo('h1');

        $('#imalist').sortable();

        $('textarea').live('focus',  function (){
            if ( $(this).parent().next().find('textarea').val() !== '' ) {
                $('<li><textarea></textarea></li>')
                .insertAfter( $(this).parent() );
            }
        });

        $('textarea').live('keydown', function (event){
            if (event.keyCode == '13') {
                event.preventDefault();
                $(this).parent().next().find('textarea').focus();
            }

            if (event.keyCode == '9') {
                event.preventDefault();
                $(this).parent().toggleClass('ihaveabullet');
            }
        });
    });

})(jQuery);