(function ($) { if (CKEDITOR && CKEDITOR.Comments && !CKEDITOR.CommentSidebar) {

  /**
   * This class manages the sidebar for CKEDITOR.Comments. This class should
   * not be used directly. It is automatically instantiated when a
   * CKEDITOR.Comments instance is created.
   *
   *      var Comments = new CKEDITOR.Comments(editor);
   *      console.log(Comments.sidebar)
   *      // returns CKEDITOR.CommentSidebar
   *
   * @extends CKEDITOR.Comments
   * @alias CKEDITOR.Comments._sidebar
   * @constructor
   *   Initializes an instance of this class. This class shouldn't be
   *   instantiated directly, but rather called with CKEDITOR.Comments.subclass.
   *
   * @returns {CKEDITOR.CommentSidebar}
   */
  CKEDITOR.CommentSidebar = function() {
    this.container = $();
    return this;
  };

  CKEDITOR.CommentSidebar.prototype = {
    /**
     * Create the sidebar container in the editor.
     */
    createContainer: function () {
      if (this.container.length) {
        return;
      }
      this.container = $('<comments/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($(this.editor.document.$).find('html'));
      var self = this;
      $(self.editor.document.getWindow().$).on('resize.cke-comments-sidebar', function () {
        window.console.log('window resize');
        self.containerResize();
      });
    },

    /**
     * Re-positions the comment sidebar on resize events.
     * @event
     */
    containerResize: function () {
      var $document = $(this.editor.document.$);
      var $body = $document.find('body');
      this.container.css('left', (($document.find('html').width() - $body.outerWidth(false)) / 2) + $body.outerWidth(false) + 20) ;
    },

    /**
     * Sort comments in sidebar.
     */
    sort: function () {
      var i, $inlineComments = $(this.editor.document.$).find('body comment');
      for (i = 0; i < $inlineComments.length; i++) {
        if ($inlineComments[i]._ && $inlineComments[i]._.sidebarElement.get(0)) {
          $inlineComments[i]._.sidebarElement.get(0).commentIndex = i;
          $inlineComments[i]._.updateCharacterRange();
        }
      }
      var $sidebarComments = this.container.find('> comment');
      if ($sidebarComments.length) {
        // Sort based on inline comment positions in editor.
        $sidebarComments.sort(function(a, b) {
          if (a.commentIndex > b.commentIndex) {
            return 1;
          }
          else if (a.commentIndex < b.commentIndex) {
            return -1;
          }
          else {
            return 0;
          }
        });
        this.container.append($sidebarComments);
      }
    }

  };

}})(jQuery);
