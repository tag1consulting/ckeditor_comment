/**
 * @file
 * Plugin to support inline commenting in CKEditor.
 */
(function ($, Drupal) {

  CKEDITOR.config.magicline_tabuList = [ 'data-ml-ignore' ];

  var CurrentComment = null;

  var CommentContent = function(element) {
    this.element = $(element);
    return this;
  }

  var Comment = function(element) {
    this.element = $(element);
    this.cid = this.element.data('cid');
    this.loaded = false;
    return this;
  };
  Comment.prototype.blur = function() {
    this.element.removeClass('active');
    this.comment.removeClass('active');
  };
  Comment.prototype.focus = function() {
    if (CurrentComment) {
      CurrentComment.blur();
    }
    this.element.addClass('active');
    this.comment.addClass('active');
    CurrentComment = this;
  };
  Comment.prototype.load = function(element) {
    if (this.loaded) {
      return;
    }
    var $comment = $('<div/>')
      .addClass('cke-comment').attr('data-ml-ignore', 'true')
      .on('click.comment', function () {
        this.comment.focus();
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
    $comment[0].commentContent = new CommentContent($comment);
    this.comment = $comment;
  };
  Comment.prototype.resolve = function() {
  };
  Comment.prototype.save = function() {
  };

  CKEDITOR.dtd.$nonBodyContent = { aside: 1 };

  // Fires when instance is completely ready for manipulation.
  CKEDITOR.on('instanceReady', function (e) {
    if (e.editor.inline_comments) {
      e.editor.initComments();

      // Detect when the source/wysiwyg mode switches.
      e.editor.on('mode', function () {
        // WYSIWYG mode.
        if (e.editor.mode === 'wysiwyg') {
          e.editor.initComments();
        }
      });

      // Remove all comments found before returning the real data.
      e.editor.on('getData', function(evt){
        if (evt.editor.mode === 'wysiwyg') {
          var $content = $('<div/>').html(evt.data.dataValue);
          // @todo save the comments before removing them, just to be safe.
          $content.find('span[data-cid]').each(function () {
            $(this).contents().unwrap();
          });
          evt.data.dataValue = $content.html();
        }
      });

    }
  });

  CKEDITOR.plugins.add('inline_comment', {
    init : function (editor) {
      // Only init plugin if the textarea has enabled inline commenting.
      var $textarea = $('#' + editor.name);
      if (!(editor.inline_comments = $textarea.hasClass('cke-inline-comments'))) {
        return;
      }

      // Add custom styling for transforming the IFRAME DOM into a "document".
      // @todo move this into a proper stylesheet, it's getting to big.
      editor.addCss = function() {
        var styles = [];
        styles.push('html { background: #ebebeb; height: 100%; margin: 0; min-width: 800px; }');
        styles.push('body.cke_editable { box-shadow: 0 0 0 1px #d1d1d1,0 0 4px 1px #ccc; margin: 0 auto; min-height: 100%; position: static; width: 800px; }');
        styles.push('@media (min-width: 800px) { html { padding: 10px; } body.cke_editable { padding: .5in 1in; } }');
        styles.push('span[data-cid] { background: rgb(255, 240, 179); padding: 1px 0 1px; border-bottom: 2px solid rgb(255, 240, 179); }');
        styles.push('span[data-cid].active { background-color: rgb(255,225,104); }');
        styles.push('.cke-comments-sidebar { bottom: 10px; overflow: hidden; position: absolute; top: 10px; width: 230px; }');
        styles.push('.cke-comments { font-family: Arial, sans-serif, sans; font-size: 1.3rem; }');
        styles.push('.cke-comment { background: #fff; border: 1px solid #d9d9d9; cursor: pointer; margin: 10px 0; padding: 8px; }');
        styles.push('.cke-comment:hover { background-color: #f1f1f1; border-color: #c6c6c6; background: -webkit-gradient(linear,0 0,0 60,from(#f8f8f8),to(#f1f1f1)); background: -moz-linear-gradient(top,#f8f8f8 0,#f1f1f1 60px); }');
        styles.push('.cke-comment.active { background: #fcfac6; border-color: #ffe572!; }');
        styles.push('.cke-comment .comment { color: #666; }');
        $('<style type="text/css"/>').html(styles.join("\n")).appendTo($(this.document.$).find('head'));
      };

      // Replaces the IFRAME DOM with the "comments" specific value.
      editor.addComments = function() {
        var editor = this;
        var data = $('#' + this.name).data();
        data.action = 'field_load_comments';
        editor.setReadOnly(true);
        $.ajax({
          url: Drupal.settings.basePath + 'ajax/ckeditor/comment',
          type: 'POST',
          dataType: 'json',
          data: data,
          success: function(json) {
            if (json.content) {
              $(editor.document.$).find('body').html(json.content);
              editor.parseComments();
            }
          },
          complete: function() {
            editor.setReadOnly(false);
          }
        });
      };

      editor.parseComments = function() {
        var $document = $(this.document.$);
        var $body = $document.find('body');
        var $comments = $body.find('span[data-cid]');
        if ($comments.length) {
          var $sidebar = $('<aside/>').addClass('cke-comments-sidebar').attr('data-widget-wrapper', 'true').appendTo($document.find('html'));
          var $sidebarComments = $('<div/>').addClass('cke-comments').attr('data-widget-wrapper', 'true').appendTo($sidebar);
          var sidebarResize = function () {
            $sidebar.css({
              left: (($document.find('html').width() - $body.outerWidth()) / 2) + $body.outerWidth() + 20
            });
          };
          $(window).on('resize.cke-comments-sidebar', function () {
            sidebarResize();
          });
          editor.on('afterCommandExec', function (e) {
            if (e.data.name === 'maximize') {
              sidebarResize();
            }
          });
          sidebarResize();
          $comments
            .on('parse.comments', function () {
              var comment = new Comment(this);
              comment.load($sidebarComments);
              this.comment = comment;
            })
            .on('mousedown.comment', function (e) {
              this.comment.focus();
              e.stopPropagation();
            })
            .trigger('parse.comments');
          $document.on('mousedown.clear-comment', function () {
            if (CurrentComment) {
              CurrentComment.blur();
            }
          });
        }
      };

      // Invoke initial plugin behaviors.
      editor.initComments = function () {
        this.addCss();
        this.addComments();
      };

      // Add Button
      editor.ui.addButton('inline_comment', {
        label: 'Comment',
        command: 'inline_comment',
        icon: this.path + 'inline-comment.png'
      });

      // Add Command
      editor.addCommand('inline_comment', {
        exec : function () {
//          var selection = editor.getSelection(), ranges = selection.getRanges();
        }
      });
    }
  });

})(jQuery, Drupal);
