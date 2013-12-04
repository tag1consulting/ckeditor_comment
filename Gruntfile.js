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
      ' */',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>' + grunt.util.linefeed +
          '(function ($) {' + grunt.util.linefeed,
        footer: grunt.util.linefeed + '})(jQuery)'
      },
      dist: {
        src: [
          'src/CommentPlugin.js', // Ensure the plugin loads first.
          'src/Comments.js', // Ensure CKEDITOR.Comments class loads next.
          'src/**/*.js' // Load the rest.
        ],
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
        src: 'src/**/*.js'
      }
    },
    less: {
      options: {
        cleancss: true
      },
      files: {
        src: 'src/**/*.less',
        dest: 'plugin/plugin.css'
      }
    },
    watch: {
      less: {
        files: ['src/**/*.less'],
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
          'src/**/*.js'
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
