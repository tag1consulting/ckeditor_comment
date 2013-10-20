<?php

/**
 * Generates the ckeditor_comment type editing form.
 */
function ckeditor_comment_type_form($form, &$form_state, $comment_type, $op = 'edit') {

  if ($op == 'clone') {
    $comment_type->label .= ' (cloned)';
    $comment_type->type = '';
  }

  $form['label'] = array(
    '#title' => t('Label'),
    '#type' => 'textfield',
    '#default_value' => $comment_type->label,
    '#description' => t('The human-readable name of this ckeditor_comment type.'),
    '#required' => TRUE,
    '#size' => 30,
  );

  // Machine-readable type name.
  $form['type'] = array(
    '#type' => 'machine_name',
    '#default_value' => isset($comment_type->type) ? $comment_type->type : '',
    '#maxlength' => 32,
    '#disabled' => $comment_type->isLocked() && $op != 'clone',
    '#machine_name' => array(
      'exists' => 'ckeditor_comment_types',
      'source' => array('label'),
    ),
    '#description' => t('A unique machine-readable name for this ckeditor_comment type. It must only contain lowercase letters, numbers, and underscores.'),
  );

  $form['description'] = array(
    '#type' => 'textarea',
    '#default_value' => isset($comment_type->description) ? $comment_type->description : '',
    '#description' => t('Description about the ckeditor_comment type.'),
  );

  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save ckeditor_comment type'),
    '#weight' => 40,
  );

  if (!$comment_type->isLocked() && $op != 'add' && $op != 'clone') {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete ckeditor_comment type'),
      '#weight' => 45,
      '#limit_validation_errors' => array(),
      '#submit' => array('ckeditor_comment_type_form_submit_delete')
    );
  }
  return $form;
}

/**
 * Submit handler for creating/editing ckeditor_comment_type.
 */
function ckeditor_comment_type_form_submit(&$form, &$form_state) {
  $comment_type = entity_ui_form_submit_build_entity($form, $form_state);
  // Save and go back.
  ckeditor_comment_type_save($comment_type);

  // Redirect user back to list of ckeditor_comment types.
  $form_state['redirect'] = 'admin/structure/ckeditor_comment-types';
}

function ckeditor_comment_type_form_submit_delete(&$form, &$form_state) {
  $form_state['redirect'] = 'admin/structure/ckeditor_comment-types/' . $form_state['ckeditor_comment_type']->type . '/delete';
}

/**
 * CKEditorComment type delete form.
 */
function ckeditor_comment_type_form_delete_confirm($form, &$form_state, $comment_type) {
  $form_state['ckeditor_comment_type'] = $comment_type;
  // Always provide entity id in the same form key as in the entity edit form.
  $form['ckeditor_comment_type_id'] = array('#type' => 'value', '#value' => entity_id('ckeditor_comment_type' ,$comment_type));
  return confirm_form($form,
    t('Are you sure you want to delete ckeditor_comment type %title?', array('%title' => entity_label('ckeditor_comment_type', $comment_type))),
    'ckeditor_comment/' . entity_id('ckeditor_comment_type' ,$comment_type),
    t('This action cannot be undone.'),
    t('Delete'),
    t('Cancel')
  );
}

/**
 * CKEditorComment type delete form submit handler.
 */
function ckeditor_comment_type_form_delete_confirm_submit($form, &$form_state) {
  $comment_type = $form_state['ckeditor_comment_type'];
  ckeditor_comment_type_delete($comment_type);

  watchdog('ckeditor_comment_type', '@type: deleted %title.', array('@type' => $comment_type->type, '%title' => $comment_type->label));
  drupal_set_message(t('@type %title has been deleted.', array('@type' => $comment_type->type, '%title' => $comment_type->label)));

  $form_state['redirect'] = 'admin/structure/ckeditor_comment-types';
}

/**
 * Page to select ckeditor_comment Type to add new ckeditor_comment.
 */
function ckeditor_comment_admin_add_page() {
  $items = array();
  foreach (ckeditor_comment_types() as $comment_type_key => $comment_type) {
    $items[] = l(entity_label('ckeditor_comment_type', $comment_type), 'ckeditor_comment/add/' . $comment_type_key);
  }
  return array('list' => array('#theme' => 'item_list', '#items' => $items, '#title' => t('Select type of ckeditor_comment to create.')));
}

/**
 * Add new ckeditor_comment page callback.
 */
function ckeditor_comment_add($type) {
  $comment_type = ckeditor_comment_types($type);

  $comment = entity_create('ckeditor_comment', array('type' => $type));
  drupal_set_title(t('Create @name', array('@name' => entity_label('ckeditor_comment_type', $comment_type))));

  $output = drupal_get_form('ckeditor_comment_form', $comment);

  return $output;
}

