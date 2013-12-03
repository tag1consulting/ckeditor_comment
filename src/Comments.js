/**
 * Create new DOM elements: COMMENTS and COMMENT.
 */
CKEDITOR.dtd.comments = 1;
CKEDITOR.dtd.comment = 1;

/**
 * Ensure the COMMENTS element is not editable.
 */
var $nonEditable = CKEDITOR.dtd.$nonEditable || {};
$nonEditable.comments = 1;
CKEDITOR.dtd.$nonEditable = $nonEditable;

/**
 * Allow the COMMENTS element to live outside of BODY.
 */
var $nonBodyContent = CKEDITOR.dtd.$nonBodyContent || {};
$nonBodyContent.comments = 1;
CKEDITOR.dtd.$nonBodyContent = $nonBodyContent;

/**
 * Allow the COMMENT element to be treated as inline.
 */
var $inline = CKEDITOR.dtd.$inline || {};
$inline.comment = 1;
CKEDITOR.dtd.$inline = $inline;

/**
 * Allow the COMMENT element to be treated as editable.
 */
var $editable = CKEDITOR.dtd.$editable || {};
$editable.comment = 1;
$editable.span = 1;
CKEDITOR.dtd.$editable = $editable;

/**
 * Creates the "comments" plugin for CKEditor.
 */
CKEDITOR.plugins.add('comments', {
  /**
   * Initialization method.
   * @param editor The CKEDITOR.editor instance.
   */
  init : function (editor) {
    window.CKEDITOR_COMMENTS_PLUGIN_PATH = this.path;
    // Initiate plugin when editor instance is ready.
    editor.Comments = new CKEDITOR.Comments(editor);
    if (editor.Comments.enabled) {
      // Add comment button.
      editor.ui.addButton('comment', {
        label: 'Comment',
        icon: window.CKEDITOR_COMMENTS_PLUGIN_PATH + 'comment.png',
        command: 'comment'
      });
      // Create the comment dialog for editing inline content.
      CKEDITOR.dialog.add('comment', function() {
        return {
          title: 'Edit comment contents',
          minWidth: 400,
          minHeight: 50,
          contents: [{
            id: 'info',
            elements: [{
              id: 'content',
              type: 'textarea',
              width: '100%',
              rows: 10,
              setup: function(widget) {
                this.setValue(widget.data.content);
              },
              commit: function(widget) {
                widget.setData('content', this.getValue());
              },
              validate: function() {
                if (this.getValue().length < 1) {
                  window.alert('You must provide at least 1 character of valid text.');
                  return false;
                }
              }
            }]
          }]
        };
      });
      editor.on('instanceReady', function () {
        editor.Comments.init();
      });
    }
  }
});

(function ($) { if (CKEDITOR && !CKEDITOR.Comments) {

  /**
   * This is the API entry point. The entire CKEditor.Comments code runs under this object.
   *
   * @singleton
   * @requires CKEDITOR.Comment
   * @requires CKEDITOR.CommentSidebar
   * @constructor
   *   Creates a new CKEDITOR.Comments() instance for editor.
   *
   *     var Comments = new CKEDITOR.Comments(editor);
   *
   * @param {CKEDITOR.editor} editor
   * @returns {CKEDITOR.Comments} Comments
   */
  CKEDITOR.Comments = function(editor) {
    this._initialized = false;
    /**
     * An instance of the CommentAjax class.
     * @property {CKEDITOR.CommentAjax} ajax
     * @private
     */
    this.ajax = false;
    /**
     * Contains the comment IDs (cids) of initialized comments.
     * @property {object} [comments={}]
     */
    this.comments = {};
    /**
     * A temporary CID value used to unsaved comments (should always be <= 0).
     * @property {object} tempCid
     */
    this.tempCid = 0;
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
      this.ajax = this.subclass(CKEDITOR.CommentAjax);
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

      // Instantiate the comment widget.
      self.editor.widgets.add('comment', CKEDITOR.CommentWidgetDefinition(self));

      // Detect editor mode switches.
      this.editor.on('mode', self.mode);

      // Create the comment sidebar container.
      this.sidebar.createContainer();

      // @TODO temporarily disabled comment loading until widgets work properly.
      // this.ajax.loadComments();
    },

    /**
     * Callback for the 'mode' event on the editor.
     * @param {CKEDITOR.eventInfo} evt
     */
    mode: function (evt) {
      var editor = evt.editor;
      // Switched to "wysiwyg" mode.
      if (editor.mode === 'wysiwyg' && !editor.Comments) {
        // Initiate comments plugin on editor again.
        editor.Comments = new CKEDITOR.Comments(editor);
        editor.Comments.init();
      }
      // If switching to source, instantiate a new instance of comments
      // so it can be re-initialized if switched back to 'wysiwyg' mode.
      else if (editor.mode === 'source' && editor.Comments && editor.Comments instanceof CKEDITOR.Comments) {
        delete editor.Comments;
      }
    },

    /**
     * Find closest comments based on editor cursor position.
     */
    closestComment: function() {
      var self = this,
        selection = self.editor.getSelection(),
        startElement = selection.getStartElement(),
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
     * Isolates code execution from changing the current selection position of
     * the editor.
     * @param {Function} fn
     */
    isolate: function (fn) {
      fn = fn || function () {};
      if (typeof fn !== 'function') {
        return;
      }
      var readOnly = this.editor.readOnly;
      if (readOnly) {
        this.editor.setReadOnly(false);
      }
      var selection = rangy.getSelection(this.editor.document.$);
      var characterRanges = selection.saveCharacterRanges();
      fn(selection);
      // Restoring the selection needs a very small timeout. It doesn't always
      // restore the previous selection correctly if a comment was inserted.
      var self = this;
      setTimeout(function() {
        selection.restoreCharacterRanges(self.editor.document.$, characterRanges);
      }, 4);
      if (readOnly) {
        this.editor.setReadOnly(true);
      }
    },

    /**
     * Create a new comment (CKEDITOR.Comment) for the editor.
     *
     * @param {object} [options={}]
     * @param {boolean} [activate=false]
     */
    createComment: function(options, activate) {
      var self = this;
      options = options || {};
      activate = activate || false;

      this.isolate(function (selection) {
        if (options.character_range) {
          selection.restoreCharacterRanges(self.editor.document.$, options.character_range);
        }
        else {
          if (selection.isCollapsed) {
            selection.expand('word');
            selection.refresh();
          }
          options.character_range = selection.saveCharacterRanges();
        }
        if (!options.inlineElement || !options.inlineElement.length) {
          var $element = $('<comment/>').html(selection.toHtml());
          if (options.cid) {
            $element.attr('data-cid', options.cid);
          }
//          selection.pasteHtml($element.get(0).outerHTML);
          self.editor.insertElement(new CKEDITOR.dom.element($element.get(0)));
          options.inlineElement = $element;
        }
        var comment = options;
        if (!(comment instanceof CKEDITOR.Comments)) {
          comment = self.subclass(CKEDITOR.Comment, options);
        }
        if (activate) {
          comment.activate();
        }
        if (!comment.cid) {
          comment.edit();
        }
      });

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

}})(jQuery);
