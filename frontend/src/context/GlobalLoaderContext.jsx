import { useEffect, useState } from "react";
import { subscribeGlobalLoading } from "../utils/loadBus";
import Spinner from "../components/Spinner";

export  function GlobalLoader() {
  const [state, setState] = useState({ count: 0, label: "" });

  useEffect(() => subscribeGlobalLoading(setState), []);

  if (state.count === 0) return null;
  return <Spinner fullscreen label={state.label || "LOADING"} />;
}
