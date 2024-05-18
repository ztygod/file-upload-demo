<template>
  <div id="app">
    <input type="file" @change="handleFileChange"/>
     <el-button type="primary" @click="handleUpload">上传</el-button>
     <el-button type="primary" @click="test">测试</el-button>
     <!-- <div>
      <el-progress :percentage="uploadPercentage"></el-progress>
     </div> -->
  </div>
</template>

<script>
const SIZE = 10 * 1024 * 1024
export default {
  name: 'App',
  data() {
    return {
      container:{
        file:null
      },
      data:[]
    }
  },
  methods: {
    handleFileChange(e){
      const [file] = e.target.files
      if(!file) return
      //这确保了在组件实例中，通过组件选项中的 data 函数定义的任何属性都能得到正确的初始化并成为响应式数据。
      Object.assign(this.$data,this.$options.data())
      this.container.file = file
    },
    //上传文件
    async handleUpload(){
      if(!this.container.file) return 
      const fileChunkList = this.createChunkList(this.container.file)
      this.data = fileChunkList.map(({file},index) => ({
        chunk:file,
        //index,
        //文件名加数组下标
        hash:this.container.file.name + '-' + index,
        //percentage:0
      }) )
      console.log(this.data)
      await this.uploadChunks()
    },
    //封装XMLHttpRequest
    request({
      url,
      method='post',
      data,
      headers = {},
      //onProgress = e => e,
      //requestList
    }){
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest()
        //xhr.upload.onprogress = onProgress
        xhr.open(method,url)
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key])
        })
        xhr.send(data)
        xhr.onload = e => {
          resolve({
            data:e.target.response
          })
        }
      })
    },
    //生成切片文件
    createChunkList(file,size = SIZE){
      const fileChunkList = []
      let cur = 0
      while(cur < file.size){
        fileChunkList.push({file : file.slice(cur,cur + size)})
        cur += size
      }
      return fileChunkList
    },
    //上传切片
    async uploadChunks(){
      const requestList = this.data.map(({chunk,hash}) => {
        const formData = new FormData()
        formData.append("chunk",chunk)
        formData.append("hash",hash)
        formData.append("filename",this.container.file.name)
        return {formData}
      }).map(({formData}) => this.request({
        url:'http://localhost:3000',
        data:formData,
        //onProgress:this.createProgressHandler(this.data[index])
      }))
      console.log("解决完requestList前")
      await Promise.all(requestList)
      console.log("解决完requestList后")
      await this.mergeRequest()
      console.log("解决完合并之后")
    },
    //合并切片
    async mergeRequest(){
      console.log("进入merge")
      await this.request({
        url:"http://localhost:3000/merge",
        headers:{
          "content-type":"application/json"
        },
        data:JSON.stringify({
          filename:this.container.file.name,
          size:SIZE
        })
      })
    },
    test(){
      this.request({
        url:"http://localhost:3000/merge",
        data:JSON.stringify({
          filename:this.container.file.name,
          size:SIZE
        })
      })
    }
    // createProgressHandler(item){
    //   return e => {
    //     item.percentage = parseInt(String((e.loaded / e.tatal) * 100))
    //   }
    // }
  },
  // computed:{
  //   uploadPercentage(){
  //     if(!this.container.file || this.data.length) return 0
  //     const loaded = this.data.map(item => item.size * item.percentage).reduce((acc,cur) => acc + cur)
  //     return parseInt((loaded / this.container.file.size).toFixed(2))
  //   }
  // }

}
</script>


