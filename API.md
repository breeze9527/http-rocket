# http-rocket API

## Index:

- [Union type](#union-type)
  - [BodyType](#bodytype)
  - [HTTPMethod](#httpmethod)
  - [HTTPProtocol](#httpprotocol)
  - [ResponseType](#responsetype)
  - [PathNodeType](#pathnodetype)
- [Literal](#literal)
  - [HeadersLiteral](#headersliteral)
  - [ParamLiteral](#paramliteral)
  - [QueryLiteral](#queryliteral)
- [Class](#class)
  - [Rocket](#rocket)
  - [Source](#source)
  - [RocketError](#rocketerror)
  - [NetworkError](#rocketerror)
  - [TimeoutError](#timeouterror)
  - [AbortError](#aborterror)
  - [ParseError](#parseerror)
  - [Misson](#misson)
  - [Plugin](#plugin)
- [Interface](#interface)
  - [PathNode](#pathnode)
  - [RocketOption](#rocketoption)
  - [Response](#response)
  - [Payload](#payload)
  - [SourceOption](#sourceoption)
  - [AdapterOption](#adapteroption)
  - [AdapterCallback](#adaptercallback)
  - [RequestContext](#requestcontext)
  - [RespondContext](#respondcontext)
  - [RespondContext](#respondcontext)
- [Util](#util)
  - [util.mergeHeaders](#utilmergeheaders)
  - [util.normalizeHeadersLiteral](#utilnormalizeheadersliteral)
  - [util.normalizequeryliteral](#utilnormalizequeryliteral)

---

### Union type

#### BodyType
one of:
- `Document`
- `XMLHttpRequestBodyInit`
- `null`

详见[XMLHttpRequest#send()][XHRSendParam]

---

#### HTTPMethod
one of:
- `'GET'`
- `'POST'`
- `'PUT'`
- `'PATCH'`
- `'DELETE'`
- `'OPTIONS'`
- `'HEAD'`
- `'TRACE'`

---

#### HTTPProtocol
one of:
- `'http'`
- `'https'`

---

#### ResponseType
one of:
- `'text'`
- `'blob'`
- `'arraybuffer'`
- `'document'`
- `'json'`

详见 [ResponseType][XHRResponseType]

---

#### PathNodeType
one of:
- `'param'`
- `'static'`

---

## Literal

#### HeadersLiteral
```ts
{
  [fieldName: string]: string | string[];
}
```
[Headers][Headers]实例的字面量表示。

可以通过工具函数`util.normalizeHeadersLiteral`生成[Headers][Headers]实例。

---

#### ParamLiteral
```ts
{
  [paramName: string]: string | number;
}
```
路径参数对象的字面量表示

---

#### QueryLiteral
```ts
{
  [queryKey: string]: string | number | (string | number)[];
}
```
[URLSearchParams][URLSearchParams]实例的字面量表示。

可以通过工具函数`util.normalizeQueryLiteral`生成[URLSearchParams][URLSearchParams]实例。

---

## Class

### Rocket
#### constructor(method: [HTTPMethod](#httpmethod), source: string | [Source](#source))
#### constructor(options: [RocketOption](#rocketoption))
Rocket实例化后可重复使用，每次调用`send()`会返回不同的`mission`实例。

#### send(payload: any): [Mission](#misson)
发送请求，返回mission对象，后续可以监听mission对象的事件或取消请求。

---

### Source
Source类用于表示请求发送的目标。由一个不包含search，hash的url分割而成:
```
http://user:password@my.api.host:port/path/to/source/:sourceId
1---   2--- 3------- 4---------- 5--- 6-----------------------
```

1. protocol: https或http,不包含`://`。
2. user: 用户名，可选，默认为空字符串。
3. password: 密码，可选，默认为空字符串。
4. host: 服务host。
5. port: 端口，可选。
6. path：路径，可选，可附带参数，不包含前缀的`/`。

`Source`实例是一个不可变（immutable）的对象，对实例的更改操作都会返回一个新的`Source`实例。

#### constructor(option: [SourceOption](#sourceoption) | string)
`option`可以是符合[SourceOption](#sourceoption)结构的对象或是一个URL字符串。

当`option`是URL字符串时必须是至少包含`protocol`与`host`的绝对地址。且协议只能为`https`或`http`。

```js
// Invalid:
new Source('/path/to/source'); // 缺少protocol, host
new Source('www.test.com'); // 缺少protocol
new Source('ftp://my.fpt.server'); // 不支持的协议

// Valid:
new Source('http://my.api.host'); // 路径可以省略
new Source('http://my.api.host/path/to/source/:sourceId'); // 包含路径，并且包含一个动态参数 sourceId
```

#### \<readonly\>protocol: [HTTPProtocol](#httpprotocol)

#### setProtocol(protocol: [HTTPProtocol](#httpprotocol)): [Source](#source)

#### \<readonly\>path: string
以`/`为分隔的路径字符串，以`:`为前缀的节点表示路径参数。

#### setPath(path: [PathNode](#pathnode)\[\] | string): [Source](#source)
设置路径，`path`可以是表示路径节点的对象组成的数组，或是路径的字面量表示。

```js
source.setPath('user/:userId'); // 不需要前缀的"/"
// 相当于
source.setPath([
  { type: 'static', name: 'user' },
  { type: 'param', name: 'userId' }
]);
```

#### insertPath(path: [PathNode](#pathnode) | [PathNode](#pathnode)\[\] | string, index?: number): [Source](#source)
在指定位置前插入路径节点。

`path`可以是多个节点对象或是表示多个节点的路径字符串，`index`默认为`0`。

```js
const baseSource = new Source('http://my.api.server/a/b/c');
const insertNodes = [
  {type: 'static', name: 'y'},
  {type: 'static', name: 'z'},
]

console.log(baseSource.path); // 'a/b/c'
baseSource.insertPath(insertNodes).path; // 'y/z/a/b/c'
baseSource.insertPath(insertNodes[0]).path; // 'y/a/b/c'
baseSource.insertPath('y/z').path; // 'y/z/a/b/c'
baseSource.insertPath('y/z', 1).path; // 'a/b/y/z/c'
```

#### appendPath(path: [PathNode](#pathnode) | [PathNode](#pathnode)\[\] | string): [Source](#source)
在路径末尾添加节点。

`path`参数参考`Source#insertPath`。

#### removePath(filter: number | (item: [PathNode](#pathnode), index: number, nodes: [PathNode](#pathnode)\[\]) => boolean): [Source](#source)
去除指定的路径节点。

`filter`类型是数字时表示去除目标索引的节点。

`filter`为函数时表示依次判断所有节点，并去除函数返回`false`的元素，函数接收的三个参数分别是当前节点，索引，节点数组。

```js
const baseSource = new Source('http://my.api.server/a/b/c/a');

baseSource.removePath(1).path; // 'a/c/a'
baseSource
  .removePath(item => item.name === 'a')
  .path; // 'b/c'
```

#### \<readonly\>userName: string
用于验证的用户名，默认为字符串。

#### setUserName(userName?: string): [Source](#source)
修改用户名，参数可以为空，默认为空字符串。

#### \<readonly\>password: string

#### setPassword(password?: string): [Source](#source)
修改密码，参数可以为空，默认为空字符串。

#### \<readonly\>port: number | null
使用的端口，没有设置时默认为`null`

#### setPort(port?: number): [Source](#source)
设置端口。

#### \<readonly\>hostName: string
主机名。

#### setHostName(hostName: string): [Source](#source)
设置主机名。

#### \<readonly\>origin: string
`protocol` + `userName` + `password` + `hostName` + `port`的组合。

#### setOrigin(origin: string): [Source](#source)
设置origin，会自动更新关联的属性。

#### toString(): string

#### toURL(param?: [ParamLiteral](#paramliteral), query?: [URLSearchParams][URLSearchParams] | [QueryLiteral](#queryliteral)): [URL][URL]
生成[URL][URL]实例，当path包含参数时需要在`param`中提供对应的值。

```js
const source = new Source('https://my.api.server/users/:userId');
source.toURL({userId: 1}).toString(); // https://my.api.server/users/1
source.toURL({userId: 2}, {q: 2}).toString(); // https://my.api.server/users/2?q=2
```

#### clone(): [Source](#source)
返回与当前实例属性相同的副本

---

### RocketError
rocket正常运行过程中产生的错误对象，使用`RocketError`表示*可控*的错误，区别于由bug引发的异常(如`TypeError`，`ReferenceError`等)，便于后续业务的处理。

#### constructor(message: string)

#### name: string
错误名称，`RocketError#name`固定为`'RocketError'`

#### message: string
错误描述

---

### NetworkError
继承于[RocketError](#rocketerror)，表示由网络链接产生的错误。

`NetworkError#name`固定为`'NetworkError'`

---

### TimeoutError
继承于[RocketError](#rocketerror)，表示由请求超时产生的错误。

`TimeoutError#name`固定为`'TimeoutError'`

---

### AbortError
继承于[RocketError](#rocketerror)，表示由用户取消请求产生的错误。

`AbortError#name`固定为`'AbortError'`

---

### ParseError
继承于[RocketError](#rocketerror)，表示由解析响应数据失败产生的错误。

`ParseError#name`固定为`'ParseError'`

#### error: Error
解析错误的详情。

---

### Misson
Mission类继承于[events.EventEmitter][EventEmitter]。

#### \<readonly\>promise: Promise
promise在misson触发`error`或`success`事件时转换状态，并返回相应的数据。
请求成功时返回[Respose](#response)类型，请求失败时返回[RocketError](#rocketerror)。

#### \<readonly\>id: string
请求的唯一标识。

#### \<readonly\>source: [Source](#source)
请求使用的`Source`对象。

#### abort(): void
取消当前请求，请求被取消后会触发`error`事件，事件参数为[AbortError](#aborterror)的实例。

---

### Plugin

#### constructor(name: string)

#### \<readonly\>name: string
插件的名称，即构造函数传入的参数。

#### preRequest?(context: [RocketContext](#rocketcontext), option: any): void

#### request?(context: [RocketContext](#rocketcontext), option: any, callback: (error?: [RocketError](#rocketerror) | null, context?: [RequestContext](#requestcontext)) => void): (() => void | undefined)

#### preFetch?(context: [RocketContext](#rocketcontext), option: any): void

#### fetch?(context: [RocketContext](#rocketcontext), option: any, callback: (error?: [RocketError](#rocketerror) | null, response?: [Response](#response)) => void): (() => void | undefined)

#### postFetch?(context: [RocketContext](#rocketcontext), option: any): void

#### respond?(context: [RocketContext](#rocketcontext), option: any, callback: (error?: [RocketError](#rocketerror) | null, response?: [Response](#response)) => void): (() => void | undefined)

#### postRespond?(context: [RocketContext](#rocketcontext), option: any): void

---

## Interface

### PathNode

#### name: string
静态路径节点字符串或路径参数的名称（不包含前缀的`:`）。

#### type: [PathNodeType](#pathnodetype)
节点类型。

---

### RocketOption

#### adapter?: (option: [AdapterOption](#adapteroption), callback: [AdapterCallback](#adaptercallback)) => void
用于实际触发请求的请求器

#### headers?: [Headers][Headers] | [HeadersLiteral](#headersliteral)
发起请求时携带的头信息，支持传入[Headers][Headers]类的实例或表示`Headers`实例的字面量表示，当传入字面量时对象的`key`表示头部的字段名，`value`为字段的值。

详情见:[Headers#get()][HeadersGet]。

#### method: [HTTPMethod](#httpmethod)
请求使用的HTTP method。

#### payload?: (data: any) => [Payload](#payload)
用于格式化输入参数，`rocket.send()`传入的参数会进过`payload`格式化后交由`adapter`发送。

#### plugins?: [RocketPlugin](#plugin)\[\]
插件列表，详见[PLUGIN.md](./PLUGIN.md)。

#### responseType?: [ResponseType](#responsetype)
指定返回的数据格式。与[XMLHttpRequest.ResponseType][XHRResponseType]作用相同，唯一区别是当`responseType`为`json`且解析响应失败时`misson`实例会触发`error`事件，事件参数为[ParseError](#parseerror)的实例。

#### timeout?: number
请求的最大等待时间，超过指定时间时请求失败，`mission`触发`error`事件，事件参数为[TimeoutError](#timeouterror)的实例。

#### source: [Source](#source)
请求的目标资源，与payload配合生成最终请求的实际url。

---

### Response
表示请求成功后返回的响应信息

#### body: any
响应返回的数据，具体类型取决于`responseType`与使用的插件。

#### headers: [Headers][Headers]
响应的头部信息

#### status: number
响应的HTTP Code

---

### Payload

#### param?: [ParamLiteral](#paramliteral)
路由路径参数中对应的参数值，`paramName`为`source`中设置的参数名称(`PathNode#type`)

#### query?: [URLSearchParams][URLSearchParams] | [QueryLiteral](#queryliteral)
查询参数对象，用于生成url中的查询字符串。

详见[URLSearchParams#toString][URLSearchParamsToString]与`util.normalizeQueryLiteral`。

#### body?: [BodyType](#bodytype)

#### headers?: [Headers][Headers] | [HeadersLiteral](#headersliteral) | (header: [Headers][Headers]) => [Headers][Headers]
与`RocketOption#headers`合并后生成在请求时携带的头部信息。

- `Payload#headers`为函数时，接受`RocketOption#headers`作为参数，并使用函数返回的[Headers][Headers]实例作为请求的头部。
- `Payload#headers`为[Headers][Headers]实例或是[HeadersLiteral](#headersliteral)时，使用`util.mergeHeaders(RocketOption#headers, Payload#headers)`合并生成请求头部。

#### pluginOption?: {\[pluginName\]: any}
传递给插件的选项，`pluginName`与对应选项的值类型由插件自定义。

---

### SourceOption

#### hostName: string

#### port?: number

#### path?: string | Path

#### protocol: [HTTPProtocol](#httpprotocol)

#### userName?: string

#### password?: string

---

### AdapterOption

#### body: [BodyType](#bodytype)

#### headers: [Headers][Headers]

#### method: [HTTPMethod](#httpmethod)

#### responseType: [ResponseType](#ResponseType)

#### timeout: number

#### url: [URL][URL]

---

### AdapterCallback

#### progress(event: [ProgressEvent][ProgressEvent]): void
接收响应时执行回调，在下载过程中可能会被执行多次。

#### success(data: [Response](#response)): void
接收响应且解析成功后执行，HTTP code不影响请求的状态。

#### error(error: [RocketError](#rocketerror)): void
发送请求失败或解析返回数据失败时执行。

#### uploadProgress(event: [ProgressEvent][ProgressEvent]): void
与`progress`相似，但在上传过程中执行。

#### uploadSuccess(): void
请求体上传成功后执行。

---

### RocketContext

#### \<readonly\>id: string
请求的唯一标识。

#### \<readonly\>source: [Source](#source)
请求所用的`Source`实例。

#### \<readonly\>request: [RequestContext](#requestcontext)
请求上下文对象。

#### \<readonly\>respond: [RespondContext](#respondcontext)
响应上下文对象。

---

### RequestContext
请求上下文，在插件中使用，用于记录或操作请求参数。

#### body: [BodyType](#bodytype)
请求的消息体。

#### headers: [Headers][Headers]
请求头部信息。

#### method: [HTTPMethod](#httpmethod)
请求使用的方法。

#### responseType: [ResponseType](#responsetype)
请求响应的数据类型。

#### timeout: number
请求的超时限制，单位是毫秒，`0`表示没有限制。

#### url: [URL][URL]
使用`Payload#query`，`Payload#param`，`RocketOption#source`生成的`URL`实例。

---

### RespondContext
响应上下文，在插件中使用，用于记录或改变响应结果。

#### error: [RocketError](#rocketerror) | null
响应的错误对象

#### response: [Response](#response) | null
响应数据

---

## Util
使用`util.*`访问工具函数
```js
import { util } from 'http-rocket';
```

#### util.mergeHeaders
```js
util.mergeHeaders(base, source)
```
- `base`: [\<Headers\>][Headers]
- `source`: [\<Headers\>][Headers] | [\<HeadersLiteral\>](#headersliteral)
- Returns: [\<Headers\>][Headers]

合并`base`与`source`，返回新的[Headers][Headers]的实例。
- 当`source`为[Headers][Headers]的实例时，`Payload#headers`覆盖([Headers#set][HeadersSet])`RocketOption#headers`中拥有相同`fieldName`的字段。
- `source`为[HeadersLiteral](#headersliteral)时，对象值为数组表示覆盖([Headers#set][HeadersSet])`RocketOption#headers`对应的字段，否则为追加([Headers#append][HeadersAppend])。

```js
const baseHeaders = new Headers({
  'Content-Type': 'text/html',
  'Accept-Language': 'zh-CN',
  'X-Accept-Color': 'red'
});
util.mergeHeaders(baseHeaders, new Headers({
  'Content-Type': 'image/png'
}));
/**
 *  发送的头部为：
 *  Content-Type: image/png
 *  Accept-Language: zh-CN
 *  X-Accept-Color: red
 */
util.mergeHeaders(baseHeaders, {
  'Accept-Language': 'en-US;q=0.9'
  'X-Accept-Color': ['blue', 'purple']
});
/**
 *  发送的头部为：
 *  Content-Type: text/html
 *  Accept-Language: zh-CN, en-US;q=0.9
 *  X-Accept-Color: blue, purple
 */
```

---
#### util.normalizeHeadersLiteral
```js
util.normalizeHeadersLiteral(literal)
```
- `literal`: [\<HeadersLiteral\>](#headersliteral)
- Returns: [\<Headers\>][Headers]

使用[HeadersLiteral](#headersliteral)生成[Headers][Headers]实例。

`fieldName`相同（不区分大小写）的字段后者会覆盖前者。

```js
const headers = util.normalizeHeadersLiteral({
  'Accept-Language': ['zh-CN', 'en-US;q=0.9']
  'Content-Type': 'text/html',
  'content-type': 'image/png'
});
headers.get('accept-language'); // 'zh-CN, en-US;q=0.9'
headers.get('content-type');    // 'image/png'
```

---

#### util.normalizeQueryLiteral
```js
util.normalizeQueryLiteral(literal)
```
- `literal`: [\<QueryLiteral\>](#queryliteral)
- Returns: [\<URLSearchParams\>][URLSearchParams]

使用[QueryLiteral](#queryLiteral)生成[URLSearchParams][URLSearchParams]实例。

```js
const searchParams = util.normalizeQueryLiteral({
  a: 1,
  b: [2, 3]
});
searchParams.toString(); // a=1&b=2&b=3
```

详见[URLSearchParams#toString][URLSearchParamsToString]。


- `<readonly>attr: xxx`表示prop只读
- `attr?: xxx`表示attr非必选（可能为`undefined`）

[URLSearchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
[Headers]: https://developer.mozilla.org/en-US/docs/Web/API/Headers
[HeadersGet]: https://developer.mozilla.org/en-US/docs/Web/API/Headers/get
[HeadersSet]: https://developer.mozilla.org/en-US/docs/Web/API/Headers/set
[HeadersAppend]: https://developer.mozilla.org/en-US/docs/Web/API/Headers/append
[EventEmitter]: https://nodejs.org/dist/latest-v14.x/docs/api/events.html#events_class_eventemitter
[XHRResponseType]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
[URLSearchParamsToString]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString
[XHRSendParam]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send#parameters
[ProgressEvent]: https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent
[URL]: https://developer.mozilla.org/en-US/docs/Web/API/URL
