(function ($) { if (CKEDITOR && CKEDITOR.Comments && !CKEDITOR.CommentWidget) {

  /**
   * Provides the "comment" widget definition.
   * @param {CKEDITOR.editor} editor
   *   The editor instance.
   * @returns {Object}
   * @static
   * @abstract
   */
  CKEDITOR.CommentWidgetDefinition = function (editor) {
    return {
      defaults: function () {
        var selection = rangy.getSelection(editor.document.$);
        // Attempt to expand word if possible.
        if (selection.isCollapsed) {
          selection.expand('word');
          selection.refresh();
        }
        selection.trim();
        return {
          content: selection.toHtml()
        };
      },
      editables: {
        content: {
          selector: '.comment-content'
        }
      },
      parts: {
        content: '.comment-content'
      },
      requiredContent: 'comment',
      template: '<comment><span class="comment-content">{content}</span></comment>',
      init: function () {
        if (!editor.Comments._initialized) {
          editor.widgets.destroy(this);
          return;
        }
        // Element already exists in DOM or new widget has data content.
        if (this.element.getDocument().equals(editor.document) || this.data.content.length) {
          // If element exists in DOM, but has no data content, set it.
          if (!this.data.content.length) {
            this.setData('content', this.element.getHtml());
          }
          // Instantiate a new CommentWidget class to manage this widget.
          editor.Comments.subclass(CKEDITOR.CommentWidget, this);
        }
        // Not a valid widget, destroy it.
        else {
          editor.widgets.del(this);
        }
      },
      upcast: function(element) {
        return element.name === 'comment';
      }
    };
  };

  /**
   * This class manages the comment widget for CKEditor. This class should
   * not be used directly. It is automatically instantiated when a
   * CKEDITOR.Comments instance is created.
   *
   * @constructor
   *   Initializes an instance of this class.
   *
   * @param {CKEDITOR.plugins.widget} widget
   * @returns {CKEDITOR.CommentWidget}
   */
  CKEDITOR.CommentWidget = function(widget) {
    var self = this;
    self.comment = {};
    if (!widget) {
      return self;
    }
    widget.on('blur',     self.blur);
    widget.on('data',     self.data);
    widget.on('destroy',  self.destroy);
    widget.on('focus',    self.focus);
    widget.on('ready',    self.ready);
    self.widget = widget;
    return self;
  };

  CKEDITOR.CommentWidget.prototype = {

    /**
     * Fired when comment widget has been blurred.
     * @param {CKEDITOR.eventInfo} evt
     */
    blur: function (evt) {
      var widget = evt.sender;
      if (widget.comment._editing) {
        evt.stop();
        return;
      }
      if (!widget.comment._destroying) {
        widget.comment.inlineElement.removeClass('active');
        widget.comment.sidebarElement.removeClass('active');
        if (widget.comment.cid === 0 && !widget.comment._saving) {
          widget.comment.destroy();
        }
      }
    },

    /**
     * Fired when the comment widget data has been changed.
     * @param {CKEDITOR.eventInfo} evt
     */
    data: function (evt) {
      var widget = evt.sender;
      widget.element.setHtml(widget.data.content);
    },

    /**
     * Fired when comment widget is destroyed.
     * @param {CKEDITOR.eventInfo} evt
     */
    destroy: function (evt) {
      var widget = evt.sender;
      widget.editor.undoManager.lock(true);
      widget.comment.sidebarElement.remove();
      widget.editor.insertHtml(widget.data.content);
      widget.editor.undoManager.unlock();
    },

    /**
     * Fired when comment widget has been focused.
     * @param {CKEDITOR.eventInfo} evt
     */
    focus: function (evt) {
      var widget = evt.sender;
      if (!widget.comment._destroying) {
        // Focus this comment.
        widget.comment.inlineElement.addClass('active');
        widget.comment.sidebarElement.addClass('active');

        // Re-arrange touching comments.
        widget.comment.arrangeComments();
      }
    },

    /**
     * Fired when comment widget was successfully created and is ready.
     * @param {CKEDITOR.eventInfo} evt
     */
    ready: function (evt) {
      var widget = evt.sender;
      widget.dialog = 'comment';
      if (!widget.comment) {
        var comment = widget.editor.Comments.subclass(CKEDITOR.Comment, { inlineElement: $(widget.element.$)});
        comment.widget = widget;
        widget.comment = comment;
      }
    }

  };

}})(jQuery);
