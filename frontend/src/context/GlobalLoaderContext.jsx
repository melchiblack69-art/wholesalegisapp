import { useEffect, useState } from "react";
import { subscribeGlobalLoading } from "../utils/loadBus";
import LoadingSpinner from "../components/LoadingSpinner";

export  function GlobalLoader() {
  const [state, setState] = useState({ count: 0, label: "" });

  useEffect(() => subscribeGlobalLoading(setState), []);

  if (state.count === 0) return null;
  return <LoadingSpinner fullScreen label={state.label} />;
}