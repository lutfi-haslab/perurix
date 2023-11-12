import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";
import {
  MarketAddress,
  tokenAddress,
  MarketAddressABI,
  PixTokenABI,
} from "./constants";
// import { NFTStorage, Blob } from "nft.storage";
import { create } from "ipfs-http-client";
import Web3 from "web3";
const web3 = new Web3();
// const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
// const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
const client = create({
  url: "https://ipfs-api.pchain.id",
});

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);
const fetchPiXContract = (signerOrProvider) =>
  new ethers.Contract(tokenAddress, PixTokenABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const nftCurrency = "IDRC";
  const [currentAccount, setCurrentAccount] = useState("");
  const [currAllowance, setAllowance] = useState(0);
  const [currBalance, setBalance] = useState(0);

  const addIdrcToken = async () => {
    const tokenSymbol = 'IDRC';
    const tokenDecimals = 0.1;
    const tokenImage = 'https://cbdc.prifa.id/assets/app-logo-color%201-297d020b.svg';
    
    try {
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', 
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });
    
      if (wasAdded) {
        console.log('Thanks for your interest!');
      } else {
        console.log('Your loss!');
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
  
    const chainId = "0x64"; // Chain ID of the network you want to check
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network doesn't exist, add it
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId,
              chainName: "Polygon Edge",
              rpcUrls: ["https://chain.pchain.id/edge"],
              blockExplorerUrls: ["https://platform.pchain.id/console/edge/explorer"],
              nativeCurrency: {
                name: "pChain",
                symbol: "pChain",
                decimals: 18,
              },
            },
          ],
        });
      } else {
        // Other error occurred
        console.error(error);
      }
    }
  
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setCurrentAccount(accounts[0]);
    window.location.reload();
  };
  

  const checkIfWalletIsConnect = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");

    const accounts = await window.ethereum.request({ method: "eth_accounts" });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
      getAllowance(accounts[0]);
    } else {
      console.log("No accounts found");
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add(file.buffer);
      const metadata = await client.store({
        name: "ABC",
        description: "ABC",
        image: added.path,
      });

      return metadata;
    } catch (error) {
      console.log("Error uploading to file");
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    console.log(price);
    if (!name || !description || !fileUrl || !price) return;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const blob = new Blob([data], { type: "text/javascript" });
      const formData = new FormData();
      formData.append("file", blob);
      const res = await axios.post(
        "https://api.pchain.id/ipfs/upload/file/project_yyehpe8wv0l4t1lfysgz8m03",
        formData,
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_PCHAIN_TOKEN,
          },
        }
      );
      await createSale(res.data.data.data.url, price);

      await axios.post(`${process.env.NEXT_PUBLIC_CBDC_API}/idrc/event`, {
        amount: Number(price),
        from: currentAccount,
        to: MarketAddress,
        eventType: "LISTING NFT",
        tokenType: "IDRC",
      });

      router.push("/");
    } catch (error) {
      console.log(error);
      console.log("Error uploading to create nft");
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    const price = ethers.utils.formatUnits(formInputPrice.toString(), "ether");
    const transaction = !isReselling
      ? await contract.createToken(url, Number(formInputPrice))
      : await contract.resellToken(id, Number(formInputPrice));
    await transaction.wait();
  };

  const fetchNFTs = async (setLoading) => {
    setLoading(true);
    // const provider = new ethers.providers.AlchemyProvider(
    //   "maticmum",
    //   process.env.NEXT_PUBLIC_ALCHEMY_KEY
    // );
    const provider = new ethers.providers.JsonRpcProvider(
      "https://chain.pchain.id/edge"
    );

    const contract = fetchContract(provider);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { image, name, description },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(
          unformattedPrice.toString(),
          "ether"
        );

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      })
    );
    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const data =
      type === "fetchItemsListed"
        ? await contract.fetchItemsListed()
        : await contract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { image, name, description },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(
          unformattedPrice.toString(),
          "ether"
        );

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      })
    );

    return items;
  };

  const addAllowance = async (allowance) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contractPiX = fetchPiXContract(signer);
    const approval = await contractPiX.increaseAllowance(
      MarketAddress,
      allowance
    );
    const receipt = await approval.wait();
    return receipt;
    // if (approval) {
    //   console.log(`Success increase allowance to ${allowance}`)
    //   return approval
    // };
  };

  const getAllowance = async (account) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contractPiX = fetchPiXContract(signer);
    console.log(account, MarketAddress);
    const allowance = await contractPiX.allowance(account, MarketAddress);
    const balance = await contractPiX.balanceOf(account);
    if (allowance) {
      console.log(allowance);
      setAllowance(allowance.toString());
      setBalance(balance.toString());
    }
  };

  const buyNFT = async (nft) => {
    try {
      const web3modal = new Web3Modal();
      const connection = await web3modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = fetchContract(signer);
      const tx = await contract.createMarketSale(Number(nft.tokenId));
      await tx.wait();

      if (tx) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_CBDC_API}/idrc/event`,
          {
            amount: nft.price * 10 ** 18,
            from: currentAccount,
            to: nft.owner,
            eventType: "BUY NFT",
            tokenType: "IDRC",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return {
        success: true,
      };
    } catch (error) {
      // console.log("Error", error);
      return {
        success: false,
      };
    }
  };

  const NftEvent = async (nft) => {
    const res = await axios.post(
      "http://localhost:4571/idrc/event",
      {
        amount: nft.price * 10 ** 18,
        from: currentAccount,
        to: nft.owner,
        eventType: "BUY NFT",
        tokenType: "IDRC",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(res.data);
  };

  useEffect(() => {
    checkIfWalletIsConnect();
    // getAllowance();
  }, []);
  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        addIdrcToken,
        currentAccount,
        currAllowance,
        currBalance,
        uploadToIPFS,
        createNFT,
        addAllowance,
        getAllowance,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        createSale,
        NftEvent,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
