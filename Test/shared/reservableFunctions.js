const { expect } = require('chai');
const { ethers } = require('hardhat');
const testHelper = require('./shared.js');
const ercFunctions = require('./ercFunctions.js');
const signatureHelper = require('./signature.js');

async function reserveTest(TokenContract, submitter, ownerAddress, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum, signature, doValidation, errMsg) {
    const originalReservedAmount = (await TokenContract.reservedBalanceOf(ownerAddress)).toBigInt();
    const originalUnreservedAmount = (await TokenContract.unreservedBalanceOf(ownerAddress)).toBigInt();
    const originalBalanceAmount = (await TokenContract.balanceOf(ownerAddress)).toBigInt();
    const txnInput = await TokenContract.connect(submitter).populateTransaction.reserve(
        ownerAddress, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum, signature
    );

    await testHelper.checkTxnResult(txnInput, submitter, errMsg);
    if (doValidation) {
        expect(await TokenContract.reservedBalanceOf(ownerAddress)).to.equal(originalReservedAmount + (fee + amount));
        expect(await TokenContract.unreservedBalanceOf(ownerAddress)).to.equal(originalUnreservedAmount - (fee + amount));
        expect(await TokenContract.balanceOf(ownerAddress)).to.equal(originalBalanceAmount);

        var reserve = await TokenContract.getReservation(ownerAddress, nonce);
        expect(reserve.amount).to.equal(amount);
        expect(reserve.fee).to.equal(fee);
        expect(reserve.recipient).to.equal(recipientAddress);
        expect(reserve.executor).to.equal(executorAddress);
        expect(reserve.expiryBlockNum).to.equal(expiryBlockNum);
        expect(reserve.status).to.equal(STATUS_ACTIVE);
    }
}

async function executeTest(TokenContract, submitter, executor, ownerAddress, nonce, doValidation, errMsg) {
    const reserve0 = await TokenContract.getReservation(ownerAddress, nonce);
    const originalReservedAmount = (await TokenContract.reservedBalanceOf(ownerAddress)).toBigInt();
    const originalBalanceAmountExecutor = (await TokenContract.balanceOf(executor.address)).toBigInt();
    const originalBalanceAmountRecipient = (await TokenContract.balanceOf(reserve0.recipient)).toBigInt();
    const originalBalanceAmount = (await TokenContract.balanceOf(ownerAddress)).toBigInt();

    const txnInput = await TokenContract.connect(submitter).populateTransaction.execute(
        ownerAddress, nonce
    );

    await testHelper.checkTxnResult(txnInput, submitter, errMsg);
    if (doValidation) {
        const fee = reserve0.fee.toBigInt();
        const amount = reserve0.amount.toBigInt();
        expect(await TokenContract.reservedBalanceOf(ownerAddress)).to.equal(originalReservedAmount - (fee + amount));
        expect(await TokenContract.balanceOf(reserve0.recipient)).to.equal(originalBalanceAmountRecipient + amount);
        expect(await TokenContract.balanceOf(executor.address)).to.equal(originalBalanceAmountExecutor + fee);
        expect(await TokenContract.balanceOf(ownerAddress)).to.equal(originalBalanceAmount - (fee + amount));

        const reserve = await TokenContract.getReservation(ownerAddress, nonce);
        expect(reserve.amount).to.equal(reserve0.amount);
        expect(reserve.fee).to.equal(reserve0.fee);
        expect(reserve.recipient).to.equal(reserve0.recipient);
        expect(reserve.executor).to.equal(reserve0.executor);
        expect(reserve.expiryBlockNum).to.equal(reserve0.expiryBlockNum);
        expect(reserve.status).to.equal(STATUS_COMPLETED);
    }
}

async function reclaimTest(TokenContract, submitter, executor, ownerAddress, nonce, doValidation, errMsg) {
    const reserve0 = await TokenContract.getReservation(ownerAddress, nonce);
    const originalReservedAmount = (await TokenContract.reservedBalanceOf(ownerAddress)).toBigInt();
    const originalBalanceAmountExecutor = (await TokenContract.balanceOf(executor.address)).toBigInt();
    const originalBalanceAmountRecipient = (await TokenContract.balanceOf(reserve0.recipient)).toBigInt();
    const originalBalanceAmount = (await TokenContract.balanceOf(ownerAddress)).toBigInt();

    const txnInput = await TokenContract.connect(submitter).populateTransaction.reclaim(
        ownerAddress, nonce
    );

    await testHelper.checkTxnResult(txnInput, submitter, errMsg);
    if (doValidation) {
        const fee = reserve0.fee.toBigInt();
        const amount = reserve0.amount.toBigInt();
        expect(await TokenContract.reservedBalanceOf(ownerAddress)).to.equal(originalReservedAmount - (fee + amount));
        expect(await TokenContract.balanceOf(reserve0.recipient)).to.equal(originalBalanceAmountRecipient);
        expect(await TokenContract.balanceOf(executor.address)).to.equal(originalBalanceAmountExecutor);
        expect(await TokenContract.balanceOf(ownerAddress)).to.equal(originalBalanceAmount);

        const reserve = await TokenContract.getReservation(ownerAddress, nonce);
        expect(reserve.amount).to.equal(reserve0.amount);
        expect(reserve.fee).to.equal(reserve0.fee);
        expect(reserve.recipient).to.equal(reserve0.recipient);
        expect(reserve.executor).to.equal(reserve0.executor);
        expect(reserve.expiryBlockNum).to.equal(reserve0.expiryBlockNum);
        expect(reserve.status).to.equal(STATUS_RECLAIMED);
    }
}


async function reserveWithSignatureGenerationTest(TokenContract, submitter, owner, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum, doValidation, errMsg) {
    chainId = await TokenContract.chainId();
    const signature = await signatureHelper.signReserve(chainId, TokenContract.address, owner, 
        recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum);
    // const signature = await signatureHelper.signReserve(chainId, TestToken.address, owner,
    //     users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum);

    await reserveTest(TokenContract, submitter, owner.address, recipientAddress, executorAddress, amount, fee, nonce, expiryBlockNum, signature, doValidation, errMsg)
}

const STATUS_DRAFT = 0;
const STATUS_ACTIVE = 1;
const STATUS_RECLAIMED = 2;
const STATUS_COMPLETED = 3;

module.exports = {
    reserveTest,
    reserveWithSignatureGenerationTest,
    executeTest,
    reclaimTest,
    STATUS_DRAFT,
    STATUS_ACTIVE,
    STATUS_RECLAIMED,
    STATUS_COMPLETED
}