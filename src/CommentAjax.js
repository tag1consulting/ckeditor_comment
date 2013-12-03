(function ($) { if (CKEDITOR && CKEDITOR.Comments && !CKEDITOR.CommentAjax) {

  /**
   * This class centralizes the ajax loading for ckeditor_comment.
   *
   * @constructor
   *   Initializes an instance of this class.
   *
   * @returns {CKEDITOR.CommentAjax}
   */
  CKEDITOR.CommentAjax = function() {
    /* Nothing to do yet... */

    return this;
  };

  CKEDITOR.CommentAjax.prototype = {
    /**
     * AJAX callback for retrieving data using default parameters.
     *
     * @param {string} action
     * @param {Object} options
     */
    ajax: function (action, options) {
      options = options || {};
      var defaults = {
        url: Drupal.settings.basePath + 'ajax/ckeditor/comment',
        type: 'POST',
        dataType: 'json',
        data: this.data
      };
      options = $.extend(true, defaults, options);
      options.data.action = action;
      $.ajax(options);
    },

    /**
     * Load existing comments for this instance.
     */
    loadComments: function() {
      var self = this;

      // Only load comments once per instance.
      if (self.loaded) {
        return;
      }

      // Lock editor while loading comments.
      self.editor.setReadOnly(true);

      var $loading = $('<div class="loading">Please wait...</div>');
      self.sidebar.container.append($loading);

      // Instantiate existing comments.
      $(self.editor.document.$).find('body comment').each(function () {
        var $inlineElement = $(this);
        var options = $.extend(true, { inlineElement: $inlineElement }, $inlineElement.data());
        var comment = self.subclass(CKEDITOR.Comment, options);
        if (!comment.cid) {
          comment.remove();
        }
      });

      // Load comments from database.
      self.ajax('comment_load', {
        data: {
          comments: self.data.cids
        },
        success: function (json) {
          self.template = json.template;
          for (var i = 0; i < json.comments.length; i++) {
            var comment = self.subclass(CKEDITOR.Comment, json.comments[i]);
            if (comment.cid && !self.comments[comment.cid]) {
              self.createComment(comment);
            }
          }
        },
        complete: function () {
          $loading.remove();
          self.editor.setReadOnly(false);
        }
      });
      self.loaded = true;
    }
  };

}})(jQuery);
