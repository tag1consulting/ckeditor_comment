(function ($) { if (CKEDITOR && CKEDITOR.Comments && !CKEDITOR.CommentWidget) {

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
    widget.on('data',     function () { self.data(this);      });
    widget.on('deselect', function () { self.deselect(this);  });
    widget.on('destroy',  function () { self.destroy(this);   });
    widget.on('ready',    function () { self.ready(this);     });
    widget.on('select',   function () { self.select(this);    });
    self.widget = widget;
    return self;
  };

  CKEDITOR.CommentWidget.prototype = {

    /**
     * Fired when the comment widget data has been changed.
     * @event
     * @param {CKEDITOR.plugins.widget} widget
     */
    data: function (widget) {
      widget.element.setHtml(widget.data.content);
    },

    /**
     * Fired when comment widget has been deselected.
     * @event
     * @param {CKEDITOR.plugins.widget} widget
     */
    deselect: function (widget) {
      widget.comment.deactive();
    },

    /**
     * Fired when comment widget is destroyed.
     * @event
     * @param {CKEDITOR.plugins.widget} widget
     */
    destroy: function (widget) {
      this.editor.undoManager.lock();
      widget.comment.sidebarElement.remove();
      this.editor.insertHtml(widget.data.content);
      this.editor.undoManager.unlock();
    },

    /**
     * Fired when comment widget was successfully created and is ready.
     * @event
     * @param {CKEDITOR.plugins.widget} widget
     */
    ready: function (widget) {
      widget.dialog = 'comment';
      var comment = this.subclass(CKEDITOR.Comment, { inlineElement: $(widget.element.$)});
      comment.widget = widget;
      comment.activate();
      if (!comment.cid) {
        comment.edit();
      }
      widget.comment = comment;
    },

    /**
     * Fired when comment widget is selected.
     * @event
     * @param {CKEDITOR.plugins.widget} widget
     */
    select: function (widget) {
      widget.comment.activate();
    }

  };

}})(jQuery);
