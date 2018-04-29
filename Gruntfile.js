// var CONFIG_COMMON = require('./config/config-common');
// var CONFIG_DEV = require('./config/config-dev');

module.exports = function (grunt) {
    var configServer = {
        port: 8384,
        path: "./fs/web/"
    };

    var config = {
        less: {
            compile: {
                files: {
                    'src/styles/styles.css': 'src/styles/styles.less'
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
                    cwd: 'src',
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
                    'fs/web/bundle.min.js': [
                        'src/web/**/*.js'
                    ]
                }
            }
        },
        watch: {
            options: {
                spawn: false
            },
            staticJS: {
                files: 'src/*.js',
                tasks: ['copy:staticFiles']
            },
            js: {
                files: 'src/**/*.js',
                tasks: ['uglify:prod']
            },
            html: {
                files: 'src/**/*.html',
                tasks: ['htmlmin']
            },
            less: {
                files: 'src/styles/*.less',
                tasks: ['less:compile', 'copy:styles']
            }
        },
        copy: {
            staticFiles: {
                files: [{
                    cwd: 'src',
                    expand: true,
                    src: ['*.js'],
                    dest: 'fs'
                }, {
                    cwd: 'src/img',
                    expand: true,
                    src: ['*.png'],
                    dest: 'fs/web'
                }]
            },
            styles: {
                files: [{
                    cwd: 'src/styles',
                    expand: true,
                    src: ['*.css'],
                    dest: 'fs/web'
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