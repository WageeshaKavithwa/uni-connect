import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Toast from "./components/Toast"
import Navbar from "./layouts/Navbar"
import Posts from "./pages/Posts"
import MyPosts from "./pages/MyPosts"
import FavouritePosts from "./pages/FavouritePosts"
import MarketPlace from "./pages/MarketPlace"
import Chats from "./pages/Chats"
import Events from "./pages/Events"

function App() {

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/app" element={<Navbar />}>
          <Route path="posts" element={<Posts />} />
          <Route path="myposts" element={<MyPosts />} />
          <Route path="favouriteposts" element={<FavouritePosts />} />
          <Route path="marketplace" element={<MarketPlace />} />
          <Route path="chats" element={<Chats />} />
          <Route path="events" element={<Events />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
