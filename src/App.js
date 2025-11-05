import React from 'react';
import TrackEditor from './components/TrackEditor';
import { initialProjectData } from './data/initialData';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>视频音频轨道编辑器</h1>
        <p>一个类似专业视频剪辑工具的时间线编辑器 - 组件化架构版本</p>
      </header>
      <main className="App-main">
        <TrackEditor projectData={initialProjectData} />
      </main>
    </div>
  );
}

export default App;