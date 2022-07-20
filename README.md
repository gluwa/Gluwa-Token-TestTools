# Gluwa-Token-TestTools
This package is used to test general functions in token contract

install it via npm i gluwa-token-testtools

in test file, make sure it has following variables:
1. Contract name - to fetch contractFactory by name
2. Token name
3. Token symbol
4. Mint amount
5. faucetMint string - function string that owner can mint for test 
Pass variables to the test function and put it in chai test
``describe('Test for ERC20 Functions', TestUtilies.ERC20Test("TestERC20","TokenName", "TOKEN_SYMBOL", MINT_AMOUNT, "faucetMint(address,uint256)"));``
