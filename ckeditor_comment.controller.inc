<?php

class CKEditorCommentController extends EntityAPIController {

  public function create(array $values = array()) {
    global $user;
    $values += array(
      'title' => '',
      'body' => '',
      'pcid' => 0,
      'resolved' => 0,
      'entity_id' => '',
      'entity_vid' => '',
      'entity_type' => 'node',
      'entity_bundle' => '',
      'field_name' => '',
      'field_value' => '',
      'created' => REQUEST_TIME,
      'changed' => REQUEST_TIME,
      'uid' => $user->uid,
    );
    return parent::create($values);
  }

  public function buildContent($entity, $view_mode = 'full', $langcode = NULL, $content = array()) {
    $wrapper = entity_metadata_wrapper('ckeditor_comment', $entity);
    $content['author'] = array('#markup' => t('Created by: !author', array('!author' => $wrapper->uid->name->value(array('sanitize' => TRUE)))));

    // Make Summary and Status themed like default fields.
    $content['body'] = array(
      '#theme' => 'field',
      '#weight' => 0,
      '#title' =>t('Description'),
      '#access' => TRUE,
      '#label_display' => 'above',
      '#view_mode' => 'full',
      '#language' => LANGUAGE_NONE,
      '#field_name' => 'field_fake_body',
      '#field_type' => 'text',
      '#entity_type' => 'ckeditor_comment',
      '#bundle' => $entity->type,
      '#items' => array(array('value' => $entity->body)),
      '#formatter' => 'text_default',
      0 => array('#markup' => check_plain($entity->body))
    );

    return parent::buildContent($entity, $view_mode, $langcode, $content);
  }
}

 class CKEditorCommentTypeController extends EntityAPIControllerExportable {
   public function create(array $values = array()) {
    $values += array(
      'label' => '',
      'description' => '',
    );
    return parent::create($values);
  }

  /**
   * Save CKEditor Comment Type.
   */
  public function save($entity, DatabaseTransaction $transaction = NULL) {
    parent::save($entity, $transaction);
    // Rebuild menu registry. We do not call menu_rebuild directly, but set
    // variable that indicates rebuild in the end.
    // @see http://drupal.org/node/1399618
    variable_set('menu_rebuild_needed', TRUE);
  }
}

/**
 * UI controller for CKEditor Comment Type.
 */
class CKEditorCommentTypeUIController extends EntityDefaultUIController {
  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {
    $items = parent::hook_menu();
    $items[$this->path]['description'] = 'Manage CKEditorComment types.';
    return $items;
  }
}

/**
 * CKEditorComment class.
 */
class CKEditorComment extends Entity {
  protected function defaultLabel() {
    return $this->title;
  }

  protected function defaultUri() {
    return array('path' => 'ckeditor_comment/' . $this->identifier());
  }
}

/**
 * CKEditor Comment Type class.
 */
class CKEditorCommentType extends Entity {
  public $type;
  public $label;
  public $weight = 0;

  public function __construct($values = array()) {
    parent::__construct($values, 'ckeditor_comment_type');
  }

  function isLocked() {
    return isset($this->status) && empty($this->is_new) && (($this->status & ENTITY_IN_CODE) || ($this->status & ENTITY_FIXED));
  }
}
