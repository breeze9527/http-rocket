# http-rocket

轻量，可扩展的HTTP cilent

## 安装

yarn:

```bash
yarn add http-rocket
```

npm:

```bash
npm i http-rocket
```

## 使用

### 引入

```js
// ESModule:
import Rocket from 'http-rocket';
// CommonJS:
const Rocket = require('http-rocket').Rocket;
// UMD:
const Rocket = widnow.rocket.Rocket;
```

### 调用
```js
// 创建实例
const rocket = new Rocket('GET', 'http://test.com/path/to/resource');

// 发送请求
const mission = rocket.send();

// 通过promise获取请求结果
mission.promise.then(resp => {
  console.log('The response data is:', resp.body);
});

// 通过abort可以取消请求
mission.abort();
```

## 实例

[Examples](./example)

## API
[API.md](./API.md)

## 插件
[Plugin.md](./PLUGIN.md)
