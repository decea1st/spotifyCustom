import "./App.css";
import clsx from "clsx";

function App() {

  return (
    <div className="flex flex-col bg-zinc-800 min-h-screen justify-center items-center">
      <img src="https://media.discordapp.net/attachments/1449709228439900302/1506877962769797200/vk7skbw.png?ex=6a0fdcf6&is=6a0e8b76&hm=52676be98472054237be0083d56117ff07ac98a5b8a3ccaac96d21c93bf45e29&=&format=webp&quality=lossless&width=1444&height=1444" className="logo tauri" alt="Tauri logo" />
      
      <button className={clsx("cursor-pointer text-[24px] bg-green-400 rounded-xl px-5 py-2 mb-12", "hover:bg-green-500", "active:bg-green-700")}>
        Login with Spotify
      </button>

    </div>
  );
}

export default App;
