# CKEditor Inline Commenting

---

> **NOTE:** This project was only ever created as a proof-of-concept and mainly intended for interal purposes that no longer exist. It was never properly finished and is no longer being developed. We may pick it up again in the future, but for now please don't expect it to be "fully functional".

---

## Installation

### Drupal Module Requirements

* [jQuery Update](https://drupal.org/project/jquery_update) - Minimum version of jQuery 1.7 is required.
* [CKEditor module](https://drupal.org/project/ckeditor) - Use the latest 7.x-1.x-dev for now.
* [Libraries API](https://drupal.org/project/libraries)
* [Entity API](https://drupal.org/project/entity)
* [Views](https://drupal.org/project/views)

### Drupal Library Requirements
* [CKEditor 4.3+](http://ckeditor.com/builder) - Requires `Full Package` plus the `Widget` plugin (must add manually) installed in `sites/all/libraries`.
* [Rangy 1.3+](https://code.google.com/p/rangy/downloads/detail?name=rangy-1.3alpha.772.tar.gz) - Installed in `sites/all/libraries`.
* [JSON2](https://github.com/douglascrockford/JSON-js/archive/master.zip) - Installed in `sites/all/libraries`.

### Optional Library Support
* [Timeago jQuery Plugin](http://timeago.yarp.com) - Relative times for comments

## Configuration
To enable CKEditor comments, there is a three step process:

  1. __CKEditor Profiles__: It is recommended to enable the actual plugin for all CKEditor profiles, regardless if you will use them on the profile. This can be done by visiting `admin/config/content/ckeditor`. Under your profile's `Editor appearance` section:
    * Drag and drop the comment icon (![comment](https://raw.github.com/tag1consulting/ckeditor_comment/master/plugin/comment.png)) to the position you desire on your toolbar.
    * Then enable the `CKEditor comments` plugin below it.
  2. __Fields__: Both `Long text` and `Long text with summary` field types can be independantly managed to enable inline commenting. Edit the field and check `Enable inline comments in CKEditor` under the `Text processing` section.
  3. __Filter__: A field raw value may contain comment wrappers: `<comment data-cid="1234">my commented text</comment>`. This helps ensure better comment positioning when initially loading comments. To filter these out and un-wrap the commented text from these tags for you displayed (safe) value:
    * Go to the text format that handles this field: `admin/config/content/formats` and click edit.
    * Enable the `Clean CKEditor comments` filter.

## Development
If you plan on developing this module, it requires [Grunt](http://gruntjs.com) - The JavaScript Task Runner.
* Navigate into the root of this project and run: `npm install`
* After the development node modules have been installed, you can run: `grunt watch`

This watches for any changes made in the `./src` folder and automatically compile them into the appropriate `./plugin` file.

### Release
* `grunt build` - Compiles all files and increments the MINOR version of the project.
* `grunt build:major` - Compiles all files and increments the MAJOR version of the project.

### API Documentation
Grunt also automatically compiles the documentation for this plugin with [JSDuck](https://github.com/senchalabs/jsduck).
You can view the documenation at:
https://rawgithub.com/tag1consulting/ckeditor_comment/master/docs/index.html#!/api
