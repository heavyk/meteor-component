Package.describe({
  summary: "let component manage your dependencies"
});

var fs = require('fs');
var Path = require('path');
var url = require('url');
var Fiber = require('fibers');
var Future = require('fibers/future');
var _ = require('../../packages/underscore/underscore.js');
var Component = require('component');
var Builder = require('component-builder');
var Batch = require('batch');
var utils = Component.utils;
var log = utils.log;

const odir = Path.join(".meteor", "build");
const css_path = Path.join(odir, 'build.css');
const js_path = Path.join(odir, 'build.js');
const component_json_path = Path.join(".meteor", "component.json");

try {
  fs.mkdirSync(odir);
} catch(e) {}

function normalize(deps) {
  return Object.keys(deps).map(function(name){
    return name + '@' + deps[name];
  });
}

Package.register_extension(
  "json", function (bundle, source_path, serve_path, where) {
    if(serve_path === "/component.json") {
      var conf = require(source_path);
      var pkgs = conf.dependencies;
      if(!pkgs) return;
      Fiber(function() {
        var st, this_st = fs.statSync(source_path);
        ///*
        try {
          st = fs.statSync(component_json_path);
        } catch(e) {}

        if(!st || st.mtime.getTime() !== this_st.mtime.getTime()) {
          contents = fs.readFileSync(source_path);
          fs.writeFileSync(component_json_path, contents);
          fs.utimesSync(component_json_path, new Date, this_st.mtime);

          var dev = true; // XXX: get this from the config
          if(dev && conf.development) {
            pkgs = pkgs.concat(normalize(conf.development));
          }

          conf.remotes = conf.remotes || [];
          conf.remotes.push('https://raw.github.com');

          var install = function(name, version, cb) {
            var i = 0;
            var report = function(pkg, options) {
              options = options || {};
              if(pkg.inFlight) return;
              log('install', pkg.name + '@' + pkg.version);

              pkg.on('error', function(err){
                if (404 != err.status) utils.fatal(err.stack);
                if (false !== options.error) {
                  log('error', err.message);
                  //process.exit(1);
                  if(pkg.name === name) cb(err);
                }
              });

              pkg.on('dep', function(dep){
                log('dep', dep.name + '@' + dep.version);
                report(dep);
              });

              pkg.on('exists', function(dep){
                log('exists', dep.name + '@' + dep.version);
              });

              pkg.on('file', function(file){
                log('fetch', pkg.name + ':' + file);
              });

              pkg.on('end', function(){
                log('complete', pkg.name);
                if(pkg.name === name) cb();
              });
            };
            var pkg = Component.install(name, version, {
              dest: ".meteor/components",
              dev: dev,
              remotes: conf.remotes
            });

            report(pkg);
            pkg.install();
          };

          batch = new Batch
          _.each(pkgs, function(url, pkg) {
            batch.push(function(done) {
              var parts = pkg.split('@');
              var name = parts.shift();
              var version = parts.shift() || 'master';
              var rname = pkg.replace('/', '-');
              //TODO: if some time has passed, say 2-3 days, do an update instead of skipping it (for master)
              //TODO: when implementing specific versions, do a version compare here and update if necessary
              if(fs.existsSync(Path.join(odir, name))) return;
              install(name, version, done);
            });
          });
          var future = new Future;
          batch.end(function() {future.return()});
          future.wait()
          try {
            fs.utimesSync(js_path, new Date, new Date);
          } catch(e) {}
        }
        //*/

        try {
          st = fs.statSync(js_path);
        } catch(e) {}
        if(!st || st.mtime.getTime() !== this_st.mtime.getTime()) {
          //TODO: use serve_path to determine the location in the build dir
          var builder = new Builder(Path.join(process.cwd(), ".meteor"));
          var start = new Date;
          builder.development();
          builder.copyFiles();
          builder.addLookup(Path.join(process.cwd(), ".meteor", "components"));
          console.log();
          future = new Future;
          builder.build(function(err, obj){
            if (err) {
              Component.utils.fatal(err.message);
              future.return(err);
            }

            fs.writeFileSync(css_path, obj.css);
            fs.utimesSync(css_path, new Date, this_st.mtime);

            var name = typeof conf.name === 'string' ? conf.name : 'component';
            var js = '(function(){\n' + obj.require + obj.js + 'window.component = {require:require};\n})();';
            fs.writeFileSync(js_path, js);
            fs.utimesSync(js_path, new Date, this_st.mtime);

            bundle.add_resource({
              type: "js",
              path: "/component.js",
              data: "" + js,
              where: 'client'
            });

            bundle.add_resource({
              type: "css",
              path: "/component.css",
              data: "" + obj.css,
              where: 'client'
            });

            var duration = new Date - start;
            log('write', js_path);
            log('write', css_path);
            log('js', (js.length / 1024 | 0) + 'kb');
            log('css', (obj.css.length / 1024 | 0) + 'kb');
            log('duration', duration + 'ms');
            console.log();
            future.return();
          });
          future.wait();
        } else {
          // TODO: add an interface which lets the user know that the files are being built
          try {
            var contents = fs.readFileSync(js_path);
            bundle.add_resource({
              type: "js",
              path: "/component.js",
              data: contents,
              where: 'client'
            });
          } catch(e) {}

          try {
            var contents = fs.readFileSync(css_path);
            bundle.add_resource({
              type: "css",
              path: "/component.css",
              data: contents,
              where: 'client'
            });
          } catch(e) {}
        }
      }).run();
    }
  }
);

Package.on_test(function (api) {
  api.add_files(['component_tests.js'], 'server');
});
