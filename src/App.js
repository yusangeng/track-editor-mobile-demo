import React from 'react';
import TrackEditor from './TrackEditor';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>视频音频轨道编辑器</h1>
        <p>一个类似专业视频剪辑工具的时间线编辑器</p>
      </header>
      <main className="App-main">
        <TrackEditor />
      </main>
    </div>
  );
}

export default App;