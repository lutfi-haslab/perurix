import axios from "axios";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import { useDropzone } from "react-dropzone";

import { create } from "ipfs-http-client";
import images from "../assets";
import { Button, Input } from "../components";
import { NFTContext } from "../context/NFTContext";
// const NFT_STORAGE_TOKEN = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
// const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
const client = create({
  url: "https://ipfs-api.pchain.id",
});

const CreateNFT = () => {
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const [formInput, setFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const { uploadToIPFS, createNFT } = useContext(NFTContext);
  const router = useRouter();
  const onDrop = useCallback(async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file[0]);

    const res = await axios.post(
      "https://api.pchain.id/ipfs/upload/file/project_yyehpe8wv0l4t1lfysgz8m03",
      formData,
      {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_PCHAIN_TOKEN,
        },
      }
    );
    if(res.data.data.data.url){
      setFileUrl(res.data.data.data.url)
      setLoading(false);
    }
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: "image/*",
    maxSize: 50000000,
  });

  const fileStyle = useMemo(
    () => `dark:bg-nft-black-1 bg-white border dark:border-white border-nft-gray-2 flex flex-col items-center p-5 rounded-sm border-dashed 
        ${isDragActive && "border-file-active"} 
        ${isDragAccept && "border-file-accept"}
        ${isDragReject && "border-file-reject"}
      `,
    [isDragActive, isDragAccept, isDragReject]
  );

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-3/5 md:w-full">
        <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 sm:mb-4">
          Create New NFT
        </h1>
        <div className="mt-16">
          <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
            Upload files
          </p>
          <div className="mt-4">
            <div {...getRootProps()} className={fileStyle}>
              <input {...getInputProps()} />
              <div className="flexCenter flex-col text-center">
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl">
                  JPG, GIF, SVG, WEBM Mx 100mb.
                </p>
                <div className="my-12 w-full flex justify-center">
                  <Image
                    src={images.upload}
                    width={100}
                    height={100}
                    objectFit="contain"
                    alt="File Upload"
                    className={theme === "light" ? "filter invert" : ""}
                  />
                </div>
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-sm">
                  Drag and Drop File
                </p>
                <p className="font-poppins dark:text-white text-nft-black-1 font-semibold text-xl mt-2">
                  or Browse media on your device
                </p>
               {loading &&  <p>Loading...</p>}
              </div>
            </div>
            {fileUrl && (
              <aside>
                <div>
                  <img src={fileUrl} alt="asset_file" />
                </div>
              </aside>
            )}
          </div>
        </div>
        <Input
          inputType="input"
          title="Name"
          placeholder="NFT Name"
          handleClick={(e) =>
            setFormInput({ ...formInput, name: e.target.value })
          }
        />
        <Input
          inputType="textarea"
          title="Desciption"
          placeholder="Description of your NFT"
          handleClick={(e) =>
            setFormInput({ ...formInput, description: e.target.value })
          }
        />
        <Input
          inputType="number"
          title="Price"
          placeholder="Enter Price"
          handleClick={(e) =>
            setFormInput({ ...formInput, price: e.target.value })
          }
        />
        <div className="mt-7 w-full flex justify-end">
          <Button
            btnName="Create NFT"
            className="rounded-xl"
            handleClick={() => createNFT(formInput, fileUrl, router)}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateNFT;
