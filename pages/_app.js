import Script from "next/script";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";

import { NFTProvider } from "../context/NFTContext";
import { Footer, Navbar } from "../components";
import "../styles/globals.css";
import Head from "next/head";

const Marketplace = ({ Component, pageProps }) => {
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  });
  return (
    <NFTProvider>
      <ThemeProvider attribute="class">
        <Head>
          <link rel="shortcut icon" href="/logo02.png" />
          <title>PRIfA NFT Marketplace</title>
          <meta name="description" content="Khanisic Marketplace" />
        </Head>
        <div className="dark:bg-nft-dark bg-white min-h-screen">
          <Navbar />
          <div className="pt-65">
            <Component {...pageProps} />
          </div>
          <Footer />
        </div>

        <Script
          src="https://kit.fontawesome.com/d45b25ceeb.js"
          crossorigin="anonymous"
        />
      </ThemeProvider>
    </NFTProvider>
  );
};

export default Marketplace;
