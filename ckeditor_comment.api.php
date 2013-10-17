<?php
/**
 * @file
 * Hooks provided by this module.
 */

/**
 * @addtogroup hooks
 * @{
 */

/**
 * Acts on ckeditor_comment being loaded from the database.
 *
 * This hook is invoked during $ckeditor_comment loading, which is handled by
 * entity_load(), via the EntityCRUDController.
 *
 * @param array $entities
 *   An array of $ckeditor_comment entities being loaded, keyed by id.
 *
 * @see hook_entity_load()
 */
function hook_ckeditor_comment_load(array $entities) {
  $result = db_query('SELECT pid, foo FROM {mytable} WHERE pid IN(:ids)', array(':ids' => array_keys($entities)));
  foreach ($result as $record) {
    $entities[$record->pid]->foo = $record->foo;
  }
}

/**
 * Responds when a $ckeditor_comment is inserted.
 *
 * This hook is invoked after the $ckeditor_comment is inserted into the database.
 *
 * @param CKEditorComment $ckeditor_comment
 *   The $ckeditor_comment that is being inserted.
 *
 * @see hook_entity_insert()
 */
function hook_ckeditor_comment_insert(CKEditorComment $ckeditor_comment) {
  db_insert('mytable')
    ->fields(array(
      'id' => entity_id('ckeditor_comment', $ckeditor_comment),
      'extra' => print_r($ckeditor_comment, TRUE),
    ))
    ->execute();
}

/**
 * Acts on a $ckeditor_comment being inserted or updated.
 *
 * This hook is invoked before the $ckeditor_comment is saved to the database.
 *
 * @param CKEditorComment $ckeditor_comment
 *   The $ckeditor_comment that is being inserted or updated.
 *
 * @see hook_entity_presave()
 */
function hook_ckeditor_comment_presave(CKEditorComment $ckeditor_comment) {
  $ckeditor_comment->name = 'foo';
}

/**
 * Responds to a $ckeditor_comment being updated.
 *
 * This hook is invoked after the $ckeditor_comment has been updated in the database.
 *
 * @param CKEditorComment $ckeditor_comment
 *   The $ckeditor_comment that is being updated.
 *
 * @see hook_entity_update()
 */
function hook_ckeditor_comment_update(CKEditorComment $ckeditor_comment) {
  db_update('mytable')
    ->fields(array('extra' => print_r($ckeditor_comment, TRUE)))
    ->condition('id', entity_id('ckeditor_comment', $ckeditor_comment))
    ->execute();
}

/**
 * Responds to $ckeditor_comment deletion.
 *
 * This hook is invoked after the $ckeditor_comment has been removed from the database.
 *
 * @param CKEditorComment $ckeditor_comment
 *   The $ckeditor_comment that is being deleted.
 *
 * @see hook_entity_delete()
 */
function hook_ckeditor_comment_delete(CKEditorComment $ckeditor_comment) {
  db_delete('mytable')
    ->condition('pid', entity_id('ckeditor_comment', $ckeditor_comment))
    ->execute();
}

/**
 * Act on a ckeditor_comment that is being assembled before rendering.
 *
 * @param $ckeditor_comment
 *   The ckeditor_comment entity.
 * @param $view_mode
 *   The view mode the ckeditor_comment is rendered in.
 * @param $langcode
 *   The language code used for rendering.
 *
 * The module may add elements to $ckeditor_comment->content prior to rendering. The
 * structure of $ckeditor_comment->content is a renderable array as expected by
 * drupal_render().
 *
 * @see hook_entity_prepare_view()
 * @see hook_entity_view()
 */
function hook_ckeditor_comment_view($ckeditor_comment, $view_mode, $langcode) {
  $ckeditor_comment->content['my_additional_field'] = array(
    '#markup' => $additional_field,
    '#weight' => 10,
    '#theme' => 'mymodule_my_additional_field',
  );
}

/**
 * Alter the results of entity_view() for ckeditor_comment.
 *
 * @param $build
 *   A renderable array representing the ckeditor_comment content.
 *
 * This hook is called after the content has been assembled in a structured
 * array and may be used for doing processing which requires that the complete
 * ckeditor_comment content structure has been built.
 *
 * If the module wishes to act on the rendered HTML of the ckeditor_comment rather than
 * the structured content array, it may use this hook to add a #post_render
 * callback. Alternatively, it could also implement hook_preprocess_ckeditor_comment().
 * See drupal_render() and theme() documentation respectively for details.
 *
 * @see hook_entity_view_alter()
 */
function hook_ckeditor_comment_view_alter($build) {
  if ($build['#view_mode'] == 'full' && isset($build['an_additional_field'])) {
    // Change its weight.
    $build['an_additional_field']['#weight'] = -10;

    // Add a #post_render callback to act on the rendered HTML of the entity.
    $build['#post_render'][] = 'my_module_post_render';
  }
}

/**
 * Acts on ckeditor_comment_type being loaded from the database.
 *
 * This hook is invoked during ckeditor_comment_type loading, which is handled by
 * entity_load(), via the EntityCRUDController.
 *
 * @param array $entities
 *   An array of ckeditor_comment_type entities being loaded, keyed by id.
 *
 * @see hook_entity_load()
 */
function hook_ckeditor_comment_type_load(array $entities) {
  $result = db_query('SELECT pid, foo FROM {mytable} WHERE pid IN(:ids)', array(':ids' => array_keys($entities)));
  foreach ($result as $record) {
    $entities[$record->pid]->foo = $record->foo;
  }
}

/**
 * Responds when a ckeditor_comment_type is inserted.
 *
 * This hook is invoked after the ckeditor_comment_type is inserted into the database.
 *
 * @param CKEditorCommentType $ckeditor_comment_type
 *   The ckeditor_comment_type that is being inserted.
 *
 * @see hook_entity_insert()
 */
function hook_ckeditor_comment_type_insert(CKEditorCommentType $ckeditor_comment_type) {
  db_insert('mytable')
    ->fields(array(
      'id' => entity_id('ckeditor_comment_type', $ckeditor_comment_type),
      'extra' => print_r($ckeditor_comment_type, TRUE),
    ))
    ->execute();
}

/**
 * Acts on a ckeditor_comment_type being inserted or updated.
 *
 * This hook is invoked before the ckeditor_comment_type is saved to the database.
 *
 * @param CKEditorCommentType $ckeditor_comment_type
 *   The ckeditor_comment_type that is being inserted or updated.
 *
 * @see hook_entity_presave()
 */
function hook_ckeditor_comment_type_presave(CKEditorCommentType $ckeditor_comment_type) {
  $ckeditor_comment_type->name = 'foo';
}

/**
 * Responds to a ckeditor_comment_type being updated.
 *
 * This hook is invoked after the ckeditor_comment_type has been updated in the database.
 *
 * @param CKEditorCommentType $ckeditor_comment_type
 *   The ckeditor_comment_type that is being updated.
 *
 * @see hook_entity_update()
 */
function hook_ckeditor_comment_type_update(CKEditorCommentType $ckeditor_comment_type) {
  db_update('mytable')
    ->fields(array('extra' => print_r($ckeditor_comment_type, TRUE)))
    ->condition('id', entity_id('ckeditor_comment_type', $ckeditor_comment_type))
    ->execute();
}

/**
 * Responds to ckeditor_comment_type deletion.
 *
 * This hook is invoked after the ckeditor_comment_type has been removed from the database.
 *
 * @param CKEditorCommentType $ckeditor_comment_type
 *   The ckeditor_comment_type that is being deleted.
 *
 * @see hook_entity_delete()
 */
function hook_ckeditor_comment_type_delete(CKEditorCommentType $ckeditor_comment_type) {
  db_delete('mytable')
    ->condition('pid', entity_id('ckeditor_comment_type', $ckeditor_comment_type))
    ->execute();
}

/**
 * Define default ckeditor_comment_type configurations.
 *
 * @return
 *   An array of default ckeditor_comment_type, keyed by machine names.
 *
 * @see hook_default_ckeditor_comment_type_alter()
 */
function hook_default_ckeditor_comment_type() {
  $defaults['main'] = entity_create('ckeditor_comment_type', array(
    // …
  ));
  return $defaults;
}

/**
 * Alter default ckeditor_comment_type configurations.
 *
 * @param array $defaults
 *   An array of default ckeditor_comment_type, keyed by machine names.
 *
 * @see hook_default_ckeditor_comment_type()
 */
function hook_default_ckeditor_comment_type_alter(array &$defaults) {
  $defaults['main']->name = 'custom name';
}
