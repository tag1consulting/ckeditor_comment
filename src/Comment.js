(function ($) { if (CKEDITOR && CKEDITOR.Comments && !CKEDITOR.Comment) {

  /**
   * Class that handles individual comments.
   *
   * @extends CKEDITOR.Comments
   * @constructor Creates a new comment in the editor.
   *
   *     var Comments = new CKEDITOR.Comments(editor);
   *     var comment = new Comments.Comment();
   *
   * @param {object} [options]
   *   The options used to create this comment.
   * @returns {CKEDITOR.Comment}
   */
  CKEDITOR.Comment = function(options) {

    var self = this;
    /**
     * State determining whether the comment is currently being saved.
     * @property {boolean} _saving
     * @private
     */
    self._saving = false;

    /**
     * State determining whether the comment is currently being edited.
     *
     * @property {boolean} _editing
     * @private
     */
    self._editing = false;

    /**
     * State determining whether the comment is new (not saved in database).
     *
     * @property {boolean} _new
     * @private
     */
    self._new = false;

    /**
     * The UNIX timestamp of when the comment was last modified.
     *
     * Setting this property will automatically update the corresponding <code>
     * &lt;time/&gt;</code> element inside the CKEDITOR.Comment.sidebarElement.
     *
     * @property {number} [changed=0]
     */
    var _changed = 0;
    self.changed = _changed;
    Object.defineProperty(self, 'changed', {
      configurable : true,
      enumerable : true,
      get : function () {
        return _changed;
      },
      set : function (_newChanged) {
        var _oldChanged = _changed;
        if (typeof _newChanged !== 'number') {
          _newChanged = parseInt(_newChanged, 10) || 0;
        }
        if (_oldChanged !== _newChanged) {
          _changed = _newChanged;
        }
        var $time = self.sidebarElement.find('time');
        if (_changed && $time.length) {
          var date = new Date(_changed * 1000);
          if ($time.length && jQuery.timeago) {
            $time.timeago('update', date);
          }
          else {
            $time.html(date.toLocaleDateString());
          }
        }
        else {
          $time.html('');
        }
      }
    });

    /**
     * The position of the inline comment.
     *
     * @property {Array} character_range
     * @uses rangy.saveCharacterRanges
     * @uses rangy.restoreCharacterRanges
     */
    self.character_range = [];

    /**
     * The unique identification number of the comment.
     *
     * @property {number} [cid=0]
     */
    var _cid = 0;
    self.cid = _cid;
    Object.defineProperty(self, 'cid', {
      configurable : true,
      enumerable : true,
      get : function () {
        return _cid;
      },
      set : function (_newCid) {
        var _oldCid = _cid;
        if (typeof _newCid !== 'number') {
          _newCid = parseInt(_newCid, 10) || 0;
        }
        // Only set cid if it differs from the original cid.
        if (_oldCid !== _newCid) {
          _cid = _newCid;
          if (self.inlineElement instanceof jQuery && self.inlineElement.length) {
            // Update the inlineElement's data-cid value.
            self.inlineElement.attr('data-cid', _cid);
            // Save a reference to this comment in the comments instance.
            if (_cid) {
              self.comments[_cid] = self;
            }
            // Remove the old reference to this comment in the comments instance.
            if (_oldCid && self.comments[_oldCid]) {
              delete self.comments[_oldCid];
            }
          }
        }
      }
    });

    /**
     * The display content of the comment.
     *
     * @property {string} content
     */
    self.content = '';

    /**
     * The jQuery Object of the comment located inside the editor BODY (content).
     *
     * @property {jQuery} [inlineElement=$()]
     */
    var _inlineElement = $();
    self.inlineElement = _inlineElement;
    Object.defineProperty(self, 'inlineElement', {
      configurable : true,
      enumerable : true,
      get : function () {
        return _inlineElement;
      },
      set : function (_newInlineElement) {
        var _oldInlineElement = _inlineElement;
        if (_oldInlineElement !== _newInlineElement && _newInlineElement instanceof jQuery && _newInlineElement.length) {
          _newInlineElement.get(0)._ = self;
        }
        else {
          _newInlineElement = $();
        }
        _inlineElement = _newInlineElement;
        if (_inlineElement.length) {
          self.sidebarElement = $('<comment><div class="color"></div><header></header><section></section><footer></footer></comment>')
            .addClass('cke-comment')
            .attr('data-widget-wrapper', 'true')
            .css('top', self.findTop() + 'px')
            .on('click', function () {
              self.activate();
            })
            .appendTo(self.sidebar.container);
          self.sidebar.sort();
          self.assignUser();
          self.arrangeComments();
        }
      }
    });

    /**
     * Name
     *
     * @property {(string|boolean)} name
     */
    self.name = false;

    /**
     * Picture
     * @property {(string|boolean)} picture
     */
    self.picture = false;

    /**
     * The jQuery Object of the comment located inside CKEDITOR.sidebar.
     *
     * @property {jQuery} [sidebarElement=$()]
     */
    var _sidebarElement = $();
    self.sidebarElement = _sidebarElement;
    Object.defineProperty(self, 'sidebarElement', {
      configurable : true,
      enumerable : true,
      get : function () {
        return _sidebarElement;
      },
      set : function (value) {
        if (value instanceof jQuery && value.length) {
          value.get(0)._ = self;
          value.find('section').html(self.content);
        }
        else {
          value = $();
        }
        _sidebarElement = value;
      }
    });

    /**
     * The unique identification number of the user whom created the comment.
     *
     * @property {number} uid
     */
    self.uid = 0;

    // Only extend comment with options that matter.
    options = options || {};
    for (var i in options) {
      if (options.hasOwnProperty(i) && self.hasOwnProperty(i)) {
        self[i] = options[i];
      }
    }
    return self;
  };
  CKEDITOR.Comment.prototype = {
    /**
     * Remove comment.
     *
     * This method will remove both the CKEDITOR.Comment.sidebarElement and the
     * CKEDITOR.Comment.inlineElement jQuery object DOM elements from the editor.
     *
     * This method also invokes CKEDITOR.Comments.arrangeComments() afterwards.
     */
    remove: function () {
      var self = this;
      if (self.inlineElement.length) {
        self.inlineElement.contents().unwrap();
      }
      if (self.sidebarElement.length) {
        self.sidebarElement.remove();
      }
      self.arrangeComments();
    },

    /**
     * Edit comment.
     */
    edit: function () {
      var self = this;
      if (!self._editing) {
        self.edit = true;
        var $section = self.sidebarElement.find('section');
        self.content = $section.html();
        var $textarea = $('<textarea/>').val(self.content);
        $section.html($textarea);
        $textarea.focus();
        $('<button/>')
          .text('Save')
          .addClass('primary')
          .appendTo($section)
          .bind('click', function () {
            self.content = $textarea.val();
            self.save(function () {
              $section.html(self.content);
              self._editing = false;
              self.arrangeComments();
            });
          });
        $('<button/>')
          .text('Cancel')
          .appendTo($section)
          .bind('click', function () {
            self._editing = false;
            if (!self.cid) {
              self.remove();
            }
            else {
              $section.html(self.content);
              self.arrangeComments();
            }
          });
        self.arrangeComments(self);
      }
    },

    /**
     * Assign user (creates sidebar element header information).
     */
    assignUser: function() {
      var self = this;
      function rand(min, max) {
        return parseInt(Math.random() * (max-min+1), 10) + min;
      }
      function random_color() {
        var h = rand(0, 360);
        var s = rand(20, 80);
        var l = rand(50, 70);
        return 'hsl(' + h + ',' + s + '%,' + l + '%)';
      }
      if (!self.uid) {
        self.uid = Drupal.settings.ckeditor_comment.currentUser.uid;
        self.name = Drupal.settings.ckeditor_comment.currentUser.name;
        self.picture = Drupal.settings.ckeditor_comment.currentUser.picture;
      }
      if (!self.users[self.uid]) {
        self.users[self.uid] = {
          uid: self.uid,
          name: self.name,
          picture: self.picture
        };
      }
      var user = self.users[self.uid];
      if (!user.color) {
        user.color = random_color();
      }

      // Assign the user color.
      self.inlineElement.css('borderColor', user.color);
      self.sidebarElement.find('.color').css('backgroundColor', user.color);

      // Create header with picture, name and timestamp.
      var $header = self.sidebarElement.find('header');
      $header.append(user.picture);
      $('<span/>').attr('rel', 'author').addClass('name').html(user.name).appendTo($header);

      // Last changed time.
      var $time = $('<time/>').appendTo($header);
      if (self.changed) {
        var date = new Date(self.changed * 1000);
        $time.attr('datetime', date.toISOString()).html(date.toLocaleString());
        if ($.timeago) {
          $time.timeago();
        }
      }
    },

    /**
     * Deactivate comment.
     *
     * This method removes the <code>.active</code> class from both
     * CKEDITOR.Comment.inlineElement and CKEDITOR.Comment.sidebarElement.
     */
    deactive: function() {
      var self = this;
      if (self.activeComment === self) {
        self.activeComment = false;
      }
      if (!self.cid && !self._saving) {
        self.remove();
      }
      else {
        self.inlineElement.removeClass('active');
        self.sidebarElement.removeClass('active');
      }
    },

    /**
     * Activate comment.
     *
     * This method adds the <code>.active</code> class to both
     * CKEDITOR.Comment.inlineElement and CKEDITOR.Comment.sidebarElement.
     *
     * This method also invokes CKEDITOR.Comments.arrangeComments() afterwards.
     */
    activate: function() {
      var self = this;
      // Blur the currently focused comment.
      if (self.activeComment && self.activeComment !== self) {
        self.activeComment.deactive();
      }
      // Set this comment as the currently focused comment.
      self.activeComment = self;

      // Focus this comment.
      self.inlineElement.addClass('active');
      self.sidebarElement.addClass('active');

      // Re-arrange touching comments.
      self.arrangeComments();
    },

    /**
     * Determines the current top position of CKEDITOR.Comment.inlineElement.
     * @returns {number}
     */
    findTop: function() {
      var self = this;
      if (self.inlineElement.length) {
        return self.inlineElement.position().top - (self.inlineElement.outerHeight(false) / 2);
      }
      return 0;
    },

    /**
     * Resolve comment.
     * @todo Add functionality to this method
     */
    resolve: function() {},

    /**
     * Save comment.
     * @param {Function} [callback]
     * @todo Allow dynamic field values to be saved.
     */
    save: function(callback) {
      var self = this;
      callback = callback || function () {};
      self._saving = true;
      self.ajax('comment_save', {
        data: {
          comments: [{
            cid: self.cid,
            character_range: self.character_range,
            ckeditor_comment_body: self.content
          }]
        },
        success: function (json) {
          self.cid = json.comments[0].cid;
          self.name = json.comments[0].name;
          self.picture = json.comments[0].picture;
          self.uid = json.comments[0].uid;
          self.content = json.comments[0].content;
          self._saving = false;
          callback(json);
        }
      });
    },

    /**
     * Set a property on the comment.
     *
     * If the <code>property</code> argument is of type: <code>string</code>, the
     * <code>value</code> argument is required.
     *
     * If the <code>property</code> argument is of type: <code>object</code>, the
     * <code>value</code> argument is ignored. The object must instead contain
     * <code>property: value</code> pairs.
     *
     * <code>property</code> must already exist in the CKEDITOR.Comment object.
     * Arbitrary properties cannot be set via this method.
     *
     *     comment.set('cid', 1234);
     *
     * or
     *
     *     comment.set({
     *       cid: 1234,
     *       content: 'Comment'
     *     });
     *
     * @param {(string|object)} property
     * @param {*} [value]
     */
    set: function(property, value) {
      var self = this;
      if (typeof property === 'string' && typeof self[property] !== 'undefined' && typeof value !== 'undefined') {
        self[property] = value;
      }
      else if (typeof property === 'object') {
        for (var prop in property) {
          if (typeof self[prop] !== 'undefined') {
            self[prop] = property[prop];
          }
        }
      }
    },

    /**
     * Update an element's character range, saving if necessary.
     */
    updateCharacterRange: function () {
      var selection = rangy.getSelection(this.editor.document.$);
      var _cke_ranges = this.editor.getSelection().getRanges();
      this.editor.getSelection().lock();
      selection.selectAllChildren(this.inlineElement.get(0));
      var newCharacterRange = selection.saveCharacterRanges();
      if (JSON.stringify(newCharacterRange) !== JSON.stringify(this.character_range)) {
        //        window.console.log('"' + selection.toString() + '": new character range');
        this.character_range = newCharacterRange;
      }
      else {
        //        window.console.log('"' + selection.toString() + '": same character range');
      }
      this.editor.getSelection().selectRanges(_cke_ranges);
      this.editor.getSelection().unlock();
    }
  };

}})(jQuery);
