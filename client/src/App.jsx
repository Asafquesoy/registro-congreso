import { Routes, Route } from 'react-router-dom'
import Registro from './pages/Registro'
import Admin from './pages/Admin'
import Recepcion from './pages/Recepcion'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Registro />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/recepcion" element={<Recepcion />} />
    </Routes>
  )
}
