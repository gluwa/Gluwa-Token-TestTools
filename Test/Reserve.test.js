const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
var chai = require('chai');
const { ethers } = require('hardhat');
chai.use(require('chai-bignumber')());
use(solidity);

const testHelper = require('./shared/shared');
const errorMsgs = require('./shared/errorMsgs.js');
const ercFunctions = require('./shared/ercFunctions.js');
const signatureHelper = require('./shared/signature.js');
const reservableFunctions = require('./shared/reservableFunctions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const TOKEN_NAME = 'Test Token';
const TOKEN_SYMBOL = 'TEST';
const DECIMALS = 18;
const DECIMAL_PART = BigInt(10) ** BigInt(DECIMALS);
const STANDARD_MINT_AMOUNT = BigInt(2000) * DECIMAL_PART;
const FAUCET_MINT = "faucetMint(address,uint256)";

var users;
var owner;
var faucet1;
var faucet2;
var TestToken; 
const totalAddressCreated = testHelper.generateRandomizedNumber(10, 20);

// describe('Test for Reserveable Functions', ReserveableTest("Test", STANDARD_MINT_AMOUNT, FAUCET_MINT));

async function ReserveableTest(contractName, mintAmount, faucetMint) {
    before(async function () {
        [owner, faucet1, faucet2] = await ethers.getSigners();
        users = await testHelper.createWallets(totalAddressCreated, faucet1);
        this.contractFactory = await ethers.getContractFactory(contractName);
    });

    beforeEach(async function () {
        TestToken = await this.contractFactory.deploy();
        for (var i = 0; i < totalAddressCreated; i++) {
            await TestToken[faucetMint](users[i].address, mintAmount);
        }
        await TestToken[faucetMint](owner.address, mintAmount);
    });

    describe('ERC20Reserve - Reserve function', async function () {
        it('Basic reserve test', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 20));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
        });

        it('Can transfer if the amount is lesser than the unreserved amount', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const TRANSFER_AMOUNT = BigInt(testHelper.generateRandomizedNumber(1, 5));
            const AMOUNT = (await TestToken.balanceOf(users[1].address)).toBigInt() - FEE - TRANSFER_AMOUNT;
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            await ercFunctions.transferTest(TestToken, users[1], users[8].address, TRANSFER_AMOUNT, true);
        });

        it('Cannot transfer more than the unreserved amount', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = (await TestToken.balanceOf(users[1].address)).toBigInt() - FEE;
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            await ercFunctions.transferTest(TestToken, users[1], users[8].address, 1, false, errorMsgs.RESERVABLE_EXCEEDED_UNRESERVED_BALANCE);
        });

        it('Cannot reserve more than the balance', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            // the amount to be reserved = amount + fee
            const AMOUNT = (await TestToken.balanceOf(users[1].address)).toBigInt();
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, false, errorMsgs.RESERVABLE_INSUFFICIENT_UNRESERVED_BALANCE);
        });

        it('Reserve when recipient is the same as sender', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[1].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
        });

        it('Reserve when executor is the same as sender', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[1].address, users[3].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
        });

        it('Reserve when sender is submitter, executor and recipient', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[1], users[1], users[1].address, users[1].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
        });

        it('Cannot reserve with current blocknumber as expiryBlockNum', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber();
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, false, errorMsgs.RESERVABLE_INVALID_BLOCK_NUMBER);
        });

        it('Cannot reserve with outdated blocknumber as expiryBlockNum', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() - 1;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[3], users[5], users[7].address, users[9].address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, false, errorMsgs.RESERVABLE_INVALID_BLOCK_NUMBER);
        });

        it('Reserve when fee is higher than AMOUNT', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(11, 20));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
        });

        it('Reserve when fee is 0', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(0);
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
        });

        it('Reserve when amount is 0', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(0);
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[7].address, users[5].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
        });

        it('Cannot reserve when executor is address 0', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(1);
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], owner, users[7].address, ZERO_ADDRESS, AMOUNT, FEE, NONCE, expiryBlockNum, false, errorMsgs.RESERVABLE_EXCUTE_ADDRESS_0);
        });

        it('Can reserve when recipient is address 0', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(1);
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], ZERO_ADDRESS, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
        });

        it('A sender can make more than 1 reserve for different recipients', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            const expiryBlockNum_1 = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE_1 = BigInt(testHelper.generateRandomizedNumber(10, 20));
            const AMOUNT_1 = BigInt(testHelper.generateRandomizedNumber(1, 1000));
            const NONCE_1 = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT_1, FEE_1, NONCE_1, expiryBlockNum_1, true);
        });

        it('A sender can make more than 1 reserve for a recipient', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            const expiryBlockNum_1 = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE_1 = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT_1 = BigInt(testHelper.generateRandomizedNumber(10, 1000));
            const NONCE_1 = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT_1, FEE_1, NONCE_1, expiryBlockNum_1, true);
        });

        it('Can resue blocknum', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            const expiryBlockNum_1 = expiryBlockNum;
            const FEE_1 = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT_1 = BigInt(testHelper.generateRandomizedNumber(10, 1000));
            const NONCE_1 = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT_1, FEE_1, NONCE_1, expiryBlockNum_1, true);
        });

        it('Cannot resue nonce', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, true);
            const expiryBlockNum_1 = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE_1 = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT_1 = BigInt(testHelper.generateRandomizedNumber(10, 100));
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[2], users[1], users[3].address, users[7].address, AMOUNT_1, FEE_1, NONCE, expiryBlockNum_1, false, errorMsgs.RESERVABLE_NONCE_WAS_USED);
        });

        it('Invalid signature', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT = BigInt(testHelper.generateRandomizedNumber(10, 100));
            const NONCE = Date.now();
            chainId = await TestToken.chainId();
            const signature = await signatureHelper.signReserve(chainId, TestToken.address, users[1], users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum);
            const expiryBlockNum_1 = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE_1 = BigInt(testHelper.generateRandomizedNumber(1, 10));
            const AMOUNT_1 = BigInt(testHelper.generateRandomizedNumber(10, 100));
            // Various calls including different nonce, fee, amount, recipient, executor and expiration block to test invalid signature behavior
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[3].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum_1, signature, false, errorMsgs.INVALID_SIGNATURE);
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[3].address, users[7].address, AMOUNT, FEE_1, NONCE, expiryBlockNum, signature, false, errorMsgs.INVALID_SIGNATURE);
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[3].address, users[7].address, AMOUNT_1, FEE, NONCE, expiryBlockNum, signature, false, errorMsgs.INVALID_SIGNATURE);
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[3].address, users[7].address, AMOUNT_1, FEE, NONCE + 1, expiryBlockNum, signature, false, errorMsgs.INVALID_SIGNATURE);
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[5].address, users[7].address, AMOUNT, FEE, NONCE, expiryBlockNum, signature, false, errorMsgs.INVALID_SIGNATURE);
            await reservableFunctions.reserveTest(TestToken, users[2], users[1].address, users[3].address, users[2].address, AMOUNT, FEE, NONCE, expiryBlockNum, signature, false, errorMsgs.INVALID_SIGNATURE);
        });
    });

    describe('ERC20Reserve - Execute function', async function () {
        it('Basic execute test', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
        });

        it('Owner can execute', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = OWNER;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
        });

        it('Non-owner nor executor cannot execute', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = users[9];
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_ADDRESS_UNAUTHORIZED_EXECUTE);
        });

        it('Execute an invalid nonce', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE + 1, false, errorMsgs.RESERVABLE_RESERVATION_NOT_EXIST);
        });

        it('Execute an invalid address and nonce', async function () {
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_RESERVATION_NOT_EXIST);
        });

        it('Execute multiple times', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[2];
            const OWNER = users[5];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_INVALID_RESERVATION_STATUS_EXECUTE);
        });

        it('Execute after expiration', async function () {
            const BLOCK_PERIOD = 2;
            const expiryBlockNum = await ethers.provider.getBlockNumber() + BLOCK_PERIOD;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[3];
            const OWNER = users[6];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[4];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[7], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await testHelper.waitForNumberOfBlock(ethers.provider, BLOCK_PERIOD)
            await reservableFunctions.executeTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_RESERVATION_EXPIRED);
        });
    });

    describe('ERC20Reserve - Reclaim function', async function () {
        it('Basic reclaim test', async function () {
            const BLOCK_PERIOD = 2;
            const expiryBlockNum = await ethers.provider.getBlockNumber() + BLOCK_PERIOD;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = OWNER;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await testHelper.waitForNumberOfBlock(ethers.provider, BLOCK_PERIOD)
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
        });

        it('Executor can reclaim for owner', async function () {
            const BLOCK_PERIOD = 2;
            const expiryBlockNum = await ethers.provider.getBlockNumber() + BLOCK_PERIOD;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await testHelper.waitForNumberOfBlock(ethers.provider, BLOCK_PERIOD)
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
        });

        it('Owner cannot reclaim before expiration', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = OWNER;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_RESERVATION_NOT_EXPIRED_TO_RECLAIM);
        });

        it('Executor can reclaim before expiration', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
        });

        it('Non-owner nor executor cannot reclaim before execution', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = users[9];
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_ADDRESS_UNAUTHORIZED_RECLAIM);
        });

        it('Non-owner nor executor cannot reclaim after execution', async function () {
            const BLOCK_PERIOD = 2;
            const expiryBlockNum = await ethers.provider.getBlockNumber() + BLOCK_PERIOD;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = users[9];
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[9], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await testHelper.waitForNumberOfBlock(ethers.provider, BLOCK_PERIOD)
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_ADDRESS_UNAUTHORIZED_RECLAIM);
        });

        it('Reclaim an invalid nonce', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE + 1, false, errorMsgs.RESERVABLE_RESERVATION_NOT_EXIST);
        });

        it('Reclaim an invalid address and nonce', async function () {
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = EXECUTOR;
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_RESERVATION_NOT_EXIST);
        });

        it('Reclaim multiple times', async function () {
            const expiryBlockNum = await ethers.provider.getBlockNumber() + testHelper.generateRandomizedNumber(1, 1000);
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[2];
            const OWNER = users[5];
            const SUBMITTER = EXECUTOR;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_INVALID_RESERVATION_STATUS_RECLAIM);
        });

        it('Owner reclaim multiple times', async function () {
            const BLOCK_PERIOD = 2;
            const expiryBlockNum = await ethers.provider.getBlockNumber() + BLOCK_PERIOD;
            const FEE = BigInt(testHelper.generateRandomizedNumber(1, 10000));
            const NONCE = Date.now();
            const EXECUTOR = users[0];
            const OWNER = users[8];
            const SUBMITTER = OWNER;
            const RECIPIENT = users[3];
            await reservableFunctions.reserveWithSignatureGenerationTest(TestToken, users[6], OWNER, RECIPIENT.address, EXECUTOR.address, mintAmount - FEE, FEE, NONCE, expiryBlockNum, true);
            await testHelper.waitForNumberOfBlock(ethers.provider, BLOCK_PERIOD)
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, true);
            await reservableFunctions.reclaimTest(TestToken, SUBMITTER, EXECUTOR, OWNER.address, NONCE, false, errorMsgs.RESERVABLE_INVALID_RESERVATION_STATUS_RECLAIM);
        });

       
    });


};

module.exports = { ReserveableTest }