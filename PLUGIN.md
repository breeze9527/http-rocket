# Plugin

plugin是http-rocket可扩展性的主要体现方式，通过plugin可以改变请求参数和响应的数据，实现对请求/响应过程的自定义。

## Plugin类

`Plugin`是所有插件的基类，用户可以通过继承`Plugin`类并实现特定生命周期方法来实现自定义请求参数/响应数据的功能。

## 生命周期

http-rocket在请求/响应的过程中，在不同的生命周期会按照既定的顺序调用对应的生命周期钩子，插件可以在钩子函数中访问上下文信息，获取用户通过[Payload](./API.md#payload)传递给插件的参数，并且可以在特定的生命周期修改请求参数与响应数据。

根据钩子函数的调用类型可以将生命周期分为**异步**与**同步**两类。

同步钩子在对应的生命周期会被按照顺序一个接一个的同步调用，在一个同步生命周期中，来自不同插件的钩子函数接收的上下文参数都是同一个只读对象（[frozen object][frozenObject]），因此在同步钩子中适合实现类似记录，快照的功能。

异步钩子则可以通过回调函数达到修改上下文信息、控制生命周期的目的，适合实现修改请求参数、编解码响应信息等功能。

异步钩子都可以返回一个函数当作取消器，在用户调用`mission.abort()`的时候会调用这个取消器，如果插件返回了取消器，那么应该在取消器中通过回调函数抛出适当的错误。

```ts
import { Plugin, AbortError } from 'http-rocket';
class SomePlugin extends Plugin {
  request(context, option, callback) {
    asyncJob.start();
    return function canceller() {
      asyncJob.end();
      // 这里通过callback抛出了一个AbortError
      callback(new AbortError());
    }
  }
}


```

现有的生命周期为（按照调用顺序排序）:

- [preRequest](#prerequest)
- [request](#request)
- [preFetch](#prefetch)
- [fetch](#fetch)
- [postFetch](#postfetch)
- [respond](#respond)
- [postRespond](#postRespond)

其中`request`、`fetch`、`respond`是异步的，其余则是同步。
### preRequest

```js
Plugin#preRequest(context, option)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数

`preRequest`在用户执行`mission#send()`后执行。插件可以在这个钩子中访问未经其他插件修改的请求参数。

>`context`是只读对象，插件不应该在`preRequest`中修改上下文。


### request
```js
Plugin#request(context, option, callback)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数
- `callback` \<function\> 回调函数
- Returns: \<function\> | `undefined`

`request`在请求发送前执行，通过回调函数可以修改请求参数。

`callback`有三种调用形式：
- `callback()`：表示当前插件不修改上下文信息。
- `callback(error: RocketError)`：抛出错误，在`request`阶段抛出错误将会跳过剩余插件`request`钩子的执行，并且跳过`preFetch`、`fetch`、`postFetch`生命周期。
- `callback(null, newContext: RequestContext)`：使用`newContext`替换当前的[请求上下文][RequestContext]，并继续执行当前生命周期的其他钩子函数。

>`context`是只读对象，插件不应该直接修改`context`而是通过`callback`更新上下文。

### preFetch
```js
Plugin#preFetch(context, option)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数

`preFetch`在请求发送前、`request`周期后执行。插件可以在这个生命周期通过上下文访问经过修改的请求参数。

>`context`是只读对象，插件不应该在`preFetch`中修改上下文。

### fetch
```js
Plugin#fetch(context, option, callback)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数
- `callback`: \<function\> 回调函数
- Returns: \<function\> | `undefined` 取消器

`fetch`在发送请求时执行，请求上下文在经过`request`的修改后传递给`fetch`。`fetch`钩子的主要作用是自定义从输入（`context`）到输出（`response`）的过程。

`callback`有三种调用形式：
- `callback()`：不对当前请求做出响应，将控制权交给下一个钩子函数。
- `callback(error: RocketError)`：当前请求应该抛出一个[错误响应][RocketError]。
- `callback(null, response: Response)`：表示当前请求成功响应，[响应数据][Response]为`response`。

当一个插件的`fetch`钩子抛出了错误或是指定了响应数据后，会跳过剩余插件`fetch`钩子的执行。

当所有`fetch`钩子都执行完毕还没有响应数据或错误时，则会通过执行`adapter`获取响应。

>`context`是只读对象，插件不应该直接修改`context`而是通过`callback`更新上下文。

### postFetch
```js
Plugin#postFetch(context, option)
```
- `context`: [\<RocketContext\>][RocketContext] 响应上下文
- `option`: \<any\> 插件参数

`postFetch`请求完成响应之后执行，`context`包含`fetch`阶段返回的响应数据或错误。插件通过`postFetch`钩子可以获取请求返回的原始信息。

>`context`是只读对象，插件不应该在`postFetch`中修改上下文。

### respond
```js
Plugin#respond(context, option)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数
- `callback`: \<function\> 回调函数
- Returns: \<function\> | `undefined` 取消器

`respond`在完成响应前执行，插件可以在`respond`钩子中修改响应数据。

`callback`有三种调用形式：
- `callback()`：不对当前响应信息作出修改。
- `callback(error: RocketError)`：使用[错误对象][RocketError]替换当前响应。
- `callback(null, response: Response)`：使用`response`替换当前的[响应数据][Response]

在`respond`中使用`callback`抛出错误或是更新响应只会改变[响应上下文][RespondContext]（`RocketContext#respond`）的数据，不会阻碍后续钩子的执行。

### postRespond
```js
Plugin#postRespond(context, option)
```
- `context`: [\<RocketContext\>][RocketContext] 上下文信息
- `option`: \<any\> 插件参数

`postRespond`在`respond`后执行，插件可以在`postRespond`中获取最终将要返回给用户的响应数据。

>`context`是只读对象，插件不应该在`postRespond`中修改上下文。

## 调用顺序

不同插件间相同生命周期钩子的调用顺序与插件在`RocketOption#plugins`中的配置顺序相反。

```ts
class PluginA extends Plugin {
  request() { /*...*/ }
  preFetch() { /*...*/ }
  fetch() { /*...*/ }
}
class PluginB extends Plugin {
  preRequest() { /*...*/ }
  preFetch() { /*...*/ }
  fetch() { /*...*/ }
}
class PluginC extends Plugin {
  preRequest() { /*...*/ }
  request() { /*...*/ }
}
new Rocket({
  // ...
  plugins: [
    new PluginA(),
    new PluginB(),
    new PluginC()
  ]
});
/**
 * 则调用顺序为
 * 
 * PluginC#preRequest
 * PluginB#preRequest
 * PluginC#request
 * PluginA#request
 * PluginB#preFetch
 * PluginA#preFetch
 * PluginB#fetch
 * PluginA#fetch
 */
```

## 示例

- [plugin](./example/pages/plugin.pug)
- [fetch-plugin](./example/pages/fetch-plugin.pug)

[RocketContext]: ./API.md#rocketcontext
[RequestContext]: ./API.md#requestcontext
[RespondContext]: ./API.md#respondcontext
[Response]: ./API.md#response
[RocketError]: ./API.md#rocketerror
[frozenObject]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
