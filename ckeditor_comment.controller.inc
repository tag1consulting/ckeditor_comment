<?php
/**
 * @file
 * ckeditor_comment classes.
 */

/**
 * Class CKEditorCommentController.
 */
class CKEditorCommentController extends EntityAPIController {
  /**
   * {@inheritdoc}
   */
  public function create(array $values = array()) {
    return parent::create($values);
  }
}

/**
 * Class CKEditorCommentTypeController.
 */
class CKEditorCommentTypeController extends EntityAPIControllerExportable {
  /**
   * {@inheritdoc}
   */
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
  /**
   * @{inheritdoc}
   */
  public function __construct(array $values = array(), $entityType = NULL) {
    parent::__construct($values, 'ckeditor_comment');
  }

  protected function defaultLabel() {
    return truncate_utf8(strip_tags($this->ckeditor_comment_body[LANGUAGE_NONE][0]['value']), 50, TRUE, TRUE);
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
