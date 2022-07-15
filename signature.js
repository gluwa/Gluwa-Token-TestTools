module.exports = {
    signReserve: async function (chainId, contractAddress, sourceWallet, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum) {
        var hash = ethers.utils.solidityKeccak256(
            ['uint8', 'uint256', 'address', 'address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [4, chainId, contractAddress, sourceWallet.address, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum]
        );

        return await sourceWallet.signMessage(ethers.utils.arrayify(hash));
    },
    signTransfer: async function (chainId, contractAddress, sourceWallet, recipientAddress, amount, fee, nonce) {
        var hash = ethers.utils.solidityKeccak256(
            ['uint8', 'uint256', 'address', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [3, chainId, contractAddress, sourceWallet.address, recipientAddress, amount, fee, nonce]
        );

        return await sourceWallet.signMessage(ethers.utils.arrayify(hash));

    },
    signMintOrBurn: async function (action, chainId, contractAddress, sourceWallet, amount, fee, nonce) {
        var domain = (action.toLowerCase() == "mint") ? 2 : 1;
        var hash = ethers.utils.solidityKeccak256(
            ['uint8', 'uint256', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [domain, chainId, contractAddress, sourceWallet.address, amount, fee, nonce]
        );

        return await sourceWallet.signMessage(ethers.utils.arrayify(hash));
    },
    signStake: async function (tokenName ,ver, chainId, contractAddress, sourceWallet, amount, fee, nonce, expiry) {
        var signature = await sourceWallet._signTypedData(
            {
                name: tokenName,
                version: ver,
                chainId: chainId,
                verifyingContract: contractAddress
            },
            {
                stake:
                    [
                        {
                            name: 'amount',
                            type: 'uint256'
                        },
                        {
                            name: 'fee',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'expiry',
                            type: 'uint256'
                        }
                    ]
            },
            {
                amount,
                fee,
                nonce,
                expiry
            }
        );
        return ethers.utils.splitSignature(signature);
    },
    signMintToStake: async function (tokenName, version, chainId, contractAddress, sourceWallet, amount, fee, nonce, expiry) {
        var signature = await sourceWallet._signTypedData(
            {
                name: tokenName,
                version: version,
                chainId: chainId,
                verifyingContract: contractAddress
            },
            {
                mintToStake:
                    [
                        {
                            name: 'amount',
                            type: 'uint256'
                        },
                        {
                            name: 'fee',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'expiry',
                            type: 'uint256'
                        }
                    ]
            },
            {
                amount,
                fee,
                nonce,
                expiry
            }
        );
        return ethers.utils.splitSignature(signature);
    },
    signUnstake: async function (tokenName, version, chainId, contractAddress, sourceWallet, amount, fee, nonce, expiry) {
        var signature = await sourceWallet._signTypedData(
            {
                name: tokenName,
                version: version,
                chainId: chainId,
                verifyingContract: contractAddress
            },
            {
                unstake:
                    [
                        {
                            name: 'amount',
                            type: 'uint256'
                        },
                        {
                            name: 'fee',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'expiry',
                            type: 'uint256'
                        }
                    ]
            },
            {
                amount,
                fee,
                nonce,
                expiry
            }
        );
        return ethers.utils.splitSignature(signature);
    },
    signDelegate: async function (tokenName, version, chainId, contractAddress, sourceWallet, delegatee, fee, nonce, expiry) {
        var signature = await sourceWallet._signTypedData(
            {
                name: tokenName,
                version: version,
                chainId: chainId,
                verifyingContract: contractAddress
            },
            {
                delegate:
                    [
                        {
                            name: 'delegatee',
                            type: 'address'
                        },
                        {
                            name: 'fee',
                            type: 'uint256'
                        },
                        {
                            name: 'nonce',
                            type: 'uint256'
                        },
                        {
                            name: 'expiry',
                            type: 'uint256'
                        }
                    ]
            },
            {
                delegatee,
                fee,
                nonce,
                expiry
            }
        );
        return ethers.utils.splitSignature(signature);
    },
    signPermit: async function (tokenName, version, chainId, contractAddress, sourceWallet, targetAddress, amount, nonce, expirationTimestamp) {
        const signature = await sourceWallet._signTypedData(
            {
                name: tokenName,
                version: version,
                chainId: chainId,
                verifyingContract: contractAddress
            },
            {
                // Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
                Permit: [
                    {
                        name: 'owner',
                        type: 'address'
                    },
                    {
                        name: 'spender',
                        type: 'address'
                    },
                    {
                        name: 'value',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'uint256'
                    },
                    {
                        name: 'deadline',
                        type: 'uint256'
                    }
                ]
            },
            {
                owner: sourceWallet.address,
                spender: targetAddress,
                value: amount,
                nonce,
                deadline: expirationTimestamp
            }
        );
        return ethers.utils.splitSignature(signature);
    }
};