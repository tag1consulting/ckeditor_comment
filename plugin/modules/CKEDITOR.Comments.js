/**
 * Class that handles instances of CKEDITOR.Comments.
 *
 * @constructor
 *   Creates a new CKEDITOR.Comments() instance for editor.
 *
 * @param {CKEDITOR.editor} editor
 *   A CKEDITOR.editor instance.
 *
 *     var instance = new CKEDITOR.Comments(editor);
 *
 * @returns {CKEDITOR.Comments}
 */
CKEDITOR.Comments = function(editor) {
  var self = this;

  /**
   * State determining whether this Comments instance is initialized.
   *
   * @property {boolean} _initialized
   * @private
   */
  self._initialized = false;

  /**
   * Contains the comment IDs (cids) of initialized comments.
   *
   * @property {object} comments
   */
  self.comments = {};

  /**
   * A temporary CID value used to unsaved comments (should always be <= 0).
   *
   * @property {object} tempCid
   */
  self.tempCid = 0;

  /**
   * The CKEDITOR.editor instance used in construction.
   *
   * @property {CKEDITOR.editor} [editor=]
   */
  self.editor = editor;

  /**
   * Data set properties of the editor's textarea element.
   * 
   * @property {object} [data={}]
   */
  self.data = $.extend(true, {
    commentsEnabled: false
  }, $('#' + editor.name).data());

  /**
   * Status on whether commenting is enabled.
   * 
   * @property {boolean} [enabled=false]
   */
  self.enabled = self.data.commentsEnabled || false;

  /**
   * The current comment activated (focused).
   * 
   * @property {(boolean|CKEDITOR.Comment)} activeComment
   */
  self.activeComment = false;

  /**
   * Property determining whether instance has loaded.
   * 
   * @property {boolean} loaded
   */
  self.loaded = false;

  /**
   * Queue containing the comment IDs (cids) of comments needed to be removed.
   *
   * @property {array} removeQueue
   */
  self.removeQueue = [];

  /**
   * Queue containing the comment IDs (cids) of comments needed to be saved.
   *
   * @property {array} saveQueue
   */
  self.saveQueue = [];

  /**
   * The sidebar DOM jQuery Object used to contain comments.
   *
   * @property {jQuery} [sidebar=$()]
   */
  self.sidebar = $();

  /**
   * An object used to cache the users of comments. 
   * 
   * @property {Object} users
   */
  self.users = {};

  return self;
};

CKEDITOR.Comments.prototype = {

  /**
   * Initializes a CKEDITOR.Comments instance.
   */
  init: function() {
    var self = this;
    if (self._initialized) {
      return;
    }
    self.createSidebar();
    self.loadComments();
    // Detect comments on selectionChange.
    self.editor.on('selectionChange', self.selectionChange);
    self._initialized = true;
  },

  /**
   * Event handler for CKEDITOR selectionChange event.
   * @param {CKEDITOR.eventInfo} e
   */
  selectionChange: function (e) {
    var self = e.editor.comments;
    // Remove this listener from the editor so we can make changes without this
    // event again.
    e.removeListener();
    self.sort();
    // Add listener back onto editor now that we're done.
    e.editor.on('selectionChange', self.selectionChange);
    var range = e.data.selection.getRanges()[0];
    window.console.log(range);
    window.console.log(range.startContainer.getParent().$);
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
  }
};

/**
 * AJAX callback for retrieving data using default parameters.
 *
 * @param {string} action
 * @param {Object} options
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
  var self = this;

  // Only load comments once per instance.
  if (self.loaded) {
    return;
  }

  // Lock editor while loading comments.
  self.editor.setReadOnly(true);

  var $loading = $('<div class="loading">Please wait...</div>');
  self.sidebar.append($loading);

  // Instantiate existing comments.
  $(this.editor.document.$).find('body comment').each(function () {
    var $inlineElement = $(this);
    var options = $.extend(true, { inlineElement: $inlineElement }, $inlineElement.data());
    var comment = new CKEDITOR.Comment(self, options);
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
        var comment = new CKEDITOR.Comment(self, json.comments[i]);
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
};

/**
 * Create the sidebar for containing the actual comments in the editor.
 */
