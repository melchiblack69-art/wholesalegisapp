import { useEffect, useState } from "react";
import { subscribeGlobalLoading } from "../utils/loadBus";
import Spinner from "../components/Spinner";

export  function GlobalLoader() {
  const [state, setState] = useState({ count: 0, label: "" });

  useEffect(() => subscribeGlobalLoading(setState), []);

  if (state.count === 0) return null;
  return <Spinner fullscreen background="rgba(7, 21, 15, 0.55)" dotColor="#fff" label={state.label || "LOADING"} />;
}
