#CKEditor Inline Commenting

##Installation

###Drupal Module Requirements
* [jQuery Update](https://drupal.org/project/jquery_update) - Minimum version of jQuery 1.7 is required.
* [CKEditor module](https://drupal.org/project/ckeditor) - Use the latest 7.x-1.x-dev for now.
* [Libraries API](https://drupal.org/project/libraries)
* [Entity API](https://drupal.org/project/entity)
* [Views](https://drupal.org/project/views)

###Drupal Library Requirements
* [CKEditor 4+: Full Package](http://ckeditor.com/download) - Installed in `sites/all/libraries`.
* [Rangy 1.3+](https://code.google.com/p/rangy/downloads/detail?name=rangy-1.3alpha.772.tar.gz) - Installed in `sites/all/libraries`.
* [JSON2](https://github.com/douglascrockford/JSON-js/archive/master.zip) - Installed in `sites/all/libraries`.

###Optional Library Support
* [Timeago jQuery Plugin](http://timeago.yarp.com) - Relative times for comments

###Development Requirements
If you plan on developing this module, it requires [Grunt](http://gruntjs.com) - The JavaScript Task Runner.
* Navigate into the root of this project and run: `npm install`
* After the development node modules have been installed, you can run: `grunt watch`

This watches for any changes made in the `./src` folder and automatically compile them into the appropriate `./plugin` file.

###Release
* `grunt build` - Compiles all files and increments the MINOR version of the project.
* `grunt build:major` - Compiles all files and increments the MAJOR version of the project.

###API Documentation
Grunt also automatically compiles the documentation for this plugin with [JSDuck](https://github.com/senchalabs/jsduck).
You can view the documenation at:
https://rawgithub.com/tag1consulting/ckeditor_comment/master/docs/index.html#!/api
