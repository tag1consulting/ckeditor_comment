<?php

$node = node_load(1113);

$comment = new stdClass;
$comment->title = 'prog title';
$comment->type = 'standard';
$comment->body = 'prog body';
$comment->entity_id = $node->nid;
$comment->entity_vid = $node->vid;
$comment->entity_type = 'node';
$comment->entity_bundle = $node->type;
$comment->field_name = 'body';
$comment->field_value = 'body_value';
$comment->uid = 1;
$comment->resolved = 1;
$comment->pcid = 100;
$comment->created = REQUEST_TIME;
$comment->changed = REQUEST_TIME;

// Create.
ckeditor_comment_save($comment);

// Includes the correct id.
print_r($comment);

$comment->body = 'changed body';

// Update.
ckeditor_comment_save($comment);
$comment2 = ckeditor_comment_load($comment->cid);
print_r($comment2->body);

// Delete.
ckeditor_comment_delete($comment);