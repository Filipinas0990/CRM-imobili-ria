import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log(
  '%cEspere!',
  'color: red; font-size: 48px; font-weight: bold;'
);
console.log(
  '%cEste é um recurso de navegador voltado para desenvolvedores. Se alguém disse para você copiar e colar algo aqui para ativar um recurso ou "invadir" a conta de outra pessoa, isso é uma fraude e você dará a ele acesso à sua conta.',
  'font-size: 14px;'
);


const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