/**
 * CKEditorComment Form.
 */
function ckeditor_comment_form($form, &$form_state, $comment) {
  $form_state['ckeditor_comment'] = $comment;

  $form['body'] = array(
    '#type' => 'textarea',
    '#title' => t('Comment'),
    '#default_value' => $comment->body,
  );

  $form['pid'] = array(
    '#title' => t('Parent ID'),
    '#type' => 'textfield',
    '#value' => $comment->pid,
  );

  $form['bookmarks'] = array(
    '#type' => 'textfield',
    '#required' => TRUE,
    '#title' => t('Bookmarks'),
    '#default_value' => $comment->bookmarks,
  );

  $form['resolved'] = array(
    '#title' => t('Resolved'),
    '#type' => 'textfield',
    '#value' => $comment->resolved,
  );

  $form['uid'] = array(
    '#title' => t('UID'),
    '#type' => 'textfield',
    '#value' => $comment->uid,
  );

  $form['entity_type'] = array(
    '#title' => t('Entity Type'),
    '#type' => 'textfield',
    '#value' => $comment->entity_type,
  );

  $form['entity_bundle'] = array(
    '#title' => t('Entity Bundle'),
    '#type' => 'textfield',
    '#value' => $comment->entity_bundle,
  );

  $form['entity_id'] = array(
    '#title' => t('Entity ID'),
    '#type' => 'textfield',
    '#value' => $comment->entity_id,
  );

  $form['entity_vid'] = array(
    '#title' => t('Entity VID'),
    '#type' => 'textfield',
    '#value' => $comment->entity_vid,
  );

  $form['field_name'] = array(
    '#title' => t('Field Name'),
    '#type' => 'textfield',
    '#value' => $comment->field_name,
  );

  $form['field_summary'] = array(
    '#title' => t('Field Summary'),
    '#type' => 'textfield',
    '#value' => $comment->field_summary,
  );

  field_attach_form('ckeditor_comment', $comment, $form, $form_state);

  $submit = array();
  if (!empty($form['#submit'])) {
    $submit += $form['#submit'];
  }

  $form['actions'] = array(
    '#weight' => 100,
  );

  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save comment'),
    '#submit' => $submit + array('ckeditor_comment_form_submit'),
  );

  // Show Delete button if we edit ckeditor_comment.
  $comment_id = entity_id('ckeditor_comment' ,$comment);
  if (!empty($comment_id) && ckeditor_comment_access('edit', $comment)) {
    $form['actions']['delete'] = array(
      '#type' => 'submit',
      '#value' => t('Delete'),
      '#submit' => array('ckeditor_comment_form_submit_delete'),
    );
  }

  $form['#validate'][] = 'ckeditor_comment_form_validate';

  return $form;
}

function ckeditor_comment_form_validate($form, &$form_state) {

}

/**
 * CKEditorComment submit handler.
 */
function ckeditor_comment_form_submit($form, &$form_state) {
  $comment = $form_state['ckeditor_comment'];

  entity_form_submit_build_entity('ckeditor_comment', $comment, $form, $form_state);

  ckeditor_comment_save($comment);

  $comment_uri = entity_uri('ckeditor_comment', $comment);

  $form_state['redirect'] = $comment_uri['path'];

  drupal_set_message(t('CKEditorComment %title saved.', array('%title' => entity_label('ckeditor_comment', $comment))));
}

function ckeditor_comment_form_submit_delete($form, &$form_state) {
  $comment = $form_state['ckeditor_comment'];
  $comment_uri = entity_uri('ckeditor_comment', $comment);
  $form_state['redirect'] = $comment_uri['path'] . '/delete';
}

/**
 * Delete confirmation form.
 */
function ckeditor_comment_delete_form($form, &$form_state, $comment) {
  $form_state['ckeditor_comment'] = $comment;
  // Always provide entity id in the same form key as in the entity edit form.
  $form['ckeditor_comment_type_id'] = array('#type' => 'value', '#value' => entity_id('ckeditor_comment' ,$comment));
  $comment_uri = entity_uri('ckeditor_comment', $comment);
  return confirm_form($form,
    t('Are you sure you want to delete ckeditor_comment %title?', array('%title' => entity_label('ckeditor_comment', $comment))),
    $comment_uri['path'],
    t('This action cannot be undone.'),
    t('Delete'),
    t('Cancel')
  );
}

/**
 * Delete form submit handler.
 */
function ckeditor_comment_delete_form_submit($form, &$form_state) {
  $comment = $form_state['ckeditor_comment'];
  ckeditor_comment_delete($comment);

  drupal_set_message(t('CKEditorComment %title deleted.', array('%title' => entity_label('ckeditor_comment', $comment))));

  $form_state['redirect'] = '<front>';
}
