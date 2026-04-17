import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Home } from "./pages/Home"
import { ImageEffects } from "./components/tools/image/ImageEffects"
import { RemoveBg } from "./components/tools/image/RemoveBg"
import { MergePdf } from "./components/tools/pdf/MergePdf"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tools/image/effects" element={<ImageEffects />} />
          <Route path="/tools/image/remove-bg" element={<RemoveBg />} />
          <Route path="/tools/pdf/merge" element={<MergePdf />} />
          {/* Add more routes here later */}
          <Route path="/tools/*" element={<div className="flex h-[50vh] items-center justify-center text-muted-foreground">Tool is being developed!</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
