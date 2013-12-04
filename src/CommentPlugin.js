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
        // Add the comment widget.
        editor.widgets.add('comment', {
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
        });

        // Add command for comment_add button.
        editor.addCommand('comment_add', {
          modes: {
            wysiwyg: 1 // Command is available in wysiwyg mode only.
          },
          exec: function () {
            var selection = rangy.getSelection(editor.document.$);
            // Attempt to expand word if possible.
            if (selection.isCollapsed) {
              selection.expand('word');
              selection.refresh();
            }
            selection.trim();
            var html = selection.toHtml();
            if (!html.length) {
              return;
            }
            var element = new CKEDITOR.dom.element('comment');
            element.setHtml(html);
            editor.insertElement(element);
            var widget = editor.widgets.initOn(element, 'comment', {
              content: html
            });
            if (!widget.comment) {
              var comment = editor.Comments.subclass(CKEDITOR.Comment, { inlineElement: element });
              comment.widget = widget;
              widget.comment = comment;
            }
            if (editor.widgets.focused && editor.widgets.focused !== widget) {
              editor.widgets.focused.setFocused(false).setSelected(false);
            }
            widget.focus();
            if (widget.comment.cid === 0) {
              widget.comment.edit();
            }
          }
        });

        // Add comment button.
        editor.ui.addButton('comment', {
          label: 'Comment',
          icon: window.CKEDITOR_COMMENTS_PLUGIN_PATH + 'comment.png',
          command: 'comment_add'
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
          // Initialize comments instance.
          editor.Comments.init();

          // Remove comments that haven't been saved before returning editor data.
          editor.on('getData', function (evt) {
            var data = new CKEDITOR.dom.element('div');
            data.setHtml(evt.data.dataValue);
            var comments = data.find('comment');
            for (var i = 0; i < comments.count(); i++) {
              var comment = comments.getItem(i);
              comment.removeAttributes(['style', 'class']);
            }
            evt.data.dataValue = data.getHtml();
          });

          // Detect editor mode switches.
          editor.on('mode', function (evt) {
            var editor = evt.editor;
            // Switched to "wysiwyg" mode.
            if (editor.mode === 'wysiwyg') {
              // Re-initialize instance again.
              editor.Comments.init();
            }
            else if (editor.mode === 'source') {
              editor.Comments._initialized = false;
            }
          });
        });
      }
    }
  });
