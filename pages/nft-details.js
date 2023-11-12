import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { MarketAddress } from "../context/constants";

import { NFTContext } from "../context/NFTContext";
import { shortenAddress } from "../utils/shortenAddress";
import { Button, Loader, Modal } from "../components";
import images from "../assets/index";

const PaymentBodyCmp = ({ nft, nftCurrency }) => (
  <div className="flex flex-col">
    <div className="flexBetween">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">
        Item
      </p>
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">
        Subtotal
      </p>
    </div>
    <div className="flexBetweenStart my-5">
      <div className="flex-1 flexStartCenter">
        <div className="relative w-28 h-28">
          <Image
            src={nft.image || images[`nft${nft.i}`]}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="flexCenterStart flex-col ml-5">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm minlg:text-xl">
            {shortenAddress(nft.seller)}
          </p>
          <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">
            {nft.name}
          </p>
        </div>
      </div>
      <div>
        <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal">
          {nft.price * 10 ** 18}{" "}
          <span className="font-semibold">{nftCurrency}</span>
        </p>
      </div>
    </div>
    <div className="flexBetween mt-10">
      <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-base minlg:text-xl">
        Total
      </p>
      <p className="font-poppins dark:text-white text-nft-black-1 text-base minlg:text-xl font-normal">
        {nft.price * 10 ** 18}{" "}
        <span className="font-semibold">{nftCurrency}</span>
      </p>
    </div>
  </div>
);

const NFTDetails = () => {
  const { nftCurrency, currentAccount, buyNFT, NftEvent } =
    useContext(NFTContext);
  const [errMsg, setErrMsg] = useState(null);
  const [nft, setNft] = useState({
    image: "",
    itemId: "",
    name: "",
    owner: "",
    price: "",
    seller: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [paymentModal, setPaymentModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const checkout = async () => {
    const tx = await buyNFT(nft);
    // await NftEvent(nft);
    if (!tx.success) {
      setErrMsg("There is something Error, check your Allowance or Network");
      setPaymentModal(true);
      setSuccessModal(false);
    } else {
      setPaymentModal(false);
      setSuccessModal(true);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    setNft(router.query);
    console.log(nft);
    setIsLoading(false);
  }, [router.isReady]);

  if (isLoading) return <Loader />;

  return (
    <div className="relative flex justify-center md:flex-col min-h-screen">
      <div className="relative flex-1 flexCenter sm:px-4 p-12 border-r md:border-r-0 md:border-b dark:border-nft-black-1 border-nft-gray-1">
        <div className="relative w-557 minmd:w-2/3 minmd:h-2/3 sm:w-full sm:h-300 h-557 ">
          <Image
            src={nft.image || images[`nft${nft.i}`]}
            objectFit="cover"
            className=" rounded-xl shadow-lg"
            layout="fill"
          />
        </div>
      </div>

      <div className="flex-1 justify-start sm:px-4 p-12 sm:pb-4">
        <div className="flex flex-row sm:flex-col">
          <h2 className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-3xl">
            {nft.name}
          </h2>
        </div>

        <div className="mt-10">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-2xl minlg:text-2xl">
            Creator
          </p>
          <div className="flex flex-row items-center mt-3">
            <div className="relative w-12 h-12 minlg:w-20 minlg:h-20 mr-2">
              <Image
                src={images.creator1}
                objectFit="cover"
                className="rounded-full"
              />
            </div>
            <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-lg font-semibold">
              {shortenAddress(nft.seller)}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col">
          <div className="w-full border-b dark:border-nft-black-1 border-nft-gray-1 flex flex-row">
            <p className="font-poppins dark:text-white text-nft-black-1 font-medium text-base mb-2">
              Details
            </p>
          </div>
          <div className="mt-3">
            <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base">
              {nft.description}
            </p>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col mt-10">
          {currentAccount === nft.owner.toLowerCase() && (
            <div className="flex flex-col space-y-4 w-full">
              <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                You cannot buy your own NFT
              </p>
              <Button
                btnName="List on Marketplace"
                btnType="primary"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl w-full"
                handleClick={() =>
                  router.push(
                    `/resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`
                  )
                }
              />
            </div>
          )}
          {MarketAddress === nft.owner &&
            currentAccount === nft.seller.toLowerCase() && (
              <div className="flex flex-col space-y-4 w-full">
                <p className="font-poppins dark:text-white text-nft-black-1 font-normal text-base border border-gray p-2">
                  Buy back your NFT?
                </p>
                <Button
                  btnName={`Buy for ${nft.price * 10 ** 18} ${nftCurrency}`}
                  btnType="primary"
                  classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl w-full"
                  handleClick={() => {
                    setPaymentModal(true);
                  }}
                />
              </div>
            )}
          {MarketAddress === nft.owner &&
            currentAccount !== nft.seller.toLowerCase() && (
              <Button
                btnName={`Buy for ${nft.price * 10 ** 18} ${nftCurrency}`}
                btnType="primary"
                classStyles="mr-5 sm:mr-0 sm:mb-5 rounded-xl w-full"
                handleClick={() => {
                  setPaymentModal(true);
                }}
              />
            )}
        </div>
      </div>

      {paymentModal && (
        <Modal
          header="Check Out"
          body={<PaymentBodyCmp nft={nft} nftCurrency={nftCurrency} />}
          footer={
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex flex-row sm:flex-col ">
                <Button
                  btnName="Checkout"
                  classStyles="mr-5 sm:mr-0 rounded-xl"
                  handleClick={checkout}
                />
                <Button
                  btnName="Cancel"
                  classStyles="rounded-xl"
                  handleClick={() => {
                    setErrMsg(null);
                    setPaymentModal(false);
                  }}
                />
              </div>
              {errMsg && <p className="text-center text-red-600">{errMsg}</p>}
            </div>
          }
          handleClose={() => {
            setPaymentModal(false);
            setErrMsg(null);
          }}
        />
      )}
      {successModal && (
        <Modal
          header="Payment Successful"
          body={
            <div
              className="flexCenter flex-col text-center"
              onClick={() => setSuccessModal(false)}
            >
              <div className="relative w-52 h-52">
                <Image
                  src={nft.image || images[`nft${nft.i}`]}
                  objectFit="cover"
                  layout="fill"
                />
              </div>
              <p className="font-poppins dark:text-white text-nft-black-1 text-sm minlg:text-xl font-normal mt-10">
                {" "}
                You successfully purchased{" "}
                <span className="font-semibold">{nft.name}</span> from{" "}
                <span className="font-semibold">
                  {shortenAddress(nft.seller)}
                </span>
                .
              </p>
            </div>
          }
          footer={
            <div className="flexCentre flex-col ">
              <Button
                btnName="Check it out"
                classStyles="sm:mb-5 sm:mr-0 rounded-xl"
                handleClick={() => {
                  router.reload("/my-nfts");
                }}
              />
            </div>
          }
          handleClose={() => {
            setSuccessModal(false);
          }}
        />
      )}
    </div>
  );
};

export default NFTDetails;
