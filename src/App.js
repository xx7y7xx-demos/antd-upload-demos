import React, { Component } from 'react'
import Upload from 'antd/lib/upload'
import Icon from 'antd/lib/icon'

import logo from './logo.svg'
import './App.css'

const Dragger = Upload.Dragger
const log = console.log

class App extends Component {
  render() {
    const props = {
      name: 'file',
      multiple: true,
      action: '/poi/bulkuploads',
      headers: {
        Authorization: localStorage.getItem('jwt')
      },
      onChange: this.handleChange
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
