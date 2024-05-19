# tainyi-file-upload-demo

我们在这里进行大文件上传使用的是分片上传的思路：

1. 首先在页面中添加一个input的标签，用来选中我们要传输的大文件，再添加一个交互按钮，让用户来点击进行上传。
2. 在input和button标签中，我们绑定两个事件，分别来读取文件的信息（const [file] = e.target.files），还有就是实现上传文件

![屏幕截图 2024-05-19 212807.png](https://cdn.nlark.com/yuque/0/2024/png/40660095/1716125275166-94a56f0d-7fb7-49ab-a0a8-b005bade06dc.png#averageHue=%23252931&clientId=u5757a43c-0090-4&from=ui&id=uf97c74f8&originHeight=1021&originWidth=1879&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=199085&status=done&style=none&taskId=uaef92046-62d9-485e-8fe1-3295e05ad7c&title=)

3. 此外，我们用原生XMLHttpRequest，封装请求函数，固定请求方式为POST。

![屏幕截图 2024-05-19 213427.png](https://cdn.nlark.com/yuque/0/2024/png/40660095/1716125651809-d44a1bde-6b6b-4846-8b3e-75fca881cc35.png#averageHue=%23262a32&clientId=u5757a43c-0090-4&from=ui&height=739&id=ub02c6ad7&originHeight=1237&originWidth=957&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=139656&status=done&style=none&taskId=uf61fcbcd-62b1-4239-897c-cb11f3d3f2b&title=&width=572)

4. 在实现文件上传的函数中，我们分别调用了createChunkList（用于实现函数切片），uploadChunks（用于设置FormData），同时又在uploadChunks发送完所有请求时调用mergeRequest（发送合并请求），这是前端部分。
5. 在后端部分中我们需要引入两个库

```javascript
const fse = require("fs-extra")
const multiparty = require("multiparty")
```

分别用于对文件的控制，如创建读写流，还有就是对FormData的解析<br />![屏幕截图 2024-05-19 214229.png](https://cdn.nlark.com/yuque/0/2024/png/40660095/1716126134839-50a4b768-a261-4ce7-ab70-a9f206f2575e.png#averageHue=%23252830&clientId=u5757a43c-0090-4&from=ui&height=608&id=ube84af97&originHeight=1293&originWidth=1502&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=216628&status=done&style=none&taskId=u6c344655-f0d6-4ad1-a49e-d92db095db3&title=&width=706)

6. 在后端中我们开启一个http服务，首先解决跨域，设置响应头和预请求

![屏幕截图 2024-05-19 214414.png](https://cdn.nlark.com/yuque/0/2024/png/40660095/1716126290072-39fff455-e509-4859-981f-24fed795e300.png#averageHue=%2324282f&clientId=u5757a43c-0090-4&from=ui&id=ue8324b21&originHeight=608&originWidth=1361&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=96012&status=done&style=none&taskId=u5a02e1be-5e48-424b-863a-31bba231b2e&title=)

7. 再设置两个路由，分别对接受切片和合并切片进行处理，在合并切片中，我们先得到传过来的文件名和文件大小，再进行合并操作，在合并操作中我们先进行文件切片的排序，再进行创建文件读取流和写入流来进行合并，最终实现功能。
