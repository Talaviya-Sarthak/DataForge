import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import Dataset from "./Pages/DataSet";
import SignIn from "./components/layouts/SignIn";
import Signup from "./components/layouts/SignUp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<HomePage />} />
          <Route index path='/DataSet' element={<Dataset />} />
          <Route index path='/SignIn' element={<SignIn />} />
          <Route index path='/SignUp' element={<Signup/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
