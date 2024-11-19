import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider,account,  escrow, togglePop }) => {
    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)
    const [owner, setOwner] = useState(null)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const log = ()=>{
        console.log("Buyer:", buyer);
console.log("Seller:", seller);
console.log("Lender:", lender);
console.log("Inspector:", inspector);

    }

    const fetchDetails = async () => {
        
        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id, buyer)
        setHasBought(hasBought)

        const seller = await escrow.seller(home.id)
        setSeller(seller)

        const hasSold = await escrow.approval(home.id, seller)
        setHasSold(hasSold)

        const lender = await escrow.lender(home.id)
        setLender(lender)
        
        const hasLended = await escrow.approval(home.id, lender)
        setHasLended(hasLended)

        const inspector = await escrow.inspector(home.id)
        setInspector(inspector)

        const hasInspected = await escrow.approval(home.id, inspector)
        setHasInspected(hasInspected)



    }

    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.buyer(home.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
    try {
        console.log("Buy button clicked!");

        // Fetch buyer address from the contract
        const buyerAddress = await escrow.buyer(home.id);
        console.log("Buyer address from contract:", buyerAddress);
        console.log("Connected account:", account);

        // Compare with the connected account
        if (account.toLowerCase() !== buyerAddress.toLowerCase()) {
            console.error("Error: Connected account is not the buyer. Cannot proceed.");
            alert("You are not authorized to buy this property. Please connect with the buyer's wallet.");
            return; // Stop further execution
        }

        // Fetch escrow amount
        const escrowAmount = await escrow.escrowAmount(home.id);
        console.log("Escrow amount:", escrowAmount);

        const signer = await provider.getSigner();
        console.log("Signer address:", await signer.getAddress());

        // Deposit escrow amount and approve sale
        let transaction = await escrow.connect(signer).depositEarner({ value: escrowAmount });
        await transaction.wait();
        console.log("Deposit transaction successful");

        transaction = await escrow.connect(signer).approveSale();
        await transaction.wait();
        console.log("Approval transaction successful");

        setHasBought(true);
    } catch (error) {
        console.error("Error in buyHandler:", error); // Log any errors
    }
};


    const sellHandler = async ()=>{
        const signer = await provider.getSigner()

        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
    }

    const lendHandler = async ()=>{
        const signer = await provider.getSigner()

        const  transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({to: escrow.address, value: lendAmount.toString(), gasLimit: 60000})
    
        setHasLended(true)
    }

    const inspectionHandler = async ()=>{
        const signer = await provider.getSigner()

        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
    }

    useEffect(()=>{
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <div className="home">
            <div className='home__details'>
                <div className='home__image'>
                       <img src={home.image} alt='Home'></img> 
                </div>
              
                <div className='home__overview'>
                        <h1>
                            {home.name}
                        </h1>
                        <p>
                            <strong>{home.attributes[2].value}</strong> bds |     
                            <strong>{home.attributes[3].value}</strong> bd |     
                            <strong>{home.attributes[4].value}</strong> sqft     
                        </p>
                        <p>{home.address}</p>
                        <h2>{home.attributes[0].value} ETH</h2>

                        {owner ? (
                            <div className='home__owned'>
                                Owned by {owner.slice(0,6)+'...'+owner.slice(38,42)}
                            </div>
                        ): (
                            <div>
                                {(account === inspector) ? (
                                    <button className='home__buy' onClick={inspectionHandler} disabled={hasInspected}>
                                        Approve Inspection
                                    </button>
                                ) : ( account === lender) ? (
                                    <button className='home__buy' onClick={lendHandler} disabled={hasLended}>
                                        Approve && lend
                                    </button>
                                ): (account === seller)?(
                                    <button className='home__buy' onClick={sellHandler} disabled={hasSold}>
                                        Approve && sell
                                    </button>
                                ):(
                                    <div>
                                    <button className='home__buy' onClick={buyHandler} disabled={buyer && account.toLowerCase() !== buyer.toLowerCase()}>
                                        Buy
                                    </button>
                                     </div>
                                )}

                        <div>
                            <button className='home__contact'>
                                Contact agent
                            </button>

                        </div>
                            </div>
                        )}

                        

                        

                        <hr/>

                        <h2>Overview</h2>
                        <p>
                            {home.description}
                        </p>
                        <h2>
                            Facts and feature
                        </h2>

                        <ul>
                            {home.attributes.map((attribute, index) =>(
                                <li key={index}>
                                    <strong>{attribute.trait_type}</strong> : {attribute.value}
                                </li>
                            ))}
                        </ul>

                </div>

            <button onClick={togglePop} className='home__close'>
                <img src={close} alt='Close'></img>

            </button>

            </div>


        </div>
    );
}

export default Home;
