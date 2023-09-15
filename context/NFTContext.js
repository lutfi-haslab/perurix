import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";
import { MarketAddress, MarketAddressABI } from "./constants";
// import { NFTStorage, Blob } from "nft.storage";
import { create } from "ipfs-http-client";
// const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
// const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
const client = create({
  url: "https://ipfs-api.pchain.id",
});

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const nftCurrency = "pChain";
  const [currentAccount, setCurrentAccount] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");

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

      return metadata
    } catch (error) {
      console.log("Error uploading to file");
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    if (!name || !description || !fileUrl || !price) return;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const blob = new Blob([data], {type : 'text/javascript'});
      const formData = new FormData();
      formData.append("file", blob);
      const res = await axios.post(
        "https://api.pchain.id/ipfs/upload/file/project_becodr839inyudef1el9hedp",
        formData,
        {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_PCHAIN_TOKEN,
          },
        }
      );
      await createSale(res.data.data.data.url, price);

      router.push("/");
    } catch (error) {
      console.log(error)
      console.log("Error uploading to create nft");
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const price = ethers.utils.parseUnits(formInputPrice, "ether");
    const contract = fetchContract(signer);
    const listingPrice = await contract.getListingPrice();

    const transaction = !isReselling
      ? await contract.createToken(url, price, {
          value: listingPrice.toString(),
        })
      : await contract.resellToken(id, price, {
          value: listingPrice.toString(),
        });
    await transaction.wait();
  };

  const fetchNFTs = async (setLoading) => {
    setLoading(true);
    // const provider = new ethers.providers.AlchemyProvider(
    //   "maticmum",
    //   process.env.NEXT_PUBLIC_ALCHEMY_KEY
    // );
    const provider = new ethers.providers.JsonRpcProvider(
      "https://chain.pchain.id/besu"
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

  const buyNFT = async (nft) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price,
    });

    await transaction.wait();
  };
  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);
  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        createSale,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};