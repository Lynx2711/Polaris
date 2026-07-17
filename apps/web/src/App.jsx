import { useState } from 'react'
import './App.css'
import { DispatchMap } from './components/DispatchMap'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <DispatchMap />
    </>
  )
}

export default App
