const { expect } = require('chai');
const { ethers } = require('hardhat');
const signatureHelper = require('./signature.js');

async function mintAndApprove(ERC20TokenContract, account, spenderAddress, amountToApprove, wrappingRate) {    
    await ERC20TokenContract["faucetMint(address,uint256)"](account.address, amountToApprove * wrappingRate);
    await approveTest(ERC20TokenContract, account, spenderAddress, amountToApprove, false);
}

async function approveTest(ERC20TokenContract, account, spenderAddress, amountToApprove, doValidation, errMsg) {
    const inputApprove = await ERC20TokenContract.connect(account).populateTransaction.approve(
        spenderAddress,
        amountToApprove
    );
    await checkTxnResult(inputApprove, account, ethers, ethers.provider, errMsg);
    if (doValidation) {
        expect(await ERC20TokenContract.allowance(account.address, spenderAddress)).to.equal(
            amountToApprove
        );
    }
}

async function increaseAllowanceTest(ERC20TokenContract, account, spenderAddress, originalAmount, amountToIncrease, doValidation, errMsg) {
    const inputIncreaseAllowance = await ERC20TokenContract.connect(account).populateTransaction.increaseAllowance(
        spenderAddress,
        amountToIncrease
    );
    await checkTxnResult(inputIncreaseAllowance, account, ethers, ethers.provider, errMsg);
    if (doValidation) {
        expect(await ERC20TokenContract.allowance(account.address, spenderAddress)).to.equal(
            originalAmount + amountToIncrease
        );
    }
}

async function decreaseAllowanceTest(ERC20TokenContract, account, spenderAddress, originalAmount, amountToDecrease, doValidation, errMsg) {
    const inputDecreaseAllowance = await ERC20TokenContract.connect(account).populateTransaction.decreaseAllowance(
        spenderAddress,
        amountToDecrease
    );
    await checkTxnResult(inputDecreaseAllowance, account, ethers, ethers.provider, errMsg);
    if (doValidation) {
        expect(await ERC20TokenContract.allowance(account.address, spenderAddress)).to.equal(originalAmount - amountToDecrease);
    }
}

async function transferTest(ERC20TokenContract, account, spenderAddress, amountToTransfer, doValidation, errMsg) {
    const originalBalanceSender = await ERC20TokenContract.balanceOf(account.address);
    const originalBalanceSpender = await ERC20TokenContract.balanceOf(spenderAddress);
    const inputTransfer = await ERC20TokenContract.connect(account).populateTransaction["transfer(address,uint256)"](
        spenderAddress,
        amountToTransfer
    );
    await checkTxnResult(inputTransfer, account, ethers, ethers.provider, errMsg);

    if (doValidation) {
        expect(await ERC20TokenContract.balanceOf(account.address)).to.equal(
            ethers.BigNumber.from(originalBalanceSender).sub(amountToTransfer)
        );

        expect(await ERC20TokenContract.balanceOf(spenderAddress)).to.equal(
            ethers.BigNumber.from(originalBalanceSpender).add(amountToTransfer)
        );
    }
}

async function transferFromTest(ERC20TokenContract, account, submitter, recipientAddress, amountToTransfer, doValidation, errMsg) {
    const originalBalanceSender = await ERC20TokenContract.balanceOf(account.address);
    const originalBalanceSubmitter = await ERC20TokenContract.balanceOf(submitter.address);
    const originalBalanceSpender = await ERC20TokenContract.balanceOf(recipientAddress);
    const inputTransfer = await ERC20TokenContract.connect(submitter).populateTransaction["transferFrom(address,address,uint256)"](
        account.address,
        recipientAddress,
        amountToTransfer
    );
    await checkTxnResult(inputTransfer, submitter, ethers, ethers.provider, errMsg);

    if (doValidation) {
        expect(await ERC20TokenContract.balanceOf(submitter.address)).to.equal(
            originalBalanceSubmitter
        );
        expect(await ERC20TokenContract.balanceOf(account.address)).to.equal(
            ethers.BigNumber.from(originalBalanceSender).sub(amountToTransfer)
        );
        expect((await ERC20TokenContract.balanceOf(recipientAddress)).toString()).to.equal(
            ethers.BigNumber.from(originalBalanceSpender).add(amountToTransfer)
        );
    }
}

async function transferBySigTest(ERC20TokenContract, chainId, account, submitter, spenderAddress, amountToTransfer, feeToPay, nonce, doValidation, errMsg) {
    const beforeTransferSenderBalance = await ERC20TokenContract.balanceOf(account.address);
    const originalBalanceSubmitter = await ERC20TokenContract.balanceOf(submitter.address);
    const beforeTransferusers2Balance = await ERC20TokenContract.balanceOf(spenderAddress);

    const signature = signatureHelper.signTransfer(
        chainId,
        ERC20TokenContract.address,
        account,
        spenderAddress,
        amountToTransfer,
        feeToPay,
        nonce
    );

    const inputTransfer = await ERC20TokenContract.connect(submitter).populateTransaction[
        "transfer(address,address,uint256,uint256,uint256,bytes)"
    ](account.address, spenderAddress, amountToTransfer, feeToPay, nonce, signature);
    await checkTxnResult(inputTransfer, submitter, ethers, ethers.provider, errMsg);

    if (doValidation) {
        expect(await ERC20TokenContract.balanceOf(submitter.address)).to.equal(
            originalBalanceSubmitter
        );
        expect(await ERC20TokenContract.balanceOf(account.address)).to.equal(
            ethers.BigNumber.from(beforeTransferSenderBalance).sub(amountToTransfer).sub(feeToPay)
        );
        expect(await ERC20TokenContract.balanceOf(spenderAddress)).to.equal(
            ethers.BigNumber.from(beforeTransferusers2Balance).add(amountToTransfer)
        );
    }
}

async function burnTest(ERC20TokenContract, account, amount, doValidation, errMsg) {
    const originalBalanceSender = await ERC20TokenContract.balanceOf(account.address);
    const txnInput = await ERC20TokenContract.connect(account).populateTransaction["burn(uint256)"](amount);

    await checkTxnResult(txnInput, account, ethers, ethers.provider, errMsg);

    if (doValidation) {
        expect(await ERC20TokenContract.balanceOf(account.address)).to.equal(
            ethers.BigNumber.from(originalBalanceSender).sub(amount)
        );
    }
}

async function permitTest(ERC20TokenContract, submitter, accountAddress, spenderAddress, amountToPermit, expirationTimestamp, v, r, s, doValidation, errMsg) {
    var txnInput = await ERC20TokenContract.connect(submitter).populateTransaction.permit(
        accountAddress,
        spenderAddress,
        amountToPermit,
        expirationTimestamp,
        v,
        r,
        s
    );

    await checkTxnResult(txnInput, submitter, ethers, ethers.provider, errMsg);
    if (doValidation) {
        expect(await ERC20TokenContract.allowance(accountAddress, spenderAddress)).to.equal(
            amountToPermit
        );
    }
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

async function submitRawTxn(input, sender, ethers, provider) {
    const txCount = await provider.getTransactionCount(sender.address);
    var rawTx = {
        nonce: ethers.utils.hexlify(txCount),
        to: input.to,
        value: 0x00,
        gasLimit: ethers.utils.hexlify(1950000),
        gasPrice: ethers.utils.hexlify(5000),
        data: input.data
    };
    const rawTransactionHex = await sender.signTransaction(rawTx);
    const { hash } = await provider.sendTransaction(rawTransactionHex);
    await provider.waitForTransaction(hash);
    return await provider.getTransactionReceipt(hash);
}
module.exports = {
    mintAndApprove,
    transferTest,
    transferFromTest,
    transferBySigTest,
    burnTest,
    approveTest,
    increaseAllowanceTest,
    decreaseAllowanceTest,
    permitTest
}