"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CONTENT_MODE,
  WALLET_KEYS,
  type AccountType,
  type CsprClickInitOptions,
} from "@make-software/csprclick-core-types";
import { useStore } from "@/store";

// ----------------------------------------------------------------
// Window type augmentation
// ----------------------------------------------------------------
type ClickUIOptions = {
  uiContainer: string;
  rootAppElement: string;
  defaultTheme: string;
  accountMenuItems: string[];
};

declare global {
  interface Window {
    clickSDKOptions?: CsprClickInitOptions;
    clickUIOptions?: ClickUIOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    csprclick?: any;
  }
}

// ----------------------------------------------------------------
// Context
// ----------------------------------------------------------------
interface CsprClickContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clickSDK: any | null;
  publicKey: string | null;
  isReady: boolean;
}

const CsprClickContext = createContext<CsprClickContextValue>({
  clickSDK: null,
  publicKey: null,
  isReady: false,
});

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------
export function CsprClickProvider({ children }: { children: ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clickSDK, setClickSDK] = useState<any>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const { setWallet } = useStore();

  useEffect(() => {
    // Assign window options BEFORE injecting the CDN script
    window.clickUIOptions = {
      uiContainer: "csprclick-ui",
      rootAppElement: "#__next",
      defaultTheme: "light",
      accountMenuItems: ["AccountCardMenuItem", "CopyHashMenuItem", "BuyCSPRMenuItem"],
    };

    window.clickSDKOptions = {
      appName: "AgentForge",
      appId: "csprclick-template",
      contentMode: CONTENT_MODE.IFRAME,
      chainName: "casper-test",
      providers: [WALLET_KEYS.CASPER_WALLET, WALLET_KEYS.LEDGER, WALLET_KEYS.METAMASK_SNAP],
    };

    const onLoaded = () => {
      const sdk = window.csprclick;
      setClickSDK(sdk);
      setIsReady(true);

      const handleSignIn = (evt: { account: AccountType }) => {
        const pk = evt.account?.public_key?.toLowerCase() ?? null;
        setPublicKey(pk);
        setWallet(pk);
      };

      const handleSwitch = (evt: { account: AccountType }) => {
        const pk = evt.account?.public_key?.toLowerCase() ?? null;
        setPublicKey(pk);
        setWallet(pk);
      };

      const handleOut = () => {
        setPublicKey(null);
        setWallet(null);
      };

      sdk.on("csprclick:signed_in", handleSignIn);
      sdk.on("csprclick:switched_account", handleSwitch);
      sdk.on("csprclick:signed_out", handleOut);
      sdk.on("csprclick:disconnected", handleOut);

      // Capture for cleanup
      return () => {
        sdk.off("csprclick:signed_in", handleSignIn);
        sdk.off("csprclick:switched_account", handleSwitch);
        sdk.off("csprclick:signed_out", handleOut);
        sdk.off("csprclick:disconnected", handleOut);
      };
    };

    window.addEventListener("csprclick:loaded", onLoaded);

    // Inject CDN script dynamically — never a static <script> tag
    if (!document.querySelector("script#csprclick-client")) {
      const script = document.createElement("script");
      script.src = "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";
      script.id = "csprclick-client";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      window.removeEventListener("csprclick:loaded", onLoaded);
    };
  }, [setWallet]);

  return (
    <CsprClickContext.Provider value={{ clickSDK, publicKey, isReady }}>
      {children}
    </CsprClickContext.Provider>
  );
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------
export function useClickRef() {
  return useContext(CsprClickContext);
}
