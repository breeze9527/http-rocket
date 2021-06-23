# http-rocket API

## Index:

- [Rocket](#rocket)

### Union types

---

##### ResponseType
one of:
- `'text'`
- `'blob'`
- `'arraybuffer'`
- `'document'`
- `'json'`

---

##### HTTPMethod
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

##### HTTPProtocol
one of:
- `'http'`
- `'https'`

---

##### PathSegmentType
one of:
- `'param'`
- `'static'`

##### BodyType
one of:
- `Document`
- `XMLHttpRequestBodyInit`
- `null`

详见[XMLHttpRequest#send()][XHRSendParam]

## Classes

--- 

### Rocket

##### constructor(method: [HTTPMethod](#httpmethod), source: string | [Source](#source))
##### constructor(options: [RocketOptions](#rocketoptions))
Rocket实例化后可重复使用，每次调用`send()`会返回不同的`mission`实例。

##### send(payload: any): [Mission](#misson)
发送请求，返回mission对象，后续可以监听mission对象的事件或取消请求。

---

### Source
Source类用于表示请求发送的目标。由一个不包含search，hash的url分割而成:
```
  http://user:password@my.api.host:port/path/to/source/:sourceId
  1---   2--- 3------- 4---------- 5--- 6-----------------------
```

1. protocol: https或http,不包含`'://'`。
2. user: 用户名，可选，默认为空字符串。
3. password: 密码，可选，默认为空字符串。
4. host: 服务host。
5. port: 端口，可选。
6. path：路径，可选，可附带参数，不包含前缀的`'/'`。


##### Source.from(sourceLiteral: string): Source
通过一个完整的url字符串创建Source对象，url至少应该包含protocol, host。

e.g. `http://my.api.host/path/to/source/:sourceId`

##### constructor(options: [SourceOption](#sourceoption))
##### readonly protocol: [HTTPProtocol](#httpprotocol)
##### setProtocol(protocol: [HTTPProtocol](#httpprotocol)): void
##### readonly path: Path
##### setPath(path: Path | string): void
##### readonly userName: string
##### setUserName(uesrname?: string): void
##### readonly password: string
##### setPassword(password?: string): void
##### readonly port?: number
##### setPort(port?: number): void
##### readonly hostName: string
##### setHostName(hostName: string): void
##### readonly origin: string
`protocol` + `userName` + `password` + `hostName` + `port`的组合。
##### setOrigin(origin: string): void
设置origin，会自动更新关联的属性。
##### toString(): string
##### toURL(param?: object, query?: object | [URLSearchParams][URLSearchParams]): string
生成URL，当path包含参数时需要在param中传入对应的值。
##### clone(): [Source](#source)
返回与当前实例属性相同的副本

```js
const source = Source.from('http://test.com/:groupId/:userId');
const param = {
  groupId: 1,
  userId: 2
};
const query = {
  gender: 'male'
};
source.toURL(param, query); // http://test.com/1/2?gender=male
```

---

### Path 

##### constructor(segments: [PathSegment](#pathsegment)\[\])

##### Path.from(path: string): Path
通过字符串创建`Path`对象，字符串不包含前缀的`\/`，可以包含路径参数。
```js
Path.from('users/:userId');
```

##### readonly segments: [PathSegment](#pathsegment)\[\]

##### insert(item: [PathSegment](#pathsegment)): void
##### insert(type: [PathSegmentType](#pathsegmenttype), name: string, index?: number): void
在`segments`指定位置前插入节点，`index`默认为`0`。

##### remove(index: number): void
##### remove(filter: (item: [PathSegment](#pathsegment), index: number, segments: [PathSegment](#pathsegment)\[\]) => boolean): void
删除`segments`指定位置的节点，传入参数类型为整数时表示删除指定`index`的节点，传入函数时表示删除所有函数返回结果为`false`的值。

##### append(item: [PathSegment](#pathsegment)): void
##### append(type: [PathSegmentType](#pathsegmenttype), name: string): void
在`segments`末尾插入节点。
##### toString(): string
输出path对象的字面量。
##### clone(): [Path](#path)
返回与当前实例属性相同的副本
```js
const path = new Path([
  { type: 'static', name: 'users' },
  { type: 'param', name: 'userId' }
]);
path.toString(); // users/:userId
```
##### normalize(params?: object): string
替换路径中的参数并返回路径字符串，返回的字符串不包含前缀的`/`。
```js
const path = Path.from('users/:userId');
path.normalize({userId: 1}); // users/1
```

---

### RocketError
rocket正常运行过程中产生的错误对象，使用`RocketError`表示*可控*的错误，区别于由bug引发的异常(如`TypeError`，`ReferenceError`等)，便于后续业务的处理。
##### constructor(message: string)
##### name: string
错误名称，`RocketError#name`固定为`'RocketError'`
##### message: string
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

##### error: Error
解析错误的详情。

---

### Misson
Mission类继承于[events.EventEmitter][EventEmitter]。

##### readonly promise: Promise
promise在misson触发`error`或`success`事件时转换状态，并返回相应的数据。
请求成功时返回[Respose](#response)类型，请求失败时返回[RocketError](#rocketerror)。

##### readonly method: [HTTPMethod](#httpmethod)
当前请求使用的HTTPMethod。
##### readonly id: string
请求的唯一标识。
##### readonly url: string
请求的目标URL。
##### readonly source: [Source](#source)
请求使用的Source对象。
##### abort(): void
取消当前请求，请求被取消后会触发`error`事件，事件参数为[AbortError](#aborterror)的实例。

---

### Plugin

##### constructor(name: string)
##### readonly name: string
插件的名称，即构造函数传入的参数。
##### preRequest?(context: [RequestContext](#requestcontext), option: any)
##### request?(context: [RequestContext](#requestcontext), option: any)
##### preFetch?(context: [RequestContext](#requestcontext), option: any)
##### fetch?(context: [RequestContext](#requestcontext), option: any, callback: (error?: RocketError | null, response?: [Response](#response)) => void)
##### postFetch?(context: [RespondContext](#respondcontext), option: any)
##### respond?(context: [RespondContext](#respondcontext), option: any)
##### postRespond?(context: [RespondContext](#respondcontext), option: any)

## Interfaces

---

### PathSegment
#### name: string
静态路径节点字符串或路径参数的名称(不包含前缀的`:`)。
#### type: [PathSegmentType](#pathsegmenttype)
节点类型。

---

### RocketOptions
##### adapter?: (options: [AdapterOptions](#adapteroptions), callbacks: [AdapterCallbacks](#adaptercallbacks)) => void
用于实际触发请求的请求器
##### headers?: [Headers][Headers] | {\[fieldName\]: string | string\[\]}
发起请求时携带的头信息，支持传入[Headers][Headers]类的实例或一个普通对象(plain object)，当传入普通对象时对象的key表示头部的字段名，value为字段的值，可以为字符串或字符串数组，在设置headers时字符串数组会使用`';'`合并成用于实际发送的字符串。

详情见:[Headers#get()][HeadersGet]。

##### method: [HTTPMethod](#httpmethod)
请求使用的HTTP method。

##### payload?: (data: any) => [Payload](#payload)
用于格式化输入参数，`rocket.send()`传入的参数会进过`payload`格式化后交由`adapter`发送。

##### plugins?: [RocketPlugin](#plugin)\[\]
插件列表，详见[PLUGIN.md](./PLUGIN.md)。

##### responseType?: [ResponseType](#responsetype)
指定返回的数据格式。与[XMLHttpRequest.ResponseType][XHRResponseType]作用相同，唯一区别是当`responseType`为`json`且解析响应失败时会触发`error`事件，事件对象为[ParseError](#parseerror)的实例。

##### timeout?: number
请求的最大等待时间，超过指定时间时请求失败，`mission`触发`error`事件，事件对象为[TimeoutError](#timeouterror)的实例。

##### source: [Source](#source)
请求的目标资源，与payload配合生成最终请求的实际url。

---

### Response
表示请求成功后返回的响应信息
##### body: any
响应返回的数据，具体类型取决于`responseType`与使用的插件。
##### headers: [Headers][Headers]
响应的头部信息
##### status: number
响应的HTTP Code
---

### Payload
##### params?: {\[paramName\]: string | number}
路由路径参数中对应的参数值，`paramName`为`source`中设置的参数名称(`PathSegment#type`)

##### query?: [URLSearchParams][URLSearchParams] | {\[queryKey\]: string | number | \(number | string\)\[\]}
用于生成url中的查询字符串，当某个`queryKey`对应的值为数组时会将数组中的每个元素分别添加到查询字符串中。

详见[URLSearchParams#toString][URLSearchParamsToString]。

##### body?: [BodyType](#bodytype)

##### headers?: Headers | {\[fieldName\]: string | string\[\]} | (header: Heades) => Headers
与`RocketOption#headers`合并后生成在请求时携带的头部信息
- 当`Payload#headers`为[Headers](#headers)的实例时，`Payload#headers`覆盖([Headers#set][HeadersSet])`RocketOption#headers`中拥有相同`fieldName`的字段。
- `Payload#headers`为函数时，直接使用函数返回的[Headers][Headers]。
- `Payload#headers`为对象时，对象值为数组表示覆盖([Headers#set][HeadersSet])`RocketOption#headers`对应的字段，否则为追加([Headers#append][HeadersAppend])。

##### pluginOptions?: {\[pluginName\]: any}
传递给插件的选项，`pluginName`与对应选项的值类型由插件自定义。

---

### SourceOption
##### hostName: string
##### port?: number
##### path?: string | Path
##### protocol: [HTTPProtocol](#httpprotocol)
##### userName?: string
##### password?: string

---

### AdapterOptions
##### body: [BodyType](#bodytype)
##### headers: [Headers][Headers]
##### method: [HTTPMethod](#httpmethod)
##### responseType: [ResponseType](#ResponseType)
##### timeout: number
##### url: string

---

### AdapterCallbacks
##### progress(event: [ProgressEvent][ProgressEvent]): void
接收响应时执行回调，在下载过程中可能会被执行多次。
##### success(data: [Response](#response)): void
接收响应且解析成功后执行，HTTP code不影响请求的状态。
##### error(error: [RocketError](#rocketerror)): void
发送请求失败或解析返回数据失败时执行。
##### uploadProgress(event: [ProgressEvent][ProgressEvent]): void
与`progress`相似，但在上传过程中执行。
##### uploadSuccess(): void
请求体上传成功后执行。

---

### RequestContext
请求上下文，在插件中使用，用于记录或操作请求参数。
##### body: [BodyType](#bodytype)
##### headers: [Headers][Headers]
##### id: string
##### method: [HTTPMethod](#httpmethod)
##### params: object
##### query: [URLSearchParams][URLSearchParams]
##### responseType: [ResponseType](#responsetype)
##### source: [Source](#source)
##### timeout: number

---

### RespondContext
响应上下文，在插件中使用，用于记录或改变响应结果。
##### error: [RocketError](#rocketerror) | null
响应的错误对象
##### url: string
请求的完整url
##### request: [RequestContext](#requestcontext)
请求上下文
##### response: [Response](#response) | null
响应数据

#####

---

- `readonly attr: xxx`表示prop只读
- `attr?: xxx`表示attr非必选(可能为`undefined`)

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
