/** @jsxImportSource react */
import { hydrateRoot } from "react-dom/client";
import { App, type AppProps } from "./App";

const root = document.getElementById("root");
const data = document.getElementById("app-data");
if (!root || !data?.textContent) throw new Error("Missing page bootstrap data");
const props: AppProps = JSON.parse(data.textContent);
hydrateRoot(root, <App {...props} />);
