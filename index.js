#!/usr/bin/env node
const path = require('path')
const Koa = require('koa')
const send = require('koa-send')

const streamToString = stream => new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    stream.on('error', reject)

})
const app = new Koa()

// 3. 处理第三方模块
app.use(async (ctx, next) => {
    console.log(123)
    console.log(123)
    console.log(ctx.path)
    // ctx.path --> /@modules/vue
  if (ctx.path.startsWith('/@modules/')) {
    const moduleName = ctx.path.substr(10)
    const pkgPath = path.join(process.cwd(), 'node_modules', moduleName, 'package.json')
    const pkg = require(pkgPath)
    ctx.path = path.join('/node_modules', moduleName, pkg.module)
  }
  await next()
})

// 1. 开启静态文件服务器
app.use(async (ctx, next) => {
    await send(ctx,ctx.path, { root: process.cwd(), index: 'index.html'})
    await next()
})

// 2. 修改第三方模块的路径
app.use(async (ctx, next) => {
    if (ctx.type === 'application/javascript') {
        const contents = await streamToString(ctx.body)
        ctx.body = contents.replace(/(from\s+['"])(?!\.\/)/g, '$1@/modules/')
    }
})

app.listen(3001)
console.log('Server running @ http://localhost:3001')