/**
 * @file
 * Provides a plugin for supporting inline commenting in CKEditor.
 */

/*global jQuery:false */
/*global Drupal:false */
/*global CKEDITOR:false */

(function ($) {
  "use strict";

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
    init : function (editor) {
      // Instantiate a CKEditorComments object if needed.
      editor.comments = new CKEDITOR.Comments(editor, this);
      if (editor.comments.data.commentsEnabled) {
        // Add comment button.
        editor.ui.addButton('comment', {
          label: 'Comment',
          icon: this.path + 'images/comment.png',
          command: 'comment_add'
        });
        // Add command.
        editor.addCommand('comment_add', {
          canUndo: false, // No support for undo/redo
          modes: { wysiwyg:1 }, // Command is available in wysiwyg mode only.
          exec: function () {
            editor.comments.addComment();
          }
        });
        // Initiate plugin when editor instance is ready.
        editor.on('instanceReady', function (e) {
          // Only initiate comments plugin on editors that have the plugin enabled.
          if (e.editor.comments.data.commentsEnabled) {
            // Initiate comments plugin on editor.
            e.editor.comments.init();
            // Detect editor mode switches.
            e.editor.on('mode', function () {
              // Switched to "wysiwyg" mode.
              if (e.editor.mode === 'wysiwyg') {
                // Initiate comments plugin on editor again.
                e.editor.comments.init();
              }
              // If switching to source, instantiate a new instance of comments
              // so it can be re-initialized if switched back to 'wysiwyg' mode.
              else if (e.editor.mode === 'source') {
                e.editor.comments = new CKEDITOR.Comments(e.editor, e.editor.comments.plugin);
              }
            });
          }
        });
      }
    }
  });

  /**
   * Creates a new CKEDITOR.Comments() instance for editor.
   *
   * @param editor
   *   The CKEDITOR.editor instance.
   * @param plugin
   *   The CKEDITOR.plugins object that created this instance.
   *
   * @returns CKEDITOR.Comments
   *
   * @constructor
   */
  CKEDITOR.Comments = function(editor, plugin) {
    var $textarea = $('#' + editor.name);
    this.data = $textarea.data();
    if (this.data.commentsEnabled) {
      this.editor = editor;
      this.focusedComment = false;
      this.initalized = false;
      this.loaded = false;
      this.plugin = plugin;
      this.sidebar = false;
      this.items = [];
    }
    return this;
  };

  /**
   * Initializes a CKEDITOR.Comments instance.
   */
  CKEDITOR.Comments.prototype.init = function() {
    var _comments = this;
    if (this.initalized) {
      return;
    }
    // Append styles.
    $('<link/>').attr({
      type: 'text/css',
      rel: 'stylesheet',
      href: this.plugin.path + 'css/comments.css',
      media: 'screen'
    }).appendTo($(this.editor.document.$).find('head'));
    this.createSidebar();
    this.parse();
    // Detect comments on selectionChange.
    this.editor.on('selectionChange', function (e) {
      var range = e.data.selection.getRanges()[0];
      if (range.collapsed) {
        var parent = range.startContainer.getParent().$;
        if (parent.nodeName === "COMMENT") {
          parent._comment.focus();
        }
        else if (_comments.focusedComment) {
          _comments.focusedComment.blur();
        }
      }
      else if (_comments.focusedComment) {
        _comments.focusedComment.blur();
      }
    });
    // Blur focused comment on document click.
    $(this.editor.document.$).on('click', function () {
      if (_comments.focusedComment) {
        _comments.focusedComment.blur();
      }
    });
    this.initalized = true;
  };

  /**
   * AJAX callback for retrieving data using default parameters.
   */
  CKEDITOR.Comments.prototype.ajax = function (action, options) {
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
  };

  /**
   * Replaces the IFRAME DOM with the "comments" specific value.
   * @todo remove this, it is really not needed anymore.
   */
  CKEDITOR.Comments.prototype.load = function() {
    if (this.loaded) {
      return;
    }
    this.ajax('comment_load', {
      success: function (json) {
        if (json.content) {
          $(this.editor.document.$).find('body').html(json.content);
          this.parse();
        }
      },
      complete: function () {
        this.editor.setReadOnly(false);
      }
    });
    this.editor.setReadOnly(true);
    this.loaded = true;
  };

  /**
   * Create the sidebar for containing the actual comments in the editor.
   */
  CKEDITOR.Comments.prototype.createSidebar = function () {
    if (this.sidebar) {
      return;
    }
    var _comments = this;
    var $document = $(this.editor.document.$);
    var $body = $document.find('body');
    this.sidebar = $('<comments/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($document.find('html'));
    var sidebarResize = function () {
      _comments.sidebar.css('left', (($document.find('html').width() - $body.outerWidth(false)) / 2) + $body.outerWidth(false) + 20);
    };
    $(window).on('resize.cke-comments-sidebar', function () {
      sidebarResize();
    });
    this.editor.on('afterCommandExec', function (e) {
      if (e.data.name === 'maximize') {
        sidebarResize();
      }
    });
    sidebarResize();
  };

  /**
   * Parse document for existing comments.
   * @todo remove this, it is really not needed anymore.
   */
  CKEDITOR.Comments.prototype.parse = function() {
    var _comments = this;
    var $document = $(this.editor.document.$);
    var $body = $document.find('body');
    $body.find('comment')
      .on('parse.comment', function () {
        _comments.items.push(new CKEDITOR.Comment(_comments, this));
      })
      .trigger('parse.comment');
  };

  /**
   * Add a comment via the CKEditor button.
   */
  CKEDITOR.Comments.prototype.addComment = function() {
    var selection = this.editor.getSelection(), range = selection.getRanges()[0];
    // Allow single caret positions to expand into a word selection.
    if (range.collapsed) {
      var nativeSel = selection._.cache.nativeSel;
      if (window.getSelection && nativeSel.modify) {
        nativeSel.collapseToStart();
        nativeSel.modify("move", "backward", "word");
        nativeSel.modify("extend", "forward", "word");
      }
    }
    var bookmarks = selection.createBookmarks2();
    var selected_text = selection.getSelectedText();
    var element = new CKEDITOR.dom.element('comment');
    element.setAttribute('data-cid', false);
    element.setText(selected_text);
    this.editor.insertElement(element);
    var comment = new CKEDITOR.Comment(this, element.$, bookmarks);
    comment.focus();
  };


  /**
   * Creates a new CKEDITOR.Comment() instance for editor.
   *
   * @param comments
   *   The CKEDITOR.Comments() instance this comment resides in.
   * @param element
   *   The selection element (inline comment element) from the editor.
   * @param bookmarks
   *   The CKEDITOR.dom.range bookmarks from selection.
   *
   * @returns CKEDITOR.Comment
   *
   * @constructor
   */
  CKEDITOR.Comment = function(comments, element, bookmarks) {
    this._comments = comments;
    element._comment = this;
    bookmarks = bookmarks || {};
    this.loaded = false;
    this.cid = $(element).data('cid');
    this.bookmarks = bookmarks;
    this.inlineElement = $(element);
    this.initialized = false;
    this.init();
    return this;
  };

  /**
   * Initializes a CKEDITOR.Comment() instance.
   */
  CKEDITOR.Comment.prototype.init = function() {
    if (this.initalized) {
      return;
    }
    this.inlineElement.on('mousedown.comment', function (e) {
      this._comment.focus();
      e.stopPropagation();
    });
    this.sidebarElement = $('<comment/>')
      .addClass('cke-comment')
      .attr('data-widget-wrapper', 'true')
      .css('top', (this.inlineElement.position().top - (this.inlineElement.outerHeight(false) / 2)) + 'px')
      .on('click.comment', function (e) {
        this._comment.focus();
        e.stopPropagation();
      })
      .appendTo(this._comments.sidebar);
    this.sidebarElement[0]._comment = this;
    this.elements = $().add(this.inlineElement).add(this.sidebarElement);
    this.elements.on('click', function (e) {
      e.stopPropagation();
    });
    this._comments.items.push(this);
  };

  /**
   * Remove focus from comment.
   */
  CKEDITOR.Comment.prototype.blur = function() {
    this.elements.removeClass('focus').blur();
  };

  /**
   * Add focus to comment.
   */
  CKEDITOR.Comment.prototype.focus = function() {
    if (this._comments.focusedComment && this._comments.focusedComment !== this) {
      this._comments.focusedComment.blur();
    }
    this.elements.addClass('focus').focus();
    this._comments.focusedComment = this;
  };

  /**
   * Load a comment form the DB.
   */
  CKEDITOR.Comment.prototype.load = function() {
    if (this.loaded) {
      return;
    }
    var $comment = this.sidebarElement;
    var data = { cid: this.cid };
    data.action = 'comment_load';
    $.ajax({
      url: Drupal.settings.basePath + 'ajax/ckeditor/comment',
      type: 'POST',
      dataType: 'json',
      data: data,
      success: function(json) {
        if (json.content) {
          $comment.html(json.content);
        }
      }
    });
    this.loaded = true;
  };

  // Resolve comment.
  // @todo add functionality
  CKEDITOR.Comment.prototype.resolve = function() {
  };

  // Save comment.
  // @todo add functionality
  CKEDITOR.Comment.prototype.save = function() {
  };


})(jQuery);