CKEDITOR.Comments.prototype.createSidebar = function () {
  var self = this;
  if (self.sidebar.length) {
    return;
  }
  self.sidebar = $('<comments/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($(self.editor.document.$).find('html'));
  $(window).on('resize.cke-comments-sidebar', function () {
    self.sidebarResize();
  });
  this.editor.on('afterCommandExec', function (e) {
    if (e.data.name === 'maximize') {
      self.sidebarResize();
    }
  });
};

CKEDITOR.Comments.prototype.sidebarResize = function () {
  var self = this;
  var $document = $(self.editor.document.$);
  var $body = $document.find('body');
  self.sidebar.css('left', (($document.find('html').width() - $body.outerWidth(false)) / 2) + $body.outerWidth(false) + 20) ;
};

/**
 * Sort comments in sidebar.
 */
CKEDITOR.Comments.prototype.sort = function () {
  var i, $inlineComments = $(this.editor.document.$).find('body comment');
  for (i = 0; i < $inlineComments.length; i++) {
    if ($inlineComments[i]._ && $inlineComments[i]._.sidebarElement.get(0)) {
      $inlineComments[i]._.sidebarElement.get(0).commentIndex = i;
      this.updateCharacterRange($inlineComments[i]);
    }
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
 * Update an element's character range, saving if necessary.
 */
CKEDITOR.Comments.prototype.updateCharacterRange = function (element) {
  var selection = rangy.getSelection(this.editor.document.$);
  var _cke_ranges = this.editor.getSelection().getRanges();
  this.editor.getSelection().lock();
  selection.selectAllChildren(element);
  var newCharacterRange = selection.saveCharacterRanges();
  if (JSON.stringify(newCharacterRange) !== JSON.stringify(element._.character_range)) {
    window.console.log('"' + selection.toString() + '": new character range');
    element._.character_range = newCharacterRange;
  }
  else {
    window.console.log('"' + selection.toString() + '": same character range');
  }
  this.editor.getSelection().selectRanges(_cke_ranges);
  this.editor.getSelection().unlock();
};

/**
 * Find closest comments based on editor cursor position.
 */
CKEDITOR.Comments.prototype.closestComment = function() {
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
  if (comment.length && comment.get(0)._ && comment.get(0)._ instanceof CKEDITOR.Comment) {
    return comment.get(0)._;
  }
  return false;
};

/**
 * Arrange comments around the comment this was called on.
 * @param {CKEDITOR.Comment} [comment]
 */
CKEDITOR.Comments.prototype.arrangeComments = function(comment) {
  var self = this;
  comment = comment || self.activeComment || self.closestComment();
  if (comment && comment.sidebarElement.length) {
    var beforeTop, beforeComment, commentsBefore = comment.sidebarElement.prevAll('comment').toArray();
    var afterTop, afterComment, commentsAfter = comment.sidebarElement.nextAll('comment').toArray();
    beforeTop = afterTop = comment.sidebarElement.get(0).newTop = comment.findTop();

    self.sidebar.find('comment').stop(true);

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
    self.sidebar.find('comment').dequeue('arrangeComments');
  }
};

/**
 * Creates a CKEDITOR.Comment for this instance.
 *
 * @param {CKEDITOR.Comment} [comment={}]
 * @param {boolean} [activate=true]
 */
CKEDITOR.Comments.prototype.createComment = function(comment, activate) {
  var self = this;

  comment = comment || {};
  activate = activate || true;

  var readOnly = self.editor.readOnly;
  if (readOnly) {
    self.editor.setReadOnly(false);
  }
  var selection = rangy.getSelection(self.editor.document.$);
  if (comment.character_range) {
    selection.restoreCharacterRanges(self.editor.document.getBody().$, comment.character_range);
  }
  else {
    selection.expand('word');
    selection.refresh();
    comment.character_range = selection.saveCharacterRanges();
  }
  var $element = $('<comment/>')
    .html(selection.toHtml())
    .attr('data-cid', comment.cid);
  self.editor.insertElement(new CKEDITOR.dom.element($element.get(0)));
  comment.inlineElement = $element;
  if (!(comment instanceof CKEDITOR.Comment)) {
    comment = new CKEDITOR.Comment(self, comment);
    comment.edit();
  }
  if (activate) {
    comment.activate();
  }
  if (readOnly) {
    self.editor.setReadOnly(true);
  }
};
