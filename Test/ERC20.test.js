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
var chaiId;
const totalAddressCreated = testHelper.generateRandomizedNumber(10, 20)

// describe('Test for ERC20 Functions', ERC20Test("TestERC20",TOKEN_NAME, TOKEN_SYMBOL, STANDARD_MINT_AMOUNT, FAUCET_MINT));

async function ERC20Test(contractName, tokenName, tokenSymbol, tokenDecimals, mintAmount, faucetMint, initialize, errorMsgs) {
    before(async function () {
        [owner, faucet1, faucet2] = await ethers.getSigners();
        users = await testHelper.createWallets(totalAddressCreated, faucet1);
        this.contractFactory = await ethers.getContractFactory(contractName);
    });

    beforeEach(async function () {
        TestToken = await this.contractFactory.deploy();
        if (initialize) await initialize(TestToken, owner);
        for (var i = 0; i < totalAddressCreated; i++) {
            await TestToken[faucetMint](users[i].address, mintAmount);
        }
        await TestToken[faucetMint](owner.address, mintAmount);
    });

    describe('ERC20 Token Info and balance', async function () {
        it('Token name is correct', async function () {
            expect(await TestToken.name()).to.equal(tokenName);
        });

        it('Token symbol is correct', async function () {
            expect(await TestToken.symbol()).to.equal(tokenSymbol);
        });

        it('Token decimals is correct', async function () {
            expect(await TestToken.decimals()).to.equal(tokenDecimals);
        });

        it('Total supply test', async function () {
            expect(await TestToken.totalSupply()).to.equal(mintAmount*BigInt(totalAddressCreated + 1));
            var currSupply = await TestToken.totalSupply();
            await TestToken[faucetMint](owner.address, mintAmount);
            expect(await TestToken.totalSupply()).to.equal(BigInt(currSupply) + BigInt(mintAmount));
        });

        it('Token balance test', async function () {           
            for (var i = 0; i < totalAddressCreated; i++) {
                expect(await TestToken.balanceOf(users[i].address)).to.equal(mintAmount);
            }
            expect(await TestToken.balanceOf(owner.address)).to.equal(mintAmount);
        });
    }); 

    describe('ERC20 - Allowance', async function () {
        it('Test approve()', async () => {
            await ercFunctions.approveTest(TestToken, users[1], users[2].address, 100, true);
        });

        it('Test increaseAllowance() without approve()', async () => {
            expect(await TestToken.allowance(users[1].address, users[2].address)).to.equal(
                0
            );
            await ercFunctions.increaseAllowanceTest(TestToken, users[1], users[2].address, 0, 109, true);
        });

        it('Test decreaseAllowance()', async () => {
            const approveAmount = 1101;
            await ercFunctions.approveTest(TestToken, users[1], users[2].address, approveAmount, true);
            await ercFunctions.decreaseAllowanceTest(TestToken, users[1], users[2].address, approveAmount, 7, true);
        });

        it('Test approve() after increaseAllowance', async () => {
            await ercFunctions.increaseAllowanceTest(TestToken, users[1], users[2].address, 0, 119, true);
            await ercFunctions.approveTest(TestToken, users[1], users[2].address, 3, true);
        });

        it('Test decreaseAllowance without approve()', async () => {
            expect(await TestToken.allowance(users[1].address, users[2].address)).to.equal(
                0
            );
            await ercFunctions.decreaseAllowanceTest(TestToken, users[1], users[2].address, 0, 7, false, "ERC20: decreased allowance below zero");
        });

        it('Test decreaseAllowance more than approve()', async () => {
            const approveAmount = testHelper.generateRandomizedNumber(1, 10);
            const decreaseAmount = testHelper.generateRandomizedNumber(10, 20);
            await ercFunctions.approveTest(TestToken, users[1], users[2].address, approveAmount, true);
            await ercFunctions.decreaseAllowanceTest(TestToken, users[1], users[2].address, approveAmount, decreaseAmount, false, "ERC20: decreased allowance below zero");
        });

        it('Test increaseAllowance() after approve()', async () => {
            const approveAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.approveTest(TestToken, users[1], users[2].address, approveAmount, true);
            await ercFunctions.increaseAllowanceTest(TestToken, users[1], users[2].address, approveAmount, 7, true);
        });

        it('No balance can approve(), increaseAllowance() and decreaseAllowance()', async () => {
            const approveAmount = testHelper.generateRandomizedNumber(1, 1000);
            const increaseAmount = testHelper.generateRandomizedNumber(1, 20);
            const newUsers = await testHelper.createWallets(1, faucet2);
            expect(await TestToken.balanceOf(newUsers[0].address)).to.equal(0);

            await ercFunctions.approveTest(TestToken, newUsers[0], users[2].address, approveAmount, true);
            await ercFunctions.increaseAllowanceTest(TestToken, newUsers[0], users[2].address, approveAmount, increaseAmount, true);
            await ercFunctions.decreaseAllowanceTest(TestToken, newUsers[0], users[2].address, approveAmount + increaseAmount, 12, true);
        });

    });

    describe('ERC20 - transfer and transferFrom', async function () {
        it('Test basic ERC20 transfer() - recipient has balance > 0', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            testHelper.compareBigNumber(await TestToken.balanceOf(users[8].address),0);
            await ercFunctions.transferTest(TestToken, users[7], users[8].address, transferAmount, true);
        });

        it('Test basic ERC20 transfer() - send 0 amount', async () => {
            await ercFunctions.transferTest(TestToken, users[7], users[8].address, 0, true);
        });

        it('Test basic ERC20 transfer() - sender = recipient', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.transferTest(TestToken, users[7], users[7].address, transferAmount, false);
        });

        it('Test basic ERC20 transfer() - recipient has balance = 0', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            const newUsers = await testHelper.createWallets(1, faucet2);
            expect(await TestToken.balanceOf(newUsers[0].address)).to.equal(0);
            await ercFunctions.transferTest(TestToken, users[7], newUsers[0].address, transferAmount, true);
        });

        it('Test basic ERC20 transfer() -  insufficient to transfer', async () => {
            const transferBalance = await TestToken.balanceOf(users[7].address) + 1;
            await ercFunctions.transferTest(TestToken, users[7], users[8].address, transferBalance, false, errorMsgs.INSUFFICIENT_BALANCE);
        });

        it('Test basic ERC20 transferFrom() - recipient has balance > 0', async () => {
            testHelper.compareBigNumber(await TestToken.balanceOf(users[8].address), 0);
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.approveTest(TestToken, users[7], users[6].address, transferAmount, true);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, true);
        });

        it('Test basic ERC20 transferFrom() - recipient has balance > 0 without approve', async () => {
            testHelper.compareBigNumber(await TestToken.balanceOf(users[8].address), 0);
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, false, errorMsgs.INSUFFICIENT_ALLOWANCE);
        });

        it('Test basic ERC20 transferFrom() - 0 amount with approve', async () => {
            const transferAmount = 0;
            await ercFunctions.approveTest(TestToken, users[7], users[6].address, transferAmount, true);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, true);
        });

        it('Test basic ERC20 transferFrom() - 0 amount without approve', async () => {
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, 0, true);
        });

        it('Test basic ERC20 transferFrom() - insufficient balance', async () => {
            const transferAmount = await TestToken.balanceOf(users[7].address) + 1;
            await ercFunctions.approveTest(TestToken, users[7], users[6].address, transferAmount, true);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, false, errorMsgs.INSUFFICIENT_BALANCE);
        });

        it('Test basic ERC20 transferFrom() - submitter == sender but no approve', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, false, errorMsgs.INSUFFICIENT_ALLOWANCE);
        });

        it('Test basic ERC20 transferFrom() - recipient == sender', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.approveTest(TestToken, users[7], users[6].address, transferAmount, true);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount, true);
        });

        it('Test basic ERC20 transferFrom() - recipient == sender but no approve', async () => {
            const transferAmount = testHelper.generateRandomizedNumber(1, 1000);
            await ercFunctions.transferFromTest(TestToken, users[7], users[6], users[8].address, transferAmount,  false, errorMsgs.INSUFFICIENT_ALLOWANCE);
        });
    });
}
module.exports = { ERC20Test };