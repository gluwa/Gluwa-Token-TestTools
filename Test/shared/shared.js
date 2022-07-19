const { ethers, web3, upgrades, network, addressBook } = require('hardhat');
const { expect, use } = require('chai');

async function waitForNumberOfBlock(provider, numberOfBlock) {
    const CURRENT_BLOCK = await provider.getBlockNumber();
    var temp = CURRENT_BLOCK;
    while (temp < CURRENT_BLOCK + numberOfBlock) {
        await provider.send('evm_mine');
        temp++;
    }
}
async function createWallets(numberOfWallet, etherFaucetAddress) {
    let wallets = [];
    for (var i = 0; i < numberOfWallet; i++) {
        var temp = await ethers.Wallet.createRandom();
        await etherFaucetAddress.sendTransaction({
            to: temp.address,
            value: ethers.utils.parseEther("10")
        });
        wallets[i] = temp;
    }
    return wallets;
}
function compareBigNumber(expectedGreater, expectedLower) {
    if (expectedGreater <= expectedLower) {
        expect.fail("AssertionError: expected " + expectedGreater + " to be greater than " + expectedLower);
    }
}
async function submitRawTxn(input, sender, ethers, provider) {
    const txCount = await provider.getTransactionCount(sender.address);
    var rawTx = {
        nonce: ethers.utils.hexlify(txCount),
        to: input.to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(1950000),
        gasPrice: ethers.utils.hexlify(90000000),
        data: input.data
    };
    const rawTransactionHex = await sender.signTransaction(rawTx);
    const { hash } = await provider.sendTransaction(rawTransactionHex);
    await provider.waitForTransaction(hash);
    return await provider.getTransactionReceipt(hash);
}

async function checkTxnResult(input, sender, ethers, provider, errMsg) {
    let result;
    if (network.name === 'hardhat') {
        if (errMsg) {
            await expect(submitRawTxn(input, sender, ethers, provider)).to.be.revertedWith(errMsg);
        } else {
            result = await submitRawTxn(input, sender, ethers, provider);
            expect(result.status).to.equal(1);
        }
    } else {
        if (errMsg) {
            result = await submitRawTxn(input, sender, ethers, provider);
            expect(result.status).to.equal(0);
        } else {
            result = await submitRawTxn(input, sender, ethers, provider);
            expect(result.status).to.equal(1);
        }
    }
    return result;
};
module.exports = { createWallets, compareBigNumber, submitRawTxn, checkTxnResult, waitForNumberOfBlock}