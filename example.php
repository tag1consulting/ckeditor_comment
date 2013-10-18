<?php

$node = node_load(1113);

$comment = new stdClass();
$comment->type = 'standard';
$comment->body = 'prog body';
$comment->position = array(14, 27);
$comment->entity_id = $node->nid;
$comment->entity_vid = $node->vid;
$comment->entity_type = 'node';
$comment->entity_bundle = $node->type;
$comment->field_name = 'body';
$comment->field_summary = 0;
$comment->uid = 1;
$comment->resolved = 1;
$comment->pid = 100;
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
