/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/**\n' +
      ' * @file\n' +
      ' * <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
      ' * A plugin for supporting inline commenting in CKEditor.\n' +
      ' *\n' +
      '<%= pkg.homepage ? " * Homepage: " + pkg.homepage + "\\n" : "" %>' +
      ' * Author: <%= pkg.author.name %> (<%= pkg.author.url %>)\n' +
      ' * Last build: <%= grunt.template.today("yyyy-mm-dd h:MM:ss TT Z") %>\n' +
      ' */\n',
    // Task configuration.
    concat: {
      options: {
        stripBanners: {
          block: true,
          line: true
        },
        banner: '<%= banner %>' + grunt.util.linefeed +
          '(function ($) {' + grunt.util.linefeed +
          '  "use strict";' + grunt.util.linefeed + grunt.util.linefeed,
        footer: grunt.util.linefeed + '})(jQuery);' + grunt.util.linefeed,
        process: function (src) {
          src = grunt.util.normalizelf(src);
          return src.split(grunt.util.linefeed).map(function (line) {
            return '  ' + line;
          }).join(grunt.util.linefeed);
        }
      },
      dist: {
        src: ['plugin/modules/*.js'],
        dest: 'plugin/plugin.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        report: 'gzip'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'plugin/plugin.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          "$": true,
          "jQuery": true,
          "Drupal": true,
          "CKEDITOR": true,
          "rangy": true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      modules: {
        src: 'plugin/modules/*.js'
      }
    },
    less: {
      options: {
        cleancss: true
      },
      files: {
        src: 'plugin/less/**/*.less',
        dest: 'plugin/css/comments.css'
      }
    },
    watch: {
      less: {
        files: ['plugin/less/**/*.less'],
        tasks: ['less']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['default']
      },
      modules: {
        files: '<%= jshint.modules.src %>',
        tasks: ['default']
      }
    },
    release: {
      options: {
        add: false,
        commit: false,
        tag: false,
        push: false,
        pushTags: false,
        npm: false
      }
    },
    jsduck: {
      main: {
        // source paths with your code
        src: [
          'plugin/modules/**/*.js'
        ],
        // docs output dir
        dest: 'docs',
        // extra options
        options: {
          'tags': ['jsduck.tags.rb'],
          'ignore-global': true,
          'ignore-html': ['time'],
          'warnings': ['-global', '-type_name'],
          'external': ['XMLHttpRequest', 'CKEDITOR']
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-jsduck');

  // Default task.
  grunt.registerTask('default', ['release:patch', 'jshint', 'concat', 'uglify', 'jsduck']);
  // Build task.
  grunt.registerTask('build', ['release:minor', 'jshint', 'concat', 'uglify', 'less', 'jsduck']);
  grunt.registerTask('build:major', ['release:major', 'jshint', 'concat', 'uglify', 'less', 'jsduck']);

};
