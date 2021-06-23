const path = require('path');
const fs = require('fs');
const express = require('express');
const serveStatic = require('serve-static');
const pug = require('pug');
const cwd = process.cwd();

const app = express();
app.set('etag', false);
app.set('env', 'development');

app.use(
  '/dist',
  serveStatic(path.join(cwd, 'dist'))
);

// host examples
function renderIndexHTML() {
  const source = fs.readFileSync(path.join(__dirname, '../index.pug') , 'utf-8');
  const files = fs.readdirSync(path.join(__dirname, '../pages'));
  const html = pug.render(source, {
    dirs: files.map(item => item.split('.')[0])
  });
  return html;
}
function renderExample(exampleName) {
  const templatePath = path.join(__dirname, '../pages', exampleName + '.pug');
  if (fs.existsSync(templatePath)) {
    const source = fs.readFileSync(templatePath);
    const html = pug.render(source, {
      filename: templatePath,
      title: exampleName
    });
    return html;
  } else {
    return null;
  }
}
// host assest
app.get('/', function(req, res) {
  const html = renderIndexHTML();
  res.status(200).send(html);
});
app.use(
  '/example',
  function(req, res) {
    // const root = path.join(cwd, 'example/pages');
    const reqPath = req.path;
    const targetName = reqPath === '/' || reqPath === ''
      ? 'index'
      : reqPath.slice(1);
    const html = targetName === 'index'
      ? renderIndexHTML()
      : renderExample(targetName);
    if (html === null) {
      res.end(404);
    } else {
      res.status(200).send(html);
    }
  }
);

// api
const handlers = require('./api-handlers');
const createCallback = function(handler) {
  if (typeof handler === 'function') {
    return handler;
  } else {
    return function (req, res) {
      const respond = () => {
        res.status(handler.status).send(handler.body);
      };
      if (handler.timeout === undefined) {
        respond();
      } else {
        setTimeout(respond, handler.timeout);
      }
    }
  }
}
for (const [path, config] of Object.entries(handlers)) {
  const pathRoute = app.route('/api' + path);
  if (typeof config === 'function') {
    pathRoute.all(createCallback(config()));
  } else {
    for(const [method, handler] of Object.entries(config)) {
      pathRoute[method](createCallback(handler));
    }
  }
}

const LISTEN_PORT = 3000;
app.listen(LISTEN_PORT, () => {
  console.log('Server running on: http://localhost:' + LISTEN_PORT);
});
