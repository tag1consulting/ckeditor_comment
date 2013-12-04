  /**
   * This is the API entry point. The entire CKEditor.Comments code runs under this object.
   *
   * @singleton
   * @requires CKEDITOR.CommentAjax
   * @requires CKEDITOR.CommentSidebar
   * @requires CKEDITOR.CommentWidget
   * @constructor
   *   Creates a new CKEDITOR.Comments() instance for editor.
   *
   *     var Comments = new CKEDITOR.Comments(editor);
   *
   * @param {CKEDITOR.editor} editor
   * @returns {CKEDITOR.Comments} Comments
   */
  CKEDITOR.Comments = function(editor) {
    /**
     * State determining whether this instance has been initialized.
     * @property {object} _initialized
     * @private
     */
    this._initialized = false;
    /**
     * A temporary CID value used to unsaved comments (should always be <= 0).
     * @property {object} _temporaryCid
     * @private
     */
    this._temporaryCid = 0;
    /**
     * An instance of the CommentAjax class.
     * @property {CKEDITOR.CommentAjax} ajax
     */
    this.ajax = this.subclass(CKEDITOR.CommentAjax);
    /**
     * Contains the comment IDs (cids) of initialized comments.
     * @property {object} [comments={}]
     */
    this.comments = {};
    /**
     * The CKEDITOR.editor instance used in construction.
     * @property {CKEDITOR.editor} editor={}]
     */
    this.editor = editor || {};
    /**
     * Data set properties of the editor's textarea element.
     * @property {object} [data={}]
     */
    this.data = this.editor.name ? $.extend(true, {commentsEnabled: false}, $('#' + this.editor.name).data()) : {};
    /**
     * Status on whether commenting is enabled.
     * @property {boolean} [enabled=false]
     */
    this.enabled = this.data.commentsEnabled || false;
    /**
     * The current comment activated (focused).
     * @property {(boolean|CKEDITOR.Comment)} activeComment
     */
    this.activeComment = false;
    /**
     * Property determining whether instance has loaded.
     * @property {boolean} loaded
     */
    this.loaded = false;
    /**
     * Queue containing the comment IDs (cids) of comments needed to be removed.
     * @property {array} removeQueue
     */
    this.removeQueue = [];
    /**
     * Queue containing the comment IDs (cids) of comments needed to be saved.
     * @property {array} saveQueue
     */
    this.saveQueue = [];
    /**
     * An instance of the CommentSidebar class.
     * @property {CKEDITOR.CommentSidebar} sidebar
     */
    this.sidebar = false;
    /**
     * An object used to cache the users of comments.
     * @property {Object} users
     */
    this.users = {};
    return this;
  };

  CKEDITOR.Comments.prototype = {
    init: function () {
      var self = this;
      if (!self.enabled || self._initialized) {
        return;
      }
      self._initialized = true;

      // Instantiate required subclasses.
      this.sidebar = this.subclass(CKEDITOR.CommentSidebar);

      // Add plugin stylesheet.
      var styles = new CKEDITOR.dom.element('link');
      $(styles.$).on('load', function () {
        self.sidebar.containerResize();
      });
      styles.setAttributes({
        type: 'text/css',
        rel: 'stylesheet',
        href: window.CKEDITOR_COMMENTS_PLUGIN_PATH + 'plugin.css',
        media: 'screen'
      }).appendTo(self.editor.document.getHead());

      // Create the comment sidebar container.
      this.sidebar.createContainer();

      // Instantiate the comment widgets.
      var comments = self.editor.document.find('comment');
      for (var i = 0; i < comments.count(); i++) {
        var comment = comments.getItem(i);
        self.editor.getSelection().selectElement(comment);
        var html = rangy.getSelection(self.editor.document.$).toHtml();
        self.editor.widgets.initOn(comment, 'comment', { content: html });
      }

      // @TODO temporarily disabled comment loading until widgets work properly.
      // this.ajax.loadComments();
    },

    /**
     * Find closest comments based on editor cursor position.
     */
    closestComment: function() {
      var self = this,
        selection = self.editor.getSelection(),
        startElement = selection ? selection.getStartElement() : false,
        comment = $();
      if (startElement) {
        comment = $(startElement.$).closest('comment');
        // Try finding first child comment.
        if (!comment.length) {
          comment = $(startElement.$).find('comment:first');
        }
        // Try finding first parent child comment.
        if (!comment.length) {
          comment = $(startElement.$).parent().find('comment:first');
        }
      }
      // Try finding first comment in entire editor.
      if (!startElement || !comment.length) {
        comment = $(self.editor.document.$).find('comment:first');
      }
      if (comment.length && comment.get(0)._ && comment.get(0)._ instanceof CKEDITOR.Comments) {
        return comment.get(0)._;
      }
      return false;
    },

    /**
     * Arrange comments around the comment this was called on.
     * @param {CKEDITOR.Comment} [comment]
     */
    arrangeComments: function(comment) {
      var self = this;
      comment = comment || self.activeComment || self.closestComment();
      if (comment && comment.sidebarElement.length) {
        var beforeTop, beforeComment, commentsBefore = comment.sidebarElement.prevAll('comment').toArray();
        var afterTop, afterComment, commentsAfter = comment.sidebarElement.nextAll('comment').toArray();
        beforeTop = afterTop = comment.sidebarElement.get(0).newTop = comment.findTop();

        self.sidebar.container.find('> comment').stop(true);

        var animateSidebarComment = function() {
          this._.sidebarElement.animate({top: this.newTop + 'px'});
          delete this.newTop;
        };

        comment.sidebarElement.queue('arrangeComments', animateSidebarComment);
        while (commentsBefore.length || commentsAfter.length) {
          if (commentsBefore.length) {
            beforeComment = commentsBefore.splice(0,1)[0];
            beforeTop -= $(beforeComment).outerHeight(false) + 10;
            beforeComment.newTop = beforeTop;
            $(beforeComment).queue('arrangeComments', animateSidebarComment);
          }
          if (commentsAfter.length) {
            afterComment = commentsAfter.splice(0,1)[0];
            afterTop += $(afterComment).outerHeight(false) + 10;
            afterComment.newTop = afterTop;
            $(afterComment).queue('arrangeComments', animateSidebarComment);
          }
        }
        self.sidebar.container.find('> comment').dequeue('arrangeComments');
      }
    },

    /**
     * Retrieves a temporary CID for comments.
     * @returns {number}
     */
    getTemporaryCid: function () {
      this._temporaryCid = this._temporaryCid - 1;
      return this._temporaryCid;
    },

    /**
     * Create a subclass of the object this is being called on.
     *
     *      var Comments = new CKEDITOR.Comments(editor);
     *      console.log(Comments.editor); // returns Comments.editor instance.
     *
     *      var CommentSidebar = new CKEDITOR.CommentSidebar();
     *      console.log(CommentSidebar.editor); // returns undefined
     *
     *      // However, if we subclass it instead, we will inherit all of Comments
     *      // properties and methods.
     *      var CommentSidebar = Comments.subclass(CKEDITOR.CommentSidebar);
     *      console.log(CommentSidebar.editor); // returns Comments.editor instance.
     *
     * @param {Function} Func The actual class function. Do not instantiate it:
     * new Func() or Func(), just pass the full path to the function:
     * CKEDITOR.CommentSidebar.
     */
    subclass: function (Func) {
      // Arguments.
      var args = Array.prototype.slice.call(arguments, 1);
      // Save the original prototype of the function so we don't destroy it.
      var OriginalPrototype = Func.prototype || {},
          Parent = this,
          ParentPrototype = {},
          prop;
      // Extend Parent properties with getter/setters.
      for (prop in Parent) {
        // Extend getter/setters for Parent if the function doesn't have them.
        if (!Func.hasOwnProperty(prop) && !(Parent[prop] instanceof Object)) {
          /*jshint ignore:start*/
          (function () {
            var name = prop;
            Object.defineProperty(ParentPrototype, prop, {
              configurable : true,
              enumerable : true,
              get : function () {
                return Parent[name];
              },
              set : function (value) {
                Parent[name] = value;
              }
            });
          })();
          /*jshint ignore:end*/
        }
        else {
          ParentPrototype[prop] = Parent[prop];
        }
      }
      // Save the newly constructed parent prototype.
      Func.prototype = ParentPrototype;
      // Restore the original prototypes of the function.
      for (prop in OriginalPrototype) {
        Func.prototype[prop] = OriginalPrototype[prop];
      }
      // Instantiate the new subclass.
      var SubClass = Func.apply(new Func(), args);
      // Restore the function's original prototype.
      Func.prototype = OriginalPrototype;
      // Return the subclass.
      return SubClass;
    }

  };
