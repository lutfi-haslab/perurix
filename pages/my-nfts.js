import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { NFTContext } from "../context/NFTContext";
import {
  Loader,
  NFTCard,
  Banner,
  SearchBar,
  Button,
  Modal,
} from "../components";
import images from "../assets";
import { shortenAddress } from "../utils/shortenAddress";
import { useRouter } from "next/router";

const MyNFTs = () => {
  const [showModal, setShowModal] = useState(false);
  const [allowance, setAllowance] = useState(0);
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    fetchMyNFTsOrListedNFTs,
    currentAccount,
    currAllowance,
    currBalance,
    addAllowance,
    getAllowance,
  } = useContext(NFTContext);
  const [activeSelect, setActiveSelect] = useState("Recently added");
  const router = useRouter();

  useEffect(() => {
    fetchMyNFTsOrListedNFTs("").then((items) => {
      setNfts(items);
      setNftsCopy(items);
      setIsLoading(false);
    });
  }, [currAllowance]);

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case "Price (low to high)":
        setNfts(sortedNfts.sort((a, b) => a.price - b.price));
        break;
      case "Price (high to low)":
        setNfts(sortedNfts.sort((a, b) => b.price - a.price));
        break;
      case "Recently added":
        setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
        break;
      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);
  if (isLoading) {
    return (
      <div className="flexStart min-h-screen">
        <Loader />
      </div>
    );
  }
  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) =>
      name.toLowerCase().includes(value.toLowerCase())
    );

    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      setNfts(nftsCopy);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  return (
    <div className="w-full flex justify-start items-center flex-col min-h-screen">
      <div className="w-full flexCenter flex-col">
        <Banner
          name="Your Nifty NFTs"
          childStyles="text-center mb-4"
          parentStyle="h-80 justify-center"
        />

        <div className="flexCenter flex-col -mt-20 z-0">
          <div className="flexCenter w-40 h-40 sm:w-36 sm:h-36 p-1 bg-nft-black-2 rounded-full">
            <Image
              src={images.creator1}
              className="rounded-full object-cover"
              objectFit="cover"
            />
          </div>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl mt-6">
            {shortenAddress(currentAccount)}
          </p>
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
            {currBalance} IDRC
          </p>
          <p className="font-poppins dark:text-white text-nft-black-1 font-medium mb-2">
            you have {currAllowance} allowance
          </p>
          <Button
            btnName="Increase Allowance"
            btnType="outline"
            classStyles="mx-2 rounded-md"
            handleClick={() => setShowModal(true)}
          />
        </div>
      </div>

      {!isLoading && !nfts.length && !nftsCopy.length ? (
        <div className="flexCenter sm:p-4 p-16">
          <h1 className="font-poppins dark:text-white text-nft-black-1 text-3xl font-extrabold">
            No NFTs owned
          </h1>
        </div>
      ) : (
        <div className="sm:px-4 p-12 w-full minmd:w-4/5 flexCenter flex-col">
          <div className="flex-1 w-full flex flex-row sm:flex-col px-4 xs:px-0 minlg:px-8">
            <SearchBar
              activeSelect={activeSelect}
              setActiveSelect={setActiveSelect}
              handleSearch={onHandleSearch}
              clearSearch={onClearSearch}
            />
          </div>
          <div className="mt-3 w-full flex flex-wrap">
            {nfts.map((nft) => (
              <NFTCard key={`nft-${nft.tokenId}`} nft={nft} onProfilePage />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <Modal
          header="Increase Allowance"
          body={
            <div
              className="grid grid-cols-3 gap-2"
              // onClick={() => setSuccessModal(false)}
            >
              <Button
                btnName="add 1000"
                btnType="outline"
                classStyles={`mx-2 rounded-md w-full hover:bg-blue-700 active:bg-blue-700 ${
                  allowance === 1000 && "bg-blue-700"
                }`}
                handleClick={() => setAllowance(1000)}
              />
              <Button
                btnName="add 100000"
                btnType="outline"
                classStyles={`mx-2 rounded-md w-full hover:bg-blue-700 active:bg-blue-700 ${
                  allowance === 100000 && "bg-blue-700"
                }`}
                handleClick={() => setAllowance(100000)}
              />
              <Button
                btnName="add 1000000"
                btnType="outline"
                classStyles={`mx-2 rounded-md w-full hover:bg-blue-700 active:bg-blue-700 ${
                  allowance === 1000000 && "bg-blue-700"
                }`}
                handleClick={() => setAllowance(1000000)}
              />
              <Button
                btnName="add 100000000"
                btnType="outline"
                classStyles={`mx-2 rounded-md w-full hover:bg-blue-700 ${
                  allowance === 100000000 ? "bg-blue-700" : ""
                }`}
                handleClick={() => setAllowance(100000000)}
              />
            </div>
          }
          footer={
            <div className="flexCentre flex-col ">
              <Button
                btnName={`Add ${allowance} allowance`}
                classStyles="sm:mb-5 sm:mr-0 rounded-xl"
                handleClick={async () => {
                  const res = await addAllowance(allowance);
                  console.log(res);
                  if (res) {
                    setShowModal(false);
                    router.reload("/my-nfts");
                  }
                }}
              />
            </div>
          }
          handleClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MyNFTs;
