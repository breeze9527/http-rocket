# Plugin

plugin是http-rocket可扩展性的主要体现方式，通过plugin可以改变请求参数和响应的数据，实现对请求/响应过程的自定义。

## Plugin类

`Plugin`是所有插件的基类，用户可以通过继承`Plugin`类并实现特定生命周期方法来实现自定义请求参数/响应数据的功能。

## 生命周期

http-rocket在请求/响应的过程中，在不同的生命周期会按照既定的顺序调用对应的生命周期钩子，插件可以在钩子函数中获取对应的上下文信息和[Payload](./API.md#payload)中传递给插件的参数，并且可以在在特定的生命周期修改请求参数与响应数据。

现有的生命周期为(按照调用顺序排序):

- [preRequest](#prerequest)
- [request](#request)
- [preFetch](#prefetch)
- [fetch](#fetch)
- [postFetch](#postfetch)
- [respond](#respond)
- [postRespond](#postRespond)

### preRequest

```js
Plugin#preRequest(context, option)
```
- `context`: [\<RequestContext\>][RequestContext] 请求上下文
- `option`: \<any\> 插件参数

`preRequest`在用户执行`mission#send()`后执行。插件可以在这个钩子中访问未经其他插件修改的请求上下文。

** `context`对象是只读对象，插件不应该在`preRequest`中修改请求的上下文。


### request
```js
Plugin#request(context, option)
```
- `context`: [\<RequestContext\>][RequestContext] 请求上下文
- `option`: \<any\> 插件参数

`request`在请求发送前执行，通过请求上下文可以修改请求参数。

### preFetch
```js
Plugin#preFetch(context, option)
```
- `context`: [\<RequestContext\>][RequestContext] 请求上下文
- `option`: \<any\> 插件参数

`preFetch`在请求发送前、`request`周期后执行。插件可以在这个生命周期通过上下文访问经过修改的请求参数。

** `context`对象是只读对象，插件不应该在`preFetch`中修改请求的上下文。

### fetch
```js
Plugin#fetch(context, option, callback)
```
- `context`: [\<RequestContext\>][RequestContext] 请求上下文
- `option`: \<any\> 插件参数
- `callback`: \<function\> 回调函数
- Returns: \<function\> | \<undefined\> 取消器

`fetch`在发送请求时执行，请求上下文在经过`request`的修改后传递给`fetch`。`fetch`钩子的主要作用是自定义从输入(`context`)到输出(`response`)的过程。

`callback`具有三种调用形式：
- `callback()`表示运行下一个plugin的`fetch`钩子。
- `callback(error)`表示当前请求应该返回一个错误响应，`error`应该是[RocketError][RocketError]的实例。
- `callback(null, response)`表示当前请求的响应为`response`，`response`应该符合[Response](./API.md#response)的结构

`fetch`钩子可以返回一个函数，在用户调用`mission#cancel`时会调用这个函数。

`fetch`与其他钩子不同，具有唯一性：如果一个插件中的`fetch`通过回调函数返回了错误或响应数据，便不会再执行后续插件的`fetch`钩子。

当所有`fetch`钩子都执行完毕还没有响应数据或错误时，则会通过执行`adapter`获取响应。

### postFetch
```js
Plugin#postFetch(context, option)
```
- `context`: [\<RespondContext\>][RespondContext] 响应上下文
- `option`: \<any\> 插件参数

`postFetch`请求完成响应之后执行，`context`包含`fetch`阶段返回的响应数据或错误。插件通过`postFetch`钩子可以获取请求返回的原始信息。

** `context`对象是只读对象，插件不应该在`postFetch`中修改响应的上下文。

### respond
```js
Plugin#respond(context, option)
```
- `context`: [\<RespondContext\>][RespondContext] 响应上下文
- `option`: \<any\> 插件参数

`respond`在完成响应前执行，插件可以在`respond`钩子中修改响应数据。

### postRespond
```js
Plugin#postRespond(context, option)
```
- `context`: [\<RespondContext\>][RespondContext] 响应上下文
- `option`: \<any\> 插件参数

`postRespond`在`respond`后执行，插件可以在`postRespond`中获取最终将要返回给用户的响应数据。

** `context`对象是只读对象，插件不应该在`postRespond`中修改响应的上下文。

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
 * 
 * 其中PluginA#fetch是否调用取决于PluginB#fetch的回调
 */
```

## 示例

- [plugin](./example/pages/plugin.pug)
- [fetch-plugin](./example/pages/fetch-plugin.pug)

[RequestContext]: ./API.md#requestcontext
[RespondContext]: ./API.md#respondcontext
[RocketError]: ./API.md#rocketerror
