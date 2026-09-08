import { useCallback, useEffect, useRef } from "react";

// Returns a `disable` function - call it right before an intentional
// navigation away (e.g. redirecting a Prolific participant to the external
// completion URL) so the browser's native "leave site?" prompt doesn't fire
// for a departure the app itself triggered.
function usePreventRefresh(
  message: string = "Are you sure you want to refresh?"
) {
  const enabled = useRef(true);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabled.current) return;
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [message]);

  return useCallback(() => {
    enabled.current = false;
  }, []);
}

export default usePreventRefresh;
