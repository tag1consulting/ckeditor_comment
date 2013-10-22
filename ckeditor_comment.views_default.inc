<?php

/**
 * Implements hook_views_default_views().
 */
function ckeditor_comment_views_default_views() {
  $view = new view();
  $view->name = 'ckeditor_comments';
  $view->description = '';
  $view->tag = 'default';
  $view->base_table = 'ckeditor_comment';
  $view->human_name = 'CKEditorComments';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'CKEditorComments';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'none';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['query']['options']['query_comment'] = FALSE;
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['pager']['type'] = 'full';
  $handler->display->display_options['pager']['options']['items_per_page'] = '10';
  $handler->display->display_options['style_plugin'] = 'table';
  /* Header: Global: Text area */
  $handler->display->display_options['header']['area']['id'] = 'area';
  $handler->display->display_options['header']['area']['table'] = 'views';
  $handler->display->display_options['header']['area']['field'] = 'area';
  $handler->display->display_options['header']['area']['empty'] = FALSE;
  $handler->display->display_options['header']['area']['content'] = '<a href="<?php print url(\'ckeditor_comment/add\'); ?>>Add CKEditorComment</a>';
  $handler->display->display_options['header']['area']['format'] = 'full_html';
  $handler->display->display_options['header']['area']['tokenize'] = 0;
  /* Relationship: CKEditorComment: Author */
  $handler->display->display_options['relationships']['uid']['id'] = 'uid';
  $handler->display->display_options['relationships']['uid']['table'] = 'ckeditor_comment';
  $handler->display->display_options['relationships']['uid']['field'] = 'uid';
  $handler->display->display_options['relationships']['uid']['label'] = 'Author';
  /* Field: CKEditorComment: Body */
  $handler->display->display_options['fields']['ckeditor_comment_body']['id'] = 'ckeditor_comment_body';
  $handler->display->display_options['fields']['ckeditor_comment_body']['table'] = 'field_data_ckeditor_comment_body';
  $handler->display->display_options['fields']['ckeditor_comment_body']['field'] = 'ckeditor_comment_body';
  $handler->display->display_options['fields']['ckeditor_comment_body']['label'] = '';
  $handler->display->display_options['fields']['ckeditor_comment_body']['alter']['max_length'] = '50';
  $handler->display->display_options['fields']['ckeditor_comment_body']['alter']['strip_tags'] = TRUE;
  $handler->display->display_options['fields']['ckeditor_comment_body']['alter']['trim'] = TRUE;
  $handler->display->display_options['fields']['ckeditor_comment_body']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['ckeditor_comment_body']['settings'] = array(
    'trim_length' => '50',
  );
  /* Field: CKEditorComment: Ckeditorcomment ID */
  $handler->display->display_options['fields']['cid']['id'] = 'cid';
  $handler->display->display_options['fields']['cid']['table'] = 'ckeditor_comment';
  $handler->display->display_options['fields']['cid']['field'] = 'cid';
  /* Field: User: Name */
  $handler->display->display_options['fields']['name']['id'] = 'name';
  $handler->display->display_options['fields']['name']['table'] = 'users';
  $handler->display->display_options['fields']['name']['field'] = 'name';
  $handler->display->display_options['fields']['name']['relationship'] = 'uid';
  $handler->display->display_options['fields']['name']['label'] = 'Author';
  /* Field: CKEditorComment: Date created */
  $handler->display->display_options['fields']['created']['id'] = 'created';
  $handler->display->display_options['fields']['created']['table'] = 'ckeditor_comment';
  $handler->display->display_options['fields']['created']['field'] = 'created';
  $handler->display->display_options['fields']['created']['label'] = 'Created';
  $handler->display->display_options['fields']['created']['date_format'] = 'short';
  /* Field: Global: Custom text */
  $handler->display->display_options['fields']['nothing']['id'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['table'] = 'views';
  $handler->display->display_options['fields']['nothing']['field'] = 'nothing';
  $handler->display->display_options['fields']['nothing']['label'] = 'Edit';
  $handler->display->display_options['fields']['nothing']['alter']['text'] = 'Edit';
  $handler->display->display_options['fields']['nothing']['alter']['make_link'] = TRUE;
  $handler->display->display_options['fields']['nothing']['alter']['path'] = 'ckeditor_comment/[cid]/edit';

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'page');
  $handler->display->display_options['path'] = 'ckeditor_comment';
  $handler->display->display_options['menu']['type'] = 'normal';
  $handler->display->display_options['menu']['title'] = 'CKEditorComments';
  $handler->display->display_options['menu']['weight'] = '0';

  $views['ckeditor_comments'] = $view;

  return $views;
}