import React, { Component } from 'react'
import Upload from 'antd/lib/upload'
import Icon from 'antd/lib/icon'
import Promise from 'bluebird'
import axios from 'axios'
import axiosRetry, { isRetryableError } from 'axios-retry'

import logo from './logo.svg'
import './App.css'

const SAFE_HTTP_METHODS = ['get', 'head', 'options', 'patch']

// overwrite native Promise implementation with Bluebird's (for axios)
window.Promise = Promise

const Api = {
  defaults: {
    baseURL: '/api/v1'
  }
}

axiosRetry(axios, {
  retries: 3,
  retryCondition: error => {
    if (!error.config) {
      // Cannot determine if the request can be retried
      return false
    }

    return (
      isRetryableError(error) &&
      SAFE_HTTP_METHODS.indexOf(error.config.method) !== -1
    )
  }
})
axios.defaults.headers.common['Authorization'] = localStorage.getItem('jwt')

const FILE_SIZE = 1024 * 1024 * 20
const Dragger = Upload.Dragger
const log = console.log

class App extends Component {
  splitAndSendFile = (dataArray, file, uploadID, onError, onProgress) => {
    const parts = []
    for (let i = 0, j = 1; i < dataArray.length; i += FILE_SIZE, j++) {
      const blob = new Blob([dataArray.subarray(i, i + FILE_SIZE)])
      let formData = new FormData()
      formData.append('data', blob)
      // const promise = axios
      //   .patch(
      //     Api.defaults.baseURL + '/file/' + uploadID + '/part?part_number=' + j,
      //     formData
      //   )
      //   .then(data => {
      //     onProgress({ percent: j / dataArray.length })
      //   })
      //   .catch(err => onError(err))
      parts.push({
        partNumber: j,
        blob
      })
    }
    return parts
  }

  render() {
    const props = {
      name: 'file',
      multiple: true,
      action: '/poi/bulkuploads',
      headers: {
        authorization: localStorage.getItem('jwt'),
        contentType: 'multipart/form-data',
        foo: 'bar'
      },
      onChange: this.handleChange,
      customRequest: ({ file, onError, onProgress, onSuccess }) => {
        axios
          .post(Api.defaults.baseURL + '/file', {
            file_name: file.name
          })
          .then(res => {
            const id = res.data.upload_id
            const fr = new FileReader()
            fr.onload = e => {
              const u8a = new Uint8Array(e.target.result)
              const fileParts = this.splitAndSendFile(
                u8a,
                file,
                id,
                onError,
                onProgress
              )

              // Using Promise.map:
              Promise.map(
                fileParts,
                function(filePart) {
                  // Promise.map awaits for returned promises as well.
                  let formData = new FormData()
                  formData.append('data', filePart.blob)
                  return axios
                    .patch(
                      Api.defaults.baseURL +
                        '/file/' +
                        id +
                        '/part?part_number=' +
                        filePart.partNumber,
                      formData
                    )
                    .then(data => {
                      onProgress({
                        percent: filePart.partNumber / u8a.length
                      })
                    })
                    .catch(err => log(err))
                },
                {
                  concurrency: 1
                }
              ).then(function() {
                console.log('done')
                axios
                  .post(Api.defaults.baseURL + '/file/' + id)
                  .then(res => onSuccess(res))
                  .catch(err => onError(err))
              })

              // Promise.all(promises)
              //   .then(res => {
              //     axios
              //       .post(Api.defaults.baseURL + '/file/' + id)
              //       .then(res => onSuccess(res))
              //       .catch(err => onError(err))
              //   })
              //   .catch(err => onError(err))
            }
            fr.readAsArrayBuffer(file)
          })
          .catch(err => {
            onError(err)
          })
      }
    }
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <Dragger {...props}>
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload.
          </p>
        </Dragger>
      </div>
    )
  }
}

export default App
