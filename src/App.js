import {useEffect} from "react";

import './App.css';

import {mainInteraction} from "./interaction";

function App() {
  useEffect(() => {
    mainInteraction();
  }, []);

  return (
      <></>
  );
}

export default App;
