<?php

$node = node_load(1113);

$comment = new stdClass;
$comment->title = 'prog title';
$comment->type = 'standard';
$comment->summary = 'prog summary';
$comment->target_entity_id = $node->nid;
$comment->target_entity_revision_id = $node->vid;
$comment->target_type = 'node';
$comment->uid = 1;
$comment->created = REQUEST_TIME;
$comment->changed = REQUEST_TIME;

// Create.
ckeditor_comment_save($comment);

// Includes the correct id.
print_r($comment);

$comment->summary = 'changed summary';

// Update.
ckeditor_comment_save($comment);
$comment2 = ckeditor_comment_load($comment->cke_cid);
print_r($comment2->summary);

// Delete.
ckeditor_comment_delete($comment);