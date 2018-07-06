// var CONFIG_COMMON = require('./config/config-common');
// var CONFIG_DEV = require('./config/config-dev');

module.exports = function (grunt) {
    var configServer = {
        port: 8384,
        path: "./fs/"
    };

    var config = {
        less: {
            compile: {
                files: {
                    'resources/styles/styles.css': 'resources/styles/styles.less'
                }
            }
        },
        clean: {
            all: ['fs']
        },
        htmlmin: {
            task: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyCSS: true
                },
                files: [{
                    expand: true,
                    cwd: 'resources/web',
                    src: ['**/*.html'],
                    dest: 'fs'
                }]
            }
        },
        uglify: {
            prod:{
                options: {
                    sourceMap: true,
                    mangle: false
                },
                files: {
                    'fs/bundle.min.js': [
                        'resources/**/*.js'
                    ]
                }
            }
        },
        watch: {
            options: {
                spawn: false
            },
            configs: {
                files: 'resources/*.json',
                tasks: ['copy:staticFiles']
            },
            js: {
                files: 'resources/**/*.js',
                tasks: ['uglify:prod']
            },
            html: {
                files: 'resources/**/*.html',
                tasks: ['htmlmin']
            },
            less: {
                files: 'resources/styles/*.less',
                tasks: ['less:compile', 'copy:styles']
            }
        },
        copy: {
            staticFiles: {
                files: [{
                    cwd: 'resources',
                    expand: true,
                    src: ['*.json'],
                    dest: 'fs'
                }, {
                    cwd: 'resources/img',
                    expand: true,
                    src: ['*.png'],
                    dest: 'fs'
                }]
            },
            styles: {
                files: [{
                    cwd: 'resources/styles',
                    expand: true,
                    src: ['*.css'],
                    dest: 'fs'
                }]
            }
        },
        browserSync: {
            dev: {
                options: {
                    port: configServer.port,
                    files: ["fs/*"],
                    watchTask: true,
                    server: {
                        baseDir: configServer.path,
                        directory: true
                    }
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.registerTask('build', ['clean:all', 'uglify:prod', 'htmlmin', 'less:compile', 'copy']);
    grunt.registerTask('continious-dev', ['build', 'browserSync:dev', 'watch']);
};