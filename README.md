# Gluwa-Token-TestTools
This package is used to test general functions in token contract

install it via npm i gluwa-token-testtools

## ERC20 Tests
in test file, make sure it has following variables:
1. Contract name - to fetch contractFactory by name
2. Token name
3. Token symbol
4. Token decimals
5. Mint amount
6. Mint function signature
7. Initialize function (Contract instance, owner) (OPTIONAL)
8. Arrays of errors messages (to override errors msg) (OPTIONAL)

Pass variables to the test function and put it in chai test

``describe('Test for ERC20 Functions', TestUtilies.ERC20Test("TestERC20","TokenName", "TOKEN_SYMBOL", MINT_AMOUNT, "faucetMint(address,uint256)"));``

OR
``
describe(
    'Test for ERC20 Functions',
    ERC20Test(
        testHelper.CONTRACT_NAME,
        testHelper.TOKEN_NAME,
        testHelper.TOKEN_SYMBOL,
        testHelper.TOKEN_DECIMALS,
        BigInt(testHelper.MINT_AMOUNT),
        testHelper.methods.MINT,
        testHelper.initializeContractTesting,
        testHelper.errors
    )
);
``

## Reserve Tests
in test file, make sure it has following variables:
1. Contract name - to fetch contractFactory by name
2. Mint amount
3. Mint function signature
4. Initialize function (Contract instance, owner) (OPTIONAL)
5. Array of errors messages (to override errors msg) (OPTIONAL)
6. Array of tests functions (to override tests functions) (OPTIONAL)

``
describe(
    'Test for Reservable Functions',
    ReserveTest(
        testHelper.CONTRACT_NAME,
        BigInt(testHelper.MINT_AMOUNT),
        testHelper.methods.MINT,
        testHelper.initializeContractTesting,
        testHelper.errors,
        testHelper.functions
    )
);
``