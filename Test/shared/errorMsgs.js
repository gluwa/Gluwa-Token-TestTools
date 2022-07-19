const INSUFFICIENT_ALLOWANCE = "ERC20: insufficient allowance";
const INSUFFICIENT_BALANCE = "ERC20: transfer amount exceeds balance";
const INSUFFICIENT_BALANCE_ETHLESS = "ERC20ETHless: the balance is not sufficient";
const NONCE_REUSED_ETHLESS = "ERC20ETHless: the nonce has already been used for this address";
const INVALID_SIGNATURE = "Validate: invalid signature";
const INVALID_SIGNATURE_PERMIT = "ERC20Permit: invalid signature";
const EXPIRED_SIGNATURE_PERMIT = "ERC20Permit: expired deadline";
const RESTRICTED_TO_ADMIN = "ERC20StakedVotesUpgradeable: Restricted to Admin.";
const INVALID_AMOUNT = "ERC20StakedVotesUpgradeable: Invalid amount";
const EXCEEDED_BALANCE = "ERC20: transfer amount exceeds balance";

const DAO_UNSUPPORTED_CONTRACT = "GatewayDAO: target is not a supported contract";
const DAO_ONLY_GOVERNANCE = "Governor: onlyGovernance";
const DAO_BELOW_THRESHOLD = "GovernorCompatibilityBravo: proposer votes below proposal threshold";
const DAO_ABOVE_THRESHOLD = "BaseGovernorBravoUpgradeable: proposer above threshold";

const CASTING_UINT96 = "SafeCast: value doesn't fit in 96 bits";

const ERC20VOTE_EXPIRED_SIGNATURE = "ERC20Votes: signature expired";

const ERC20WRAPPER_REUSED_NONCE = "ERC20Wrapper: the nonce has already been used for this address";
const ERC20STAKEDVOTESUPGRADEABLE_CANNOT_STAKE_0_AMOUNT = "ERC20StakedVotesUpgradeable: Cannot stake 0 amount";

const RESERVABLE_EXCEEDED_UNRESERVED_BALANCE = "ERC20Reservable: transfer amount exceeds unreserved balance";
const RESERVABLE_INSUFFICIENT_UNRESERVED_BALANCE = "ERC20Reservable: insufficient unreserved balance";
const RESERVABLE_INVALID_BLOCK_NUMBER = "ERC20Reservable: invalid block expiry number";
const RESERVABLE_EXCUTE_ADDRESS_0 = "ERC20Reservable: cannot execute from zero address";
const RESERVABLE_NONCE_WAS_USED = "ERC20Reservable: the sender used the nonce already";
const RESERVABLE_RESERVATION_NOT_EXIST = "ERC20Reservable: reservation does not exist";
const RESERVABLE_INVALID_RESERVATION_STATUS_EXECUTE = "ERC20Reservable: invalid reservation status to execute";
const RESERVABLE_INVALID_RESERVATION_STATUS_RECLAIM = "ERC20Reservable: invalid reservation status to reclaim";
const RESERVABLE_RESERVATION_EXPIRED ="ERC20Reservable: reservation has expired and cannot be executed";
const RESERVABLE_ADDRESS_UNAUTHORIZED_EXECUTE ="ERC20Reservable: this address is not authorized to execute this reservation";
const RESERVABLE_ADDRESS_UNAUTHORIZED_RECLAIM  ="ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender";
const RESERVABLE_RESERVATION_NOT_EXPIRED_TO_RECLAIM ="ERC20Reservable: reservation has not expired or you are not the executor and cannot be reclaimed";

const populateRoleRestrictionMsg = (role, address) => "AccessControl: account " + address.toLowerCase() + " is missing role " + role;

module.exports = {
    INSUFFICIENT_ALLOWANCE,
    INSUFFICIENT_BALANCE,
    INSUFFICIENT_BALANCE_ETHLESS,
    NONCE_REUSED_ETHLESS,
    INVALID_SIGNATURE,
    INVALID_SIGNATURE_PERMIT,
    EXPIRED_SIGNATURE_PERMIT,
    INVALID_AMOUNT,
    EXCEEDED_BALANCE,
    RESTRICTED_TO_ADMIN,
    DAO_UNSUPPORTED_CONTRACT,
    DAO_ONLY_GOVERNANCE,
    DAO_BELOW_THRESHOLD,
    DAO_ABOVE_THRESHOLD,
    CASTING_UINT96,
    ERC20VOTE_EXPIRED_SIGNATURE,
    ERC20STAKEDVOTESUPGRADEABLE_CANNOT_STAKE_0_AMOUNT,
    ERC20WRAPPER_REUSED_NONCE,
    RESERVABLE_EXCEEDED_UNRESERVED_BALANCE,
    RESERVABLE_INSUFFICIENT_UNRESERVED_BALANCE,
    RESERVABLE_INVALID_BLOCK_NUMBER,
    RESERVABLE_EXCUTE_ADDRESS_0,
    RESERVABLE_NONCE_WAS_USED,
    RESERVABLE_RESERVATION_NOT_EXIST,
    RESERVABLE_INVALID_RESERVATION_STATUS_EXECUTE,
    RESERVABLE_INVALID_RESERVATION_STATUS_RECLAIM,
    RESERVABLE_RESERVATION_EXPIRED,
    RESERVABLE_ADDRESS_UNAUTHORIZED_EXECUTE,
    RESERVABLE_ADDRESS_UNAUTHORIZED_RECLAIM,
    RESERVABLE_RESERVATION_NOT_EXPIRED_TO_RECLAIM,
    populateRoleRestrictionMsg
}