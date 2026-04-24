import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HostView from './views/HostView';
import RemoteView from './views/RemoteView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HostView />} />
        <Route path="/remote" element={<RemoteView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
