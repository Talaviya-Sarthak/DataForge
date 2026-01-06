import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import Dataset from "./Pages/DataSet";

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
