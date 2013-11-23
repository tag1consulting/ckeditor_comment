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
   * @param {CKEDITOR.editor} editor
   */
  init : function (editor) {
    var plugin = this;
    editor.comments = new CKEDITOR.Comments(editor);
    if (editor.comments.enabled) {
      // Add comment button.
      editor.ui.addButton('comment', {
        label: 'Comment',
        icon: plugin.path + 'images/comment.png',
        command: 'comment_add'
      });
      // Add command.
      editor.addCommand('comment_add', {
        canUndo: false, // No support for undo/redo
        modes: {
          wysiwyg: 1 // Command is available in wysiwyg mode only.
        },
        exec: function () {
          editor.comments.createComment();
        }
      });
      // Initiate plugin when editor instance is ready.
      editor.on('instanceReady', function (e) {
        var editor = e.editor;
        // Only initiate comments plugin on editors that have the plugin enabled.
        if (editor.comments.enabled) {
          var addStyles = function () {
            // Append styles.
            $('<link/>').attr({
              type: 'text/css',
              rel: 'stylesheet',
              href: plugin.path + 'css/comments.css',
              media: 'screen'
            })
              .on('load', function () {
                editor.comments.sidebarResize();
              })
              .appendTo($(editor.document.$).find('head'));
          };
          addStyles();
          // Initiate comments plugin on editor.
          editor.comments.init();
          // Detect editor mode switches.
          editor.on('mode', function () {
            // Switched to "wysiwyg" mode.
            if (editor.mode === 'wysiwyg') {
              addStyles();
              // Initiate comments plugin on editor again.
              editor.comments.init();
            }
            // If switching to source, instantiate a new instance of comments
            // so it can be re-initialized if switched back to 'wysiwyg' mode.
            else if (editor.mode === 'source') {
              editor.comments = new CKEDITOR.Comments(e.editor);
            }
          });
        }
      });
      // Remove comments that haven't been saved before returning editor data.
      editor.on('getData', function (e) {
        var $data = $('<div/>').html(e.data.dataValue);
        var comments = $data.find('comment').removeAttr('style').removeAttr('class').toArray();
        for (var i = 0; i < comments.length; i++) {
          if (comments[i]._ && comments[i]._ instanceof CKEDITOR.Comment && !comments[i]._.cid) {
            comments[i]._.remove();
          }
        }
        e.data.dataValue = $data.html();
      });
    }
  }
});
