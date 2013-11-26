// Check if native implementation available
if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() {}  // empty constructor
    F.prototype = o; // set base object as prototype
    return new F();  // return empty object with right [[Prototype]]
  };
}

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
    var plugin = this;
    window.CKEDITOR_COMMENTS_PLUGIN_PATH = plugin.path;
    // Initiate plugin when editor instance is ready.
    editor.on('instanceReady', function () {
      if (!editor.Comments) {
        editor.Comments = new CKEDITOR.Comments(editor);
        editor.Comments.init();
      }
    });
  }
});

(function ($) { if (CKEDITOR && !CKEDITOR.Comments) {

  /**
   * This is the API entry point. The entire CKEditor.Comments code runs under this object.
   *
   * @singleton
   * @requires CKEDITOR.CommentEvents
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
     * An object used to cache the users of comments.
     * @property {Object} users
     */
    this.users = {};
    return this;
  };

  CKEDITOR.Comments.prototype = {
    init: function () {
      if (!this.enabled || this._initialized) {
        return;
      }
      this._initialized = true;

      var self = this;

      /**
       * An instance of the CommentSidebar class.
       * @property {CKEDITOR.CommentSidebar} sidebar
       * @private
       */
      this.sidebar = this.subclass(CKEDITOR.CommentSidebar);
      this.sidebar.createContainer();

      // Add plugin stylesheet.
      $('<link/>').attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: window.CKEDITOR_COMMENTS_PLUGIN_PATH + 'plugin.css',
        media: 'screen'
      })
        .on('load', function () {
          self.sidebar.containerResize();
        })
        .appendTo($(this.editor.document.$).find('head'));

      // Add comment button.
      this.editor.ui.addButton('comment', {
        label: 'Comment',
        icon: window.CKEDITOR_COMMENTS_PLUGIN_PATH + 'comment.png',
        command: 'comment_add'
      });

      // Add command for comment_add button.
      this.editor.addCommand('comment_add', {
        canUndo: false, // No support for undo/redo
        modes: {
          wysiwyg: 1 // Command is available in wysiwyg mode only.
        },
        exec: function () {
          self.createComment();
        }
      });

      // Detect editor mode switches.
      this.editor.on('mode', function (e) {
        var editor = e.editor;
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
      });

      // Remove comments that haven't been saved before returning editor data.
      this.editor.on('getData', function (e) {
        var $data = $('<div/>').html(e.data.dataValue);
        var comments = $data.find('comment').removeAttr('style').removeAttr('class').toArray();
        for (var i = 0; i < comments.length; i++) {
          if (comments[i]._ && comments[i]._ instanceof CKEDITOR.Comments && !comments[i]._.cid) {
            comments[i]._.remove();
          }
        }
        e.data.dataValue = $data.html();
      });

      var selectionChange = function (evt) {
        evt.editor.removeListener('selectionChange');
        self.sidebar.sort();
        evt.editor.on('selectionChange', selectionChange);
        var range = evt.data.selection.getRanges()[0];
        if (range.collapsed) {
          var parent = range.startContainer.getParent().$;
          if (parent.nodeName === "COMMENT") {
            parent._.activate();
          }
          else if (self.activeComment) {
            self.activeComment.deactive();
          }
        }
        else if (self.activeComment) {
          self.activeComment.deactive();
        }
      };
      this.editor.on('selectionChange', selectionChange);
      this.loadComments();
    },

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
        var comment = self.subclass(CKEDITOR.Comment, [options]);
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
            var comment = self.subclass(CKEDITOR.Comment, [json.comments[i]]);
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
     * Create a new comment (CKEDITOR.Comment) for the editor.
     *
     * @param {object} [options={}]
     * @param {boolean} [activate=true]
     */
    createComment: function(options, activate) {
      var self = this;

      options = options || {};
      activate = activate || true;

      var readOnly = self.editor.readOnly;
      if (readOnly) {
        self.editor.setReadOnly(false);
      }
      var selection = rangy.getSelection(self.editor.document.$);
      if (options.character_range) {
        selection.restoreCharacterRanges(self.editor.document.getBody().$, options.character_range);
      }
      else {
        selection.expand('word');
        selection.refresh();
        options.character_range = selection.saveCharacterRanges();
      }
      if (!options.inlineElement || !options.inlineElement.length) {
        var $element = $('<comment/>').html(selection.toHtml());
        if (options.cid) {
          $element.attr('data-cid', options.cid);
        }
        self.editor.insertElement(new CKEDITOR.dom.element($element.get(0)));
        options.inlineElement = $element;
      }
      var comment = options;
      if (!(comment instanceof CKEDITOR.Comments)) {
        comment = self.subclass(CKEDITOR.Comment, [options]);
      }
      if (!comment.cid) {
        comment.edit();
      }
      else if (activate) {
        comment.activate();
      }
      if (readOnly) {
        self.editor.setReadOnly(true);
      }
    },

    /**
     * Create a subclass of the object this is being called on.
     *
     *      var Comments = new CKEDITOR.Comments(editor);
     *      console.log(Comments.editor); // returns Comments.editor instance.
     *
     *      var CommentEvents = new CKEDITOR.CommentEvents();
     *      console.log(CommentEvents.editor); // returns undefined
     *
     *      // However, if we subclass it instead, we will inherit all of Comments
     *      // properties and methods.
     *      var CommentEvents = Comments.subclass(CKEDITOR.CommentEvents);
     *      console.log(CommentEvents.editor); // returns Comments.editor instance.
     *
     * @param {Function} Func The actual class function. Do not instantiate it:
     * new Func() or Func(), just pass the full path to the function:
     * CKEDITOR.CommentSidebar.
     * @param {Array} [args=[]] An array of arguments to pass to the function.
     */
    subclass: function (Func, args) {
      // Default arguments.
      args = args || [];
      // Save the original prototype of the function so we don't destroy it.
      var OriginalPrototype = Func.prototype || {},
          Parent = this,
          ParentPrototype = {},
          prop;
      // Extend Parent properties with getter/setters.
      for (prop in Parent) {
        // Extend getter/setters for Parent if the function doesn't have them.
        if (!Func.hasOwnProperty(prop) && typeof Parent[prop] !== 'function') {
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
