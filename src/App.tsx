import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import Dataset from "./Pages/DataSet/DataSet";
import SignIn from "./Pages/SignIn/SignIn";
import Signup from "./Pages/SignUp/SignUp";
import NotFound from "./Pages/NotFound/not-found";



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<HomePage />} />
          <Route index path='/HomePage' element={<HomePage />} />
          <Route index path='/DataSet' element={<Dataset />} />
          <Route index path='/SignIn' element={<SignIn />} />
          <Route index path='/SignUp' element={<Signup />} />
            <Route index path='*' element={<NotFound/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
