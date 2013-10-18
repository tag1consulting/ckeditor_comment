/**
 * @file
 * Plugin to support inline commenting in CKEditor.
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
   * Ensure the COMMENTS and COMMENT elements are not editable.
   */
  var $nonEditable = CKEDITOR.dtd.$nonEditable || {};
  $nonEditable.comments = 1;
  $nonEditable.comment = 1;
  CKEDITOR.dtd.$nonEditable = $nonEditable;

  /**
   * Allow the COMMENTS element to live outside of BODY.
   */
  var $nonBodyContent = CKEDITOR.dtd.$nonBodyContent || {};
  $nonBodyContent.comments = 1;
  CKEDITOR.dtd.$nonBodyContent = $nonBodyContent;

  /**
   * Create comments plugin.
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
          exec : function () {
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
    }
    return this;
  };

  // Invoke initial plugin behaviors.
  CKEDITOR.Comments.prototype.init = function() {
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
    this.initalized = true;
  };

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

  // Replaces the IFRAME DOM with the "comments" specific value.
  CKEDITOR.Comments.prototype.load = function() {
    if (this.loaded) {
      return;
    }
    var comments = this;
    this.ajax('comment_load', {
      success: function (json) {
        if (json.content) {
          $(comments.editor.document.$).find('body').html(json.content);
          comments.parse();
        }
      },
      complete: function () {
        comments.editor.setReadOnly(false);
      }
    });
    comments.editor.setReadOnly(true);
    this.loaded = true;
  };

  CKEDITOR.Comments.prototype.createSidebar = function () {
    if (this.sidebar) {
      return;
    }
    var comments = this;
    var $document = $(comments.editor.document.$);
    var $body = $document.find('body');
    var $sidebar = $('<comments/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($document.find('html'));
    var sidebarResize = function () {
      $sidebar.css('left', (($document.find('html').width() - $body.outerWidth()) / 2) + $body.outerWidth() + 20);
    };
    $(window).on('resize.cke-comments-sidebar', function () {
      sidebarResize();
    });
    comments.editor.on('afterCommandExec', function (e) {
      if (e.data.name === 'maximize') {
        sidebarResize();
      }
    });
    sidebarResize();
    comments.sidebar = $('<div/>').addClass('cke-comments').attr('data-widget-wrapper', 'true').appendTo($sidebar);
  };

  CKEDITOR.Comments.prototype.parse = function() {
    var comments = this;
    var $document = $(comments.editor.document.$);
    var $body = $document.find('body');
    var $comments = $body.find('span[data-cid]');
    if ($comments.length) {
      $comments
        .on('parse.comments', function () {
          var comment = new comments.Comment(this);
          comment.load(comments.sidebar);
          this.comment = comment;
        })
        .on('mousedown.comment', function (e) {
          var element = this;
          element.comment.focus();
          e.stopPropagation();
        })
        .trigger('parse.comments');
      $document.on('mousedown.clear-comment', function () {
        if (comments.focusedComment) {
          comments.focusedComment.blur();
        }
      });
    }
  };

  CKEDITOR.Comments.prototype.addComment = function() {
    var selected_text = this.editor.getSelection().getSelectedText();
    var newElement = new CKEDITOR.dom.element('span');
    newElement.setAttributes({
      'data-cid': ''
    });
    newElement.setText(selected_text);
    this.editor.insertElement(newElement);
  };

  CKEDITOR.Comments.prototype.Comment = function(element) {
    this.element = $(element);
    this.cid = this.element.data('cid');
    this.loaded = false;
    return this;
  };
  CKEDITOR.Comments.prototype.Comment.prototype.blur = function() {
    this.element.removeClass('active');
    this.comment.removeClass('active');
  };
  CKEDITOR.Comments.prototype.Comment.prototype.focus = function() {
    if (this.focusedComment) {
      this.focusedComment.blur();
    }
    this.element.addClass('active');
    this.comment.addClass('active');
    this.focusedComment = this;
  };
  CKEDITOR.Comments.prototype.Comment.prototype.load = function(element) {
    if (this.loaded) {
      return;
    }
    var $comment = $('<div/>')
      .addClass('cke-comment').attr('data-ml-ignore', 'true')
      .on('click.comment', function () {
        var element = this;
        element.comment.focus();
      })
      .appendTo(element);
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
    $comment[0].comment = this;
    this.comment = $comment;
  };
  CKEDITOR.Comments.prototype.Comment.prototype.resolve = function() {
  };
  CKEDITOR.Comments.prototype.Comment.prototype.save = function() {
  };


})(jQuery);
