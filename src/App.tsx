import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import Dataset from "./Pages/Dataset";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<HomePage />} />
          <Route index path='/DataSet' element={<Dataset />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
