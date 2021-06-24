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

### 使用
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

传递参数
```js
const rocket = new Rocket({
  method: 'GET',
  // 通过source可以指定路径参数
  source: 'https://my.api.server/teams/:teamId/users'
  // 通过payload格式化send传入的参数
  payload: ({teamId, userName}) => ({
    // params用于替换路径中的参数
    params: { teamId },
    // query将会拼接在url后
    query: { name: userName }
  })
});

// 通过send()传递参数
rocket.send({
  teamId: 1,
  userName: 'Mike'
});
// GET https://my.api.server/teams/1/users?name=Mike
rocket.send({
  teamId: 2
});
// GET https://my.api.server/teams/2/users
```

完整参数列表见：[RocketOption](./API.md#rocketoption)

## 示例

[Examples](./example)

## API
[API.md](./API.md)

## 插件
[Plugin.md](./PLUGIN.md)

## TODO

- [ ] 单元测试
- [ ] 兼容测试
- [ ] CI/CD
- [ ] Code style lint
- [ ] TypeScript exapmles
