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
        // Strip out inline comments before returning editor data.
        editor.on('getData', function (e) {
          var $data = $('<div/>').html(e.data.dataValue);
          $data.find('comment').contents().unwrap();
          e.data.dataValue = $data.html();
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
      this.activeComment = false;
      this.initalized = false;
      this.loaded = false;
      this.plugin = plugin;
      this.sidebar = false;
      this.users = {};
    }
    return this;
  };

  /**
   * Initializes a CKEDITOR.Comments instance.
   */
  CKEDITOR.Comments.prototype.init = function() {
    var instance = this;
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
    this.loadComments();
    // Detect comments on selectionChange.
    this.editor.on('selectionChange', function (e) {
      instance.sort();
      var range = e.data.selection.getRanges()[0];
      if (range.collapsed) {
        var parent = range.startContainer.getParent().$;
        if (parent.nodeName === "COMMENT") {
          parent._comment.activate();
        }
        else if (instance.activeComment) {
          instance.activeComment.deactive();
        }
      }
      else if (instance.activeComment) {
        instance.activeComment.deactive();
      }
    });
    // Blur focused comment on document click.
    $(this.editor.document.$).on('click.comment', function () {
      if (instance.activeComment) {
        instance.activeComment.deactive();
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
   * Load existing comments for this instance.
   */
  CKEDITOR.Comments.prototype.loadComments = function() {
    if (this.loaded) {
      return;
    }
    var _comments = this;
    this.editor.setReadOnly(true);
    this.ajax('comment_load', {
      data: {
        comments: this.data.cids
      },
      success: function (json) {
        for (var i = 0; i < json.comments.length; i++) {
          _comments.addComment(json.comments[i]);
        }
      },
      complete: function () {
        _comments.editor.setReadOnly(false);
      }
    });
    this.loaded = true;
  };

  /**
   * Create the sidebar for containing the actual comments in the editor.
   */
  CKEDITOR.Comments.prototype.createSidebar = function () {
    if (this.sidebar) {
      return;
    }
    var instance = this;
    var $document = $(this.editor.document.$);
    var $body = $document.find('body');
    this.sidebar = $('<comments/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($document.find('html'));
    var sidebarResize = function () {
      instance.sidebar.css('left', (($document.find('html').width() - $body.outerWidth(false)) / 2) + $body.outerWidth(false) + 20);
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
   * Sort comments in sidebar.
   */
  CKEDITOR.Comments.prototype.sort = function () {
    var i, $inlineComments = $(this.editor.document.$).find('body comment');
    for (i = 0; i < $inlineComments.length; i++) {
      $inlineComments[i]._comment.sidebarElement[0].commentIndex = i;
    }
    var $sidebarComments = this.sidebar.find('comment');
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
      this.sidebar.append($sidebarComments);
    }
  };

  /**
   * Add a comment via the CKEditor button.
   */
  CKEDITOR.Comments.prototype.addComment = function(comment) {
    var readOnly = this.editor.readOnly;
    if (readOnly) {
      this.editor.setReadOnly(false);
    }
    var selection = this.editor.getSelection();
    comment = comment || false;
    if (comment) {
      selection.selectBookmarks(comment.bookmarks);
    }
    var range = selection.getRanges()[0];
    // Allow single caret positions to expand into a word selection.
    if (range.collapsed) {
      var nativeSel = selection._.cache.nativeSel;
      if (window.getSelection && nativeSel.modify) {
        nativeSel.collapseToStart();
        nativeSel.modify("move", "backward", "word");
        nativeSel.modify("extend", "forward", "word");
      }
    }
    var element = new CKEDITOR.dom.element('comment');
    element.setText(selection.getSelectedText());
    this.editor.insertElement(element);
    var options = {
      inlineElement: $(element.$)
    };
    if (comment) {
      options.bookmarks = comment.bookmarks;
      options.cid = comment.cid;
      options.content = comment.content;
      options.name = comment.name;
      options.picture = comment.picture;
      options.uid = comment.uid;
    }
    else {
      options.bookmarks = selection.createBookmarks2(true);
    }
    element.$._comment = new CKEDITOR.Comment(this, options);
    if (!comment) {
      element.$._comment.activate();
    }
    if (readOnly) {
      this.editor.setReadOnly(true);
    }
  };


  /**
   * Creates a new CKEDITOR.Comment() instance for editor.
   *
   * @param comments
   *   The CKEDITOR.Comments() instance this comment resides in.
   * @param element
   *   The selection element (inline comment element) from the editor.
   *
   * @returns CKEDITOR.Comment
   *
   * @constructor
   */
  CKEDITOR.Comment = function(instance, options) {
    options = options || {};
    var comment = this;
    comment = $.extend(true, {
      bookmarks: [],
      cid: false,
      content: '',
      editing: false,
      initialized: false,
      inlineElement: $(),
      instance: instance,
      loaded: false,
      name: false,
      picture: false,
      saving: false,
      uid: false
    }, comment, options);
    comment.init();
    return comment;
  };

  /**
   * Initializes a CKEDITOR.Comment() instance.
   */
  CKEDITOR.Comment.prototype.init = function() {
    if (this.initalized) {
      return;
    }
    this.sidebarElement = this.createSidebarElement();
    this.elements = $().add(this.inlineElement).add(this.sidebarElement);
    this.elements.on('click.comment', function (e) {
      this._comment.activate();
      e.stopPropagation();
    });
    this.assignUser();
    if (!this.cid) {
      this.edit();
    }
  };

  /**
   * Build header.
   */
  CKEDITOR.Comment.prototype.createSidebarElement = function() {
    var $sidebarElement = $('<comment><div class="color"></div><header></header><section></section><footer></footer></comment>')
      .addClass('cke-comment')
      .attr('data-widget-wrapper', 'true')
      .css('top', this.findTop() + 'px')
      .appendTo(this.instance.sidebar);
    $sidebarElement.find('section').html(this.content);
    $sidebarElement[0]._comment = this;
    return $sidebarElement;
  };

  CKEDITOR.Comment.prototype.delete = function () {
    this.inlineElement.contents().unwrap();
    this.sidebarElement.remove();
    this.arrangeComments();
  };

  /**
   * Edit comment.
   */
  CKEDITOR.Comment.prototype.edit = function () {
    var _comment = this;
    if (!this.editing) {
      this.edit = true;
      var $section = this.sidebarElement.find('section');
      this.content = $section.html();
      var $textarea = $('<textarea/>').val(this.content);
      $section.html($textarea);
      this.arrangeComments();
      $textarea.focus();
      $('<button/>')
        .text('Save')
        .addClass('primary')
        .appendTo($section)
        .bind('click', function () {
          _comment.content = $textarea.val();
          _comment.save(function () {
            $section.html(_comment.content);
            _comment.editing = false;
            _comment.arrangeComments();
          });
        });
      $('<button/>')
        .text('Cancel')
        .appendTo($section)
        .bind('click', function () {
          _comment.editing = false;
          if (!_comment.cid) {
            _comment.delete();
          }
          else {
            $section.html(_comment.content);
            _comment.arrangeComments();
          }
        });
    }
  };

   /**
   * Assign user (creates sidebar element header information).
   */
  CKEDITOR.Comment.prototype.assignUser = function() {
    function rand(min, max) {
      return parseInt(Math.random() * (max-min+1), 10) + min;
    }
    function random_color() {
      var h = rand(0, 360);
      var s = rand(20, 80);
      var l = rand(50, 70);
      return 'hsl(' + h + ',' + s + '%,' + l + '%)';
    }
    if (!this.uid) {
      this.uid = Drupal.settings.ckeditor_comment.currentUser.uid;
      this.name = Drupal.settings.ckeditor_comment.currentUser.name;
      this.picture = Drupal.settings.ckeditor_comment.currentUser.picture;
    }
    if (!this.instance.users[this.uid]) {
      this.instance.users[this.uid] = {
        uid: this.uid,
        name: this.name,
        picture: this.picture
      };
    }
    var user = this.instance.users[this.uid];
    if (!user.color) {
      user.color = random_color();
    }
    // Assign the user color.
    this.inlineElement.css('borderColor', user.color);
    this.sidebarElement.find('.color').css('backgroundColor', user.color);
    // Create header with picture, name and timestamp.
    var $header = this.sidebarElement.find('header');
    var date = new Date();
    $header.append(user.picture);
    $('<span/>').attr('rel', 'author').addClass('name').html(user.name).appendTo($header);
    $('<time/>').html(date.toLocaleString()).appendTo($header);
  };

  /**
   * Remove focus from comment.
   */
  CKEDITOR.Comment.prototype.deactive = function() {
    if (this.instance.activeComment === this) {
      this.instance.activeComment = false;
    }
    if (!this.cid && !this.saving) {
      this.delete();
    }
    else {
      this.elements.removeClass('active');
    }
  };

  /**
   * Add focus to comment.
   */
  CKEDITOR.Comment.prototype.activate = function() {
    // Blur the currently focused comment.
    if (this.instance.activeComment && this.instance.activeComment !== this) {
      this.instance.activeComment.deactive();
    }
    else if (!this.instance.activeComment) {
      // Set this comment as the currently focused comment.
      this.instance.activeComment = this;

      // Focus this comment.
      this.elements.addClass('active');

      // Re-arrange touching comments.
      this.arrangeComments();
    }
  };

  /**
   * Get sidebar top position based on inline comment counterpart.
   */
  CKEDITOR.Comment.prototype.findTop = function() {
    return this.inlineElement.position().top - (this.inlineElement.outerHeight(false) / 2);
  };

  /**
   * Arrange comments around the comment this was called on.
   */
  CKEDITOR.Comment.prototype.arrangeComments = function() {
    var beforeTop, beforeComment, commentsBefore = this.sidebarElement.prevAll('comment').toArray();
    var afterTop, afterComment, commentsAfter = this.sidebarElement.nextAll('comment').toArray();
    beforeTop = afterTop = this.sidebarElement[0].newTop = this.findTop();

    this.instance.sidebar.find('comment').stop(true);

    var animateSidebarComment = function() {
      this._comment.sidebarElement.animate({top: this.newTop + 'px'});
      delete this.newTop;
    };

    this.sidebarElement.queue('arrangeComments', animateSidebarComment);
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
    this.instance.sidebar.find('comment').dequeue('arrangeComments');
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
  CKEDITOR.Comment.prototype.save = function(callback) {
    var _comment = this;
    callback = callback || function () {};
    this.saving = true;
    this.instance.ajax('comment_save', {
      data: {
        comments: [{
          cid: this.cid,
          bookmarks: this.bookmarks,
          // @todo add dynamic field values here.
          ckeditor_comment_body: this.content
        }]
      },
      success: function (json) {
        _comment.cid = json.comments[0].cid;
        _comment.name = json.comments[0].name;
        _comment.picture = json.comments[0].picture;
        _comment.uid = json.comments[0].uid;
        _comment.content = json.comments[0].content;
        _comment.saving = false;
        callback(json);
      }
    });

  };


})(jQuery);
