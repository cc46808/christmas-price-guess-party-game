import Home from './pages/Home';
import JoinGame from './pages/JoinGame';
import PlayerSelect from './pages/PlayerSelect';
import PlayerGame from './pages/PlayerGame';
import MainScreen from './pages/MainScreen';
import GameMaster from './pages/GameMaster';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "JoinGame": JoinGame,
    "PlayerSelect": PlayerSelect,
    "PlayerGame": PlayerGame,
    "MainScreen": MainScreen,
    "GameMaster": GameMaster,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};