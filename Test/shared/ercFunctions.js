const { expect } = require('chai');
const { ethers } = require('hardhat');
const signatureHelper = require('./signature.js');
const testHelper = require('./shared');
async function mintAndApprove(faucetMint,ERC20TokenContract, account, spenderAddress, amountToApprove, wrappingRate) {    
    await ERC20TokenContract[faucetMint](account.address, amountToApprove * wrappingRate);
    await approveTest(ERC20TokenContract, account, spenderAddress, amountToApprove, false);
}

async function approveTest(ERC20TokenContract, account, spenderAddress, amountToApprove, doValidation, errMsg) {
    const inputApprove = await ERC20TokenContract.connect(account).populateTransaction.approve(
        spenderAddress,
        amountToApprove
    );
    await testHelper.checkTxnResult(inputApprove, account, errMsg);
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
    await testHelper.checkTxnResult(inputIncreaseAllowance, account, errMsg);
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
    await testHelper.checkTxnResult(inputDecreaseAllowance, account, errMsg);
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
    await testHelper.checkTxnResult(inputTransfer, account, errMsg);

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
    await testHelper.checkTxnResult(inputTransfer, submitter, errMsg);

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
    await testHelper.checkTxnResult(inputTransfer, submitter, ethers, ethers.provider, errMsg);

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

    await testHelper.checkTxnResult(txnInput, account, errMsg);

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

    await testHelper.checkTxnResult(txnInput, submitter, errMsg);
    if (doValidation) {
        expect(await ERC20TokenContract.allowance(accountAddress, spenderAddress)).to.equal(
            amountToPermit
        );
    }
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