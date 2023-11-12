import React from 'react'
import { NFTContext } from "../context/NFTContext";
const Test = () => {
    const { fetchNFTs } = React.useContext(NFTContext);
  return (
    <div>{fetchNFTs && JSON.stringify(fetchNFTs)}</div>
  )
}

export default Test